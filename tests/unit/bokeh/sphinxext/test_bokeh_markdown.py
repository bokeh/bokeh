from __future__ import annotations

import re
from io import StringIO
from pathlib import Path
from textwrap import dedent
from types import SimpleNamespace

import pandas as pd
import pytest
from docutils import nodes
from docutils.utils import new_document
from sphinx.application import Sphinx

from bokeh.palettes import Blues8, viridis
from bokeh.sphinxext._internal.bokeh_color import BokehColorDirective
from bokeh.sphinxext._internal.bokeh_dataframe import _dataframe_markdown
from bokeh.sphinxext._internal.bokeh_markdown import (
    MARKDOWN_FORMAT,
    _fail_on_warnings,
    is_markdown_build,
    markdown_block,
    markdown_inline,
)
from bokeh.sphinxext._internal.bokeh_palette import _palette_markdown, bokeh_palette
from bokeh.sphinxext._internal.bokeh_palette_group import _palette_group_markdown
from bokeh.sphinxext._internal.templates import RELEASE_DETAIL
from bokeh.sphinxext.bokeh_plot import (
    add_page_resources,
    autoload_script,
    build_finished,
)

# a 1x1 pixel image
_PNG = bytes.fromhex(
    "89504e470d0a1a0a0000000d49484452000000010000000108060000001f15c489"
    "0000000d49444154789c6360000002000001e221bc330000000049454e44ae426082",
)


def _build_markdown(source: Path, tmp_path: Path) -> list[str]:
    """Run a Markdown build and return its warnings."""
    warnings = StringIO()
    app = Sphinx(
        str(source), str(source), str(tmp_path / "out"), str(tmp_path / "doctrees"), "markdown",
        status=None, warning=warnings, freshenv=True,
    )
    app.build()
    # Sphinx warns about its own nodes when a process creates more than one application
    return [line for line in warnings.getvalue().splitlines() if "is already registered" not in line]


def _raw_formats(result: list[nodes.Node]) -> list[str]:
    return [node["format"] for node in result if isinstance(node, nodes.raw)]


def test_is_markdown_build() -> None:
    assert is_markdown_build(SimpleNamespace(builder=SimpleNamespace(format="markdown")))
    assert not is_markdown_build(SimpleNamespace(builder=SimpleNamespace(format="html")))
    assert not is_markdown_build(SimpleNamespace(builder=None))


@pytest.mark.parametrize("builder_format, warncount, statuscode", [
    ("markdown", 0, 0),
    ("markdown", 1, 1),
    ("html", 1, 0),
])
def test_markdown_build_fails_on_warnings(builder_format: str, warncount: int, statuscode: int) -> None:
    app = SimpleNamespace(builder=SimpleNamespace(format=builder_format), _warncount=warncount, statuscode=0)
    _fail_on_warnings(app, None)
    assert app.statuscode == statuscode


def test_sphinx_counts_warnings() -> None:
    # _fail_on_warnings depends on this private attribute
    assert "_warncount" in Sphinx.__annotations__


def test_release_template_has_a_markdown_table() -> None:
    rendered = RELEASE_DETAIL.render(version="3.0.0", table=[("bokeh-3.0.0.js", "abc"), ("bokeh-3.0.0.min.js", "def")])
    assert rendered.rstrip().endswith(
        "    .. raw:: markdown\n\n"
        "        | Filename | Hash |\n"
        "        | --- | --- |\n"
        "        | `bokeh-3.0.0.js` | `abc` |\n"
        "        | `bokeh-3.0.0.min.js` | `def` |",
    )
    assert "raw:: markdown" not in RELEASE_DETAIL.render(version="3.0.0", table=[])


def test_markdown_nodes_are_only_for_markdown() -> None:
    block = markdown_block("| a |")
    inline = markdown_inline("`#fff`")
    assert block["format"] == inline["format"] == MARKDOWN_FORMAT
    assert block.astext() == "\n\n| a |\n\n"
    assert inline.astext() == "`#fff`"


def test_palette_markdown_lists_short_palettes_in_full() -> None:
    assert _palette_markdown(Blues8) == ", ".join(f"`{color}`" for color in Blues8)


def test_palette_markdown_abbreviates_long_palettes() -> None:
    palette = viridis(256)
    text = _palette_markdown(palette)
    assert text.startswith(f"`{palette[0]}`, `{palette[1]}`, `{palette[2]}`, ..., ")
    assert text.endswith(f"`{palette[-1]}` (256 colors)")
    assert text.count("`") == 12


def test_palette_role_emits_html_and_markdown() -> None:
    result, messages = bokeh_palette("bokeh-palette", ":bokeh-palette:`Blues8`", "Blues8", 1, None)
    assert messages == []
    assert _raw_formats(result) == ["html", MARKDOWN_FORMAT]
    assert Blues8[0] in result[1].astext()


