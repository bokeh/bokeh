from __future__ import annotations

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
    is_markdown_build,
    markdown_block,
    markdown_inline,
)
from bokeh.sphinxext._internal.bokeh_palette import _palette_markdown, bokeh_palette
from bokeh.sphinxext._internal.bokeh_palette_group import _palette_group_markdown
from bokeh.sphinxext.bokeh_plot import (
    add_page_resources,
    autoload_script,
    build_finished,
)


def _raw_formats(result: list[nodes.Node]) -> list[str]:
    return [node["format"] for node in result if isinstance(node, nodes.raw)]


def test_is_markdown_build() -> None:
    assert is_markdown_build(SimpleNamespace(builder=SimpleNamespace(format="markdown")))
    assert not is_markdown_build(SimpleNamespace(builder=SimpleNamespace(format="html")))
    assert not is_markdown_build(SimpleNamespace(builder=None))


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
    """))

    warnings = StringIO()
    app = Sphinx(
        str(source), str(source), str(tmp_path / "out"), str(tmp_path / "doctrees"), "markdown",
        status=None, warning=warnings, freshenv=True,
    )
    app.build()

    assert warnings.getvalue() == ""
    assert app.statuscode == 0

    text = (tmp_path / "out" / "index.md").read_text()
    assert "# Title" in text
    assert "The API reference." in text
    assert "* first" in text and "* second" in text
    assert "Blues: `#3182bd`, `#9ecae1`, `#deebf7`" in text
    assert "* **Bright** (sizes: " in text
    assert "p.line([1, 2], [3, 4])" in text
    assert "const plot = Bokeh.Plotting.figure()" in text

    for html_only in ("Not part of the page", "an author comment", "html-only", "<script", "bokeh-content-", "<span"):
        assert html_only not in text
