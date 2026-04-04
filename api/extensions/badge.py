from markdown.extensions import Extension
from markdown.inlinepatterns import InlineProcessor
import re
import xml.etree.ElementTree as etree


class BadgeInlineProcessor(InlineProcessor):
    def handleMatch(self, m, data):
        text = (m.group(1) or "").strip()
        if not text:
            return None, m.start(0), m.end(0)

        slug = re.sub(r"[^a-z0-9]+", "-", text.lower()).strip("-")
        el = etree.Element("span")
        el.set("class", "mdoc-badge" + (f" mdoc-badge-{slug}" if slug else ""))
        el.text = text
        return el, m.start(0), m.end(0)


class BadgeExtension(Extension):
    def extendMarkdown(self, md):
        pattern = r":badge\[([^\]]+)\]"
        md.inlinePatterns.register(BadgeInlineProcessor(pattern, md), "mdoc-badge", 175)


def makeExtension(**kwargs):
    return BadgeExtension(**kwargs)