def test_color_directive_emits_html_and_markdown() -> None:
    directive = BokehColorDirective.__new__(BokehColorDirective)
    directive.arguments = ["aliceblue"]
    result = directive.run()
    assert _raw_formats(result) == ["html", MARKDOWN_FORMAT]
    assert result[1].astext().strip() == "aliceblue: `#f0f8ff`"


def test_dataframe_markdown_is_a_pipe_table() -> None:
    df = pd.DataFrame({"name": ["a|b", "c"], "value": [1, 2]}, index=["x", "y"])
    assert _dataframe_markdown(df).split("\n") == [
        "|  | name | value |",
        "| --- | --- | --- |",
        "| x | a\\|b | 1 |",
        "| y | c | 2 |",
    ]


def test_palette_group_markdown_lists_displayed_sizes() -> None:
    lines = _palette_group_markdown("mpl").split("\n")
    [viridis_line] = [line for line in lines if line.startswith("* **Viridis**")]
    # the 256 color variant is not displayed, same as in HTML
    assert "(sizes: 3, 4, 5, 6, 7, 8, 9, 10, 11)" in viridis_line
    assert "256" not in viridis_line
    assert "Viridis11: `#440154`" in viridis_line


def test_plots_and_their_targets_are_removed_from_markdown() -> None:
    document = new_document("plots")
    # docutils moves the id of a bokeh-plot target to the node that follows it
    document += nodes.target("", "", refid="page.bokeh-content-abc-page.json")
    document += nodes.target("", "", refid="a-real-label")
    document += nodes.paragraph("", "docstring", ids=["page.bokeh-content-abc-page.json", "a-real-label"])
    document += autoload_script(ids=["page.bokeh-content-def-page.json"])
    document += nodes.literal_block("", "show(p)")

    add_page_resources(SimpleNamespace(builder=SimpleNamespace(format="markdown")), document, "plots")

    assert list(document.findall(autoload_script)) == []
    assert [target["refid"] for target in document.findall(nodes.target)] == ["a-real-label"]
    assert [node["ids"] for node in document.findall(nodes.Element) if node["ids"]] == [["a-real-label"]]
    assert document.astext().split() == ["docstring", "show(p)"]


# the bokeh-tree role uses a deprecated Sphinx API
@pytest.mark.filterwarnings("ignore:.*BuildEnvironment.app.*")
def test_plot_without_source_links_to_its_file_in_markdown(tmp_path: Path, monkeypatch: pytest.MonkeyPatch) -> None:
    pytest.importorskip("sphinx_markdown_builder")
    # REPO_TOP is derived from the working directory of a documentation build
    monkeypatch.setattr("bokeh.sphinxext._internal.REPO_TOP", Path(__file__).parents[4])

    source = tmp_path / "source"
    source.mkdir()
    (source / "conf.py").write_text(dedent("""
        extensions = [
            "sphinx_markdown_builder",
            "bokeh.sphinxext.bokeh_plot",
            "bokeh.sphinxext._internal.bokeh_markdown",
            "bokeh.sphinxext._internal.bokeh_roles",
        ]
        version = "4.0.0"
    """))
    (source / "index.rst").write_text(dedent("""
        Title
        =====

        .. bokeh-plot:: __REPO__/examples/basic/lines/line_steps.py
            :source-position: none
    """))

    assert _build_markdown(source, tmp_path) == []
    text = (tmp_path / "out" / "index.md").read_text()
    assert "[examples/basic/lines/line_steps.py](https://github.com/bokeh/bokeh/tree/4.0.0/examples/basic/lines/line_steps.py)" in text
    assert "p.step(" not in text


@pytest.mark.parametrize("builder_format, copied", [("html", True), ("markdown", False)])
def test_plot_payloads_are_only_copied_for_html(tmp_path: Path, builder_format: str, copied: bool) -> None:
    payload = tmp_path / "bokeh-content-abc-page.json"
    payload.write_text("{}")
    outdir = tmp_path / "out"
    app = SimpleNamespace(
        builder=SimpleNamespace(format=builder_format, outdir=str(outdir)),
        env=SimpleNamespace(bokeh_plot_files={"docs/page": {str(payload)}}, bokeh_plot_timings=[]),
        verbosity=0,
    )

    build_finished(app, None)

    assert (outdir / "docs" / payload.name).exists() == copied


