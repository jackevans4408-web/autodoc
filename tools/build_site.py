"""Build the public web pages (privacy policy and support) from the text inside the app.

The app's screens are the source of truth, so the website cannot drift from what the app says.
Usage:  python tools/build_site.py [output_dir]      (default: site)
"""
import html
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
FRONTEND = ROOT / "frontend"
CONTACT = "jack.evans4408@gmail.com"

CSS = """
body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 780px; margin: 0 auto; padding: 40px 20px 80px; background: #0d0d0e; color: #e8e6e0; line-height: 1.7; }
h1 { color: #f5a623; font-size: 30px; margin-bottom: 4px; }
h2 { color: #f5a623; font-size: 19px; margin-top: 36px; }
h3 { color: #e8e6e0; font-size: 16px; margin-top: 22px; margin-bottom: 4px; }
p, li { font-size: 15px; color: #d8d6d0; }
ul { padding-left: 22px; }
a { color: #f5a623; }
.meta { color: #888; font-size: 13px; }
nav { margin-bottom: 28px; font-size: 14px; }
nav a { margin-right: 18px; }
.faq h3 { margin-top: 26px; }
footer { margin-top: 56px; color: #888; font-size: 13px; }
"""


def clean(text: str) -> str:
    """Turn a piece of JSX/JS string content into plain text."""
    text = re.sub(r"\{\s*\"([^\"]*)\"\s*\}", r"\1", text)  # {" "} style expressions
    text = text.replace("\\'", "'").replace('\\"', '"').replace("\\n", " ")
    text = html.unescape(text)
    return re.sub(r"\s+", " ", text).strip()


def linkify(escaped: str) -> str:
    return re.sub(r"([\w.+-]+@[\w-]+\.[\w.-]+)", r'<a href="mailto:\1">\1</a>', escaped)


def page(title: str, body: str, current: str) -> str:
    nav = "".join(
        f'<a href="{href}"{" style=\"font-weight:600\"" if href == current else ""}>{label}</a>'
        for href, label in [("index.html", "Home"), ("privacy.html", "Privacy Policy"), ("support.html", "Support")]
    )
    return f"""<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>{html.escape(title)}</title>
<style>{CSS}</style>
</head>
<body>
<nav>{nav}</nav>
{body}
<footer>Engine Eye &middot; <a href="mailto:{CONTACT}">{CONTACT}</a></footer>
</body>
</html>
"""


def build_privacy() -> str:
    src = (FRONTEND / "PrivacyPolicyScreen.js").read_text(encoding="utf-8")
    parts = ["<h1>Engine Eye Privacy Policy</h1>"]
    in_list = False
    for style, text in re.findall(r"<Text style=\{styles\.(\w+)\}>(.*?)</Text>", src, re.S):
        if style in ("backText", "headerText"):
            continue
        t = clean(text)
        if style == "bullet":
            t = re.sub(r"^[•\-]\s*", "", t)
            if not in_list:
                parts.append("<ul>")
                in_list = True
            parts.append(f"<li>{linkify(html.escape(t))}</li>")
            continue
        if in_list:
            parts.append("</ul>")
            in_list = False
        e = linkify(html.escape(t))
        parts.append(
            {
                "section": f"<h2>{e}</h2>",
                "subheader": f"<h3>{e}</h3>",
                "lastUpdated": f'<p class="meta">{e}</p>',
            }.get(style, f"<p>{e}</p>")
        )
    if in_list:
        parts.append("</ul>")
    return page("Engine Eye Privacy Policy", "\n".join(parts), "privacy.html")


def build_support() -> str:
    src = (FRONTEND / "HelpFAQScreen.js").read_text(encoding="utf-8")
    faq = re.findall(r'question:\s*"((?:[^"\\]|\\.)*)",\s*answer:\s*"((?:[^"\\]|\\.)*)"', src, re.S)
    items = "\n".join(f"<h3>{html.escape(clean(q))}</h3>\n<p>{linkify(html.escape(clean(a)))}</p>" for q, a in faq)
    body = f"""<h1>Engine Eye Support</h1>
<p>Need help with Engine Eye? Email <a href="mailto:{CONTACT}">{CONTACT}</a>. We usually reply within 1 to 2 business days.</p>
<h2>Delete your account</h2>
<p>You can delete your account and all of your saved diagnoses yourself, any time, in the app: open Settings and choose Delete Account. You can also withdraw permission to send your questions to our AI service under Settings, Withdraw AI permission.</p>
<h2>Frequently asked questions</h2>
<div class="faq">
{items}
</div>
<p>Read our <a href="privacy.html">Privacy Policy</a>.</p>"""
    return page("Engine Eye Support", body, "support.html")


def build_index() -> str:
    body = f"""<h1>Engine Eye</h1>
<p>AI-powered car diagnostics. Describe a problem or snap a photo, understand repair quotes, look up OBD-II codes and safety recalls, and keep track of your repairs and maintenance.</p>
<p><a href="support.html">Support</a> &middot; <a href="privacy.html">Privacy Policy</a></p>"""
    return page("Engine Eye", body, "index.html")


def main() -> None:
    out = Path(sys.argv[1]) if len(sys.argv) > 1 else ROOT / "site"
    out.mkdir(parents=True, exist_ok=True)
    for name, content in [("index.html", build_index()), ("privacy.html", build_privacy()), ("support.html", build_support())]:
        (out / name).write_text(content, encoding="utf-8", newline="\n")
        print(f"wrote {out / name} ({len(content)} bytes)")
    (out / ".nojekyll").write_text("", encoding="utf-8")


if __name__ == "__main__":
    main()
