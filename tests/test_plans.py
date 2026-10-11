from datetime import datetime, timedelta, timezone

from backend import plans

NOW = datetime(2026, 10, 11, 12, 0, tzinfo=timezone.utc)


def test_free_plan_matches_product_spec():
    assert plans.limit_for("free", "diagnosis") == 10
    assert plans.limit_for("free", "quote") == 1


def test_paid_plan_limits():
    assert plans.limit_for("plus", "diagnosis") == 50
    assert plans.limit_for("plus", "quote") == 25
    assert plans.limit_for("unlimited", "diagnosis") is None
    assert plans.limit_for("unlimited", "quote") is None


def test_followups_have_their_own_allowance_on_every_tier():
    for tier in plans.TIERS:
        assert "followup" in plans.LIMITS[tier]
    assert plans.limit_for("free", "followup") > plans.limit_for("free", "diagnosis")


def test_effective_tier_lapses_to_free_after_expiry():
    assert plans.effective_tier("plus", NOW + timedelta(days=3), NOW) == "plus"
    assert plans.effective_tier("plus", NOW - timedelta(seconds=1), NOW) == "free"
    assert plans.effective_tier("plus", NOW, NOW) == "free"


def test_effective_tier_defaults_to_free_for_missing_or_unknown():
    assert plans.effective_tier(None, None, NOW) == "free"
    assert plans.effective_tier("gold", NOW + timedelta(days=1), NOW) == "free"
    assert plans.effective_tier("free", NOW + timedelta(days=1), NOW) == "free"


def test_tier_for_product_default_mapping():
    assert plans.tier_for_product("engineeye_plus_monthly") == "plus"
    assert plans.tier_for_product("engineeye_unlimited_monthly") == "unlimited"
    assert plans.tier_for_product("something_else") is None


def test_tier_for_product_falls_back_to_entitlements_highest_wins():
    assert plans.tier_for_product("renamed", ["plus"]) == "plus"
    assert plans.tier_for_product("renamed", ["plus", "unlimited"]) == "unlimited"
    assert plans.tier_for_product(None, None) is None


def test_product_mapping_can_be_overridden_by_env(monkeypatch):
    monkeypatch.setenv("REVENUECAT_PRODUCT_TIERS", '{"my.plus": "plus", "bad": "free"}')
    assert plans.tier_for_product("my.plus") == "plus"
    assert plans.tier_for_product("bad") is None
    assert plans.tier_for_product("engineeye_plus_monthly") is None


def test_bad_env_mapping_falls_back_to_defaults(monkeypatch):
    monkeypatch.setenv("REVENUECAT_PRODUCT_TIERS", "not json")
    assert plans.tier_for_product("engineeye_plus_monthly") == "plus"


def test_enforcement_flag(monkeypatch):
    monkeypatch.delenv("ENFORCE_USAGE_LIMITS", raising=False)
    assert plans.enforcement_enabled() is False
    for value in ("1", "true", "TRUE", "yes", "on"):
        monkeypatch.setenv("ENFORCE_USAGE_LIMITS", value)
        assert plans.enforcement_enabled() is True
    for value in ("0", "false", "", "off"):
        monkeypatch.setenv("ENFORCE_USAGE_LIMITS", value)
        assert plans.enforcement_enabled() is False