def test_markdown_build_of_html_only_content(tmp_path: Path) -> None:
    pytest.importorskip("sphinx_markdown_builder")

    source = tmp_path / "source"
    source.mkdir()
    (source / "conf.py").write_text(dedent("""
        extensions = [
            "sphinx_markdown_builder",
            "bokeh.sphinxext.bokeh_plot",
            "bokeh.sphinxext._internal.bokeh_markdown",
            "bokeh.sphinxext._internal.bokeh_palette",
            "bokeh.sphinxext._internal.bokeh_palette_group",
            "bokeh.sphinxext._internal.bokehjs_content",
        ]
    """))
    (source / "index.rst").write_text(dedent("""
        .. meta::
            :description: Not part of the page

        Title
        =====

        .. toctree::

            sub/page

        .. an author comment

        The :abbr:`API (application programming interface)` reference.

        .. raw:: html

            <div class="html-only"></div>

        .. hlist::
            :columns: 2

            * first
            * second

        Blues: :bokeh-palette:`Blues3`

        .. bokeh-palette-group:: tol

        .. bokeh-plot::

            from bokeh.plotting import figure, show

            p = figure()
            p.line([1, 2], [3, 4])
            show(p)

        .. bokehjs-content::
            :disable_codepen: true

            const plot = Bokeh.Plotting.figure()

        A plot without its source:

        .. bokeh-plot::
            :source-position: none

            from bokeh.plotting import figure, show

            hidden = figure()
            hidden.scatter([1, 2], [3, 4])
            show(hidden)

        .. raw:: markdown

            [written for Markdown](https://example.org)
    """))
    (source / "pics").mkdir()
    (source / "pics" / "dot.png").write_bytes(_PNG)
    (source / "sub").mkdir()
    (source / "sub" / "page.rst").write_text(dedent("""
        Page
        ====

        .. image:: /pics/dot.png
            :alt: a dot

        .. image:: https://example.org/remote.png
            :alt: remote
    """))

    assert _build_markdown(source, tmp_path) == []

    text = (tmp_path / "out" / "index.md").read_text()
    assert "# Title" in text
    assert "The API reference." in text
    assert "* first" in text and "* second" in text
    assert "Blues: `#3182bd`, `#9ecae1`, `#deebf7`" in text
    assert "* **Bright** (sizes: " in text
    assert "p.line([1, 2], [3, 4])" in text
    assert "const plot = Bokeh.Plotting.figure()" in text
    # a plot without source and without a file to link to keeps its source
    assert "hidden.scatter([1, 2], [3, 4])" in text
    assert "\n\n[written for Markdown](https://example.org)\n" in text

    # images are linked where the HTML build puts them
    page = (tmp_path / "out" / "sub" / "page.md").read_text()
    assert "![a dot](../_images/dot.png)" in page
    assert "![remote](https://example.org/remote.png)" in page

    for html_only in ("Not part of the page", "an author comment", "html-only", "<script", "bokeh-content-", "<span"):
        assert html_only not in text


# sphinx_llm uses a deprecated docutils API
@pytest.mark.filterwarnings("ignore:.*traverse.*")
def test_html_and_markdown_pages_are_published_together(tmp_path: Path) -> None:
    pytest.importorskip("sphinx_llm")

    source = tmp_path / "source"
    (source / "pics").mkdir(parents=True)
    (source / "pics" / "dot.png").write_bytes(_PNG)
    (source / "sub").mkdir()
    (source / "conf.py").write_text(dedent("""
        project = "Test"
        extensions = [
            "sphinx_llm.txt",
            "bokeh.sphinxext.bokeh_plot",
            "bokeh.sphinxext._internal.bokeh_markdown",
        ]
        llms_txt_build_parallel = False
        llms_txt_nested_enabled = False
        llms_txt_suffix_mode = "replace"
    """))
    (source / "index.rst").write_text(dedent("""
        Title
        =====

        .. toctree::

            sub/page
    """))
    (source / "sub" / "page.rst").write_text(dedent("""
        Page
        ====

        Back to :doc:`the start </index>`.

        .. image:: /pics/dot.png
            :alt: a dot

        .. bokeh-plot::
            :source-position: none

            from bokeh.plotting import figure, show

            hidden = figure()
            hidden.scatter([1, 2], [3, 4])
            show(hidden)
    """))

    out = tmp_path / "out"
    warnings = StringIO()
    app = Sphinx(str(source), str(source), str(out), str(tmp_path / "doctrees"), "html", status=None, warning=warnings)
    app.build()
    assert [line for line in warnings.getvalue().splitlines() if "is already registered" not in line] == []

    assert (out / "llms.txt").is_file()
    html = (out / "sub" / "page.html").read_text()
    assert 'type="text/markdown" href="page.md"' in html
    # the stand-in for the source of the plot is only for Markdown
    assert "hidden.scatter" not in html

    page = (out / "sub" / "page.md").read_text()
    assert "hidden.scatter([1, 2], [3, 4])" in page
    assert "<script" not in page
    targets = re.findall(r"\]\(([^)#]+)", page)
    assert "../index.md" in targets
    assert "../_images/dot.png" in targets
    for target in targets:
        assert (out / "sub" / target).is_file(), target
