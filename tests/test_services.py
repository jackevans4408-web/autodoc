from types import SimpleNamespace

from backend.services import claude_service, nhtsa_service, youtube_service


class FakeResponse:
    def __init__(self, data):
        self._data = data

    def json(self):
        return self._data


def test_get_recalls_summarises_first_three(monkeypatch):
    results = [{"NHTSACampaignNumber": str(i), "Component": "c", "Summary": "s", "Consequence": "x", "Remedy": "r"} for i in range(5)]
    monkeypatch.setattr(nhtsa_service.requests, "get", lambda url, timeout: FakeResponse({"results": results}))
    recalls = nhtsa_service.get_recalls("2015", "Honda", "Civic")
    assert [r["campaign"] for r in recalls] == ["0", "1", "2"]


def test_get_recalls_none_when_empty_or_error(monkeypatch):
    monkeypatch.setattr(nhtsa_service.requests, "get", lambda url, timeout: FakeResponse({"results": []}))
    assert nhtsa_service.get_recalls("2015", "Honda", "Civic") is None

    def boom(url, timeout):
        raise RuntimeError("network")

    monkeypatch.setattr(nhtsa_service.requests, "get", boom)
    assert nhtsa_service.get_recalls("2015", "Honda", "Civic") is None


def test_format_recalls():
    assert nhtsa_service.format_recalls_for_claude(None) == "No active recalls found for this vehicle."
    text = nhtsa_service.format_recalls_for_claude(
        [{"campaign": "24V1", "component": "AIR BAGS", "summary": "s", "consequence": "c", "remedy": "r"}]
    )
    assert "1 recall(s)" in text and "24V1" in text and "AIR BAGS" in text


def test_youtube_parses_videos_and_builds_query(monkeypatch):
    seen = {}

    def fake_get(url, params, timeout):
        seen.update(params)
        return FakeResponse({"items": [{"id": {"videoId": "abc"}, "snippet": {"title": "T", "channelTitle": "Ch"}}]})

    monkeypatch.setattr(youtube_service.requests, "get", fake_get)
    videos = youtube_service.get_repair_videos("brake noise", "2015", "Honda", "Civic")
    assert videos == [{"title": "T", "channel": "Ch", "url": "https://www.youtube.com/watch?v=abc", "video_id": "abc"}]
    assert seen["q"].startswith("2015 Honda Civic brake noise")
    assert seen["maxResults"] == 3


def test_youtube_returns_empty_on_error(monkeypatch):
    def boom(url, params, timeout):
        raise RuntimeError("quota")

    monkeypatch.setattr(youtube_service.requests, "get", boom)
    assert youtube_service.get_repair_videos("x") == []


class FakeMessages:
    def __init__(self):
        self.kwargs = None

    def create(self, **kwargs):
        self.kwargs = kwargs
        return SimpleNamespace(content=[SimpleNamespace(text="AI ANSWER")])


def _patch_client(monkeypatch):
    fake = SimpleNamespace(messages=FakeMessages())
    monkeypatch.setattr(claude_service, "client", fake)
    return fake.messages


def test_diagnose_car_builds_diagnosis_prompt(monkeypatch):
    messages = _patch_client(monkeypatch)
    out = claude_service.diagnose_car(text="rattle", car_info="2015 Honda Civic", recall_info="RECALLS")
    assert out == "AI ANSWER"
    sent = messages.kwargs["messages"]
    assert len(sent) == 1 and sent[0]["role"] == "user"
    prompt = sent[0]["content"][-1]["text"]
    assert prompt.startswith("[MODE: DIAGNOSIS]")
    assert "Vehicle: 2015 Honda Civic" in prompt and "RECALLS" in prompt and "rattle" in prompt


def test_diagnose_car_followup_omits_recalls_and_keeps_history(monkeypatch):
    messages = _patch_client(monkeypatch)
    history = [{"role": "user", "content": "q"}, {"role": "assistant", "content": "a"}]
    claude_service.diagnose_car(text="more", recall_info="RECALLS", conversation_history=history, is_followup=True)
    sent = messages.kwargs["messages"]
    assert sent[:2] == history and len(sent) == 3
    prompt = sent[-1]["content"][-1]["text"]
    assert prompt.startswith("[MODE: FOLLOWUP]") and "RECALLS" not in prompt


def test_diagnose_car_attaches_image_first(monkeypatch):
    messages = _patch_client(monkeypatch)
    claude_service.diagnose_car(text="see photo", image_data=b"abc", image_type="image/jpeg")
    content = messages.kwargs["messages"][0]["content"]
    assert content[0]["type"] == "image" and content[0]["source"]["media_type"] == "image/jpeg"
    assert content[1]["type"] == "text"
