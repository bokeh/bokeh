from __future__ import annotations

# Standard library imports
import re
import time

# Bokeh imports
from bokeh.sphinxext._internal.bokeh_jinja import _extract_leading_doc, _strip_doc_comments

# Reference implementation of the previous regex-based behaviour, kept inline so
# the equivalence check below is self-contained and does not depend on the
# implementation under test.
_OLD_DOCPAT = re.compile(r"\{\#(.+?)\#\}", flags=re.MULTILINE | re.DOTALL)


def _old_extract(template_text: str) -> str | None:
    m = _OLD_DOCPAT.match(template_text)
    return m.group(1) if m else None


def _old_strip(template_text: str) -> str:
    return _OLD_DOCPAT.sub("", template_text)


# Edge cases that pin down the exact semantics of the doc-comment parsing:
# leading vs. embedded comments, empty bodies, unterminated opens, nested
# opens, adjacent comments, CRLF line endings, and non-ASCII content.
_CASES: list[str] = [
    "",
    "no comment here",
    "{##}",
    "{#}",
    "{#a#}",
    "{# a #}",
    "{#a#} middle {#b#}",
    "prefix {#a#} suffix",
    "x{#a#}",
    "{#a#} {#b#} {#c#}",
    "{#a#}{#b#}",
    "{#unterminated",
    "{#a#} {#unterminated",
    "{#{#}#}",
    "{#a#}#}",
    "{#a # b#}",
    "{##a#}",
    "{{#a#}}",
    "{#a#} {#b#} {#c#} {#d#}",
    "{#doc\r\nmore\r\n#}\r\nbody",
    "{#héllo wörld — ünïcode#} body",
    "{#a#}\n{#b#}\n{#c#}",
    "text {#x#} {#y#} tail",
    "{#a#}{#b#}{#c#}",
    "{#a#} {#b#} {#c#} {#d#} {#e#}",
]


def test_doc_comment_parsing_matches_reference() -> None:
    for case in _CASES:
        assert _extract_leading_doc(case) == _old_extract(case), f"extract diverged on {case!r}"
        assert _strip_doc_comments(case) == _old_strip(case), f"strip diverged on {case!r}"


def test_doc_comment_parsing_is_bounded_on_malformed_input() -> None:
    # A large string of repeated unterminated opens is the input that made the
    # old regex scan quadratically. The linear implementation must finish well
    # within a generous absolute bound; the old implementation needs many
    # seconds for this input.
    malformed = "{#" * 50_000  # 100k characters

    start = time.perf_counter()
    doc = _extract_leading_doc(malformed)
    stripped = _strip_doc_comments(malformed)
    elapsed = time.perf_counter() - start

    assert doc is None
    assert stripped == malformed
    assert elapsed < 2.0, f"doc-comment parsing took {elapsed:.3f}s on 100k malformed input"
