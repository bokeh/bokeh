from __future__ import annotations

import json
from io import StringIO
from pathlib import Path
from types import SimpleNamespace
from typing import Any

from docutils import nodes
from pytest import MonkeyPatch
from sphinx.application import Sphinx
from sphinx.testing.util import _clean_up_global_state

from bokeh.sphinxext._internal import bokeh_gallery
from bokeh.sphinxext._internal.bokeh_sampledata_xref import (
    process_sampledata_xrefs,
    sampledata_list,
)


def test_sampledata_backlinks_sort_and_disambiguate_names(tmp_path: Path) -> None:
    scatter = "examples/basic/scatter"
    other_scatter = "examples/models/scatter"
    bars = "examples/plotting/bars"
    inventory = tmp_path / bokeh_gallery.EXAMPLE_INVENTORY
    inventory.write_text(json.dumps({"sampledata": {"iris": [scatter, other_scatter, bars]}}))
    builder = SimpleNamespace(get_relative_uri=lambda source, target: target)
    tree = nodes.container()
    tree += sampledata_list("", sampledata_key="iris")
    app = SimpleNamespace(builder=builder, doctreedir=tmp_path)
    process_sampledata_xrefs(app, tree, "index")
    links: list[Any] = list(tree.findall(nodes.reference))
    assert [(link.astext(), link["refuri"]) for link in links] == [
        ("bars", bars),
        ("scatter", scatter),
        ("scatter (models)", other_scatter),
    ]


def test_inventory_backlinks_follow_source_edits_and_removal(tmp_path: Path, monkeypatch: MonkeyPatch) -> None:
    monkeypatch.setattr(bokeh_gallery, "REPO_TOP", tmp_path)
    monkeypatch.setenv("BOKEH_SPHINX_QUICK", "1")
    source = tmp_path / "source"
    source.mkdir()
    (source / "conf.py").write_text(
        "extensions = ['bokeh.sphinxext.bokeh_plot', 'bokeh.sphinxext._internal.bokeh_sampledata_xref']\n"
        "bokeh_example_subdirs = ['rendered']\n",
    )
    (source / "index.rst").write_text(
        "Sample data\n===========\n\n"
        "Iris\n----\n\n.. bokeh-sampledata-xref:: iris\n\n"
        "Flowers\n-------\n\n.. bokeh-sampledata-xref:: flowers\n",
    )
    example = tmp_path / "examples/rendered/scatter.py"
    example.parent.mkdir(parents=True)
    text = (
        '"""Plot a dataset.\n\n.. bokeh-example-metadata::\n    :sampledata: iris\n"""\n'
        "from bokeh.sampledata.iris import flowers\nraise RuntimeError('do not run this example')\n"
    )
    example.write_text(text)
    unrendered = tmp_path / "examples/unrendered.py"
    unrendered.write_text(text)
    out = tmp_path / "html"

    def build() -> tuple[str, ...]:
        _clean_up_global_state()
        warnings = StringIO()
        app = Sphinx(source, source, out, tmp_path / "doctrees", "html",
                     status=StringIO(), warning=warnings, warningiserror=True)
        app.build()
        assert app.statuscode == 0, warnings.getvalue()
        html = (out / "index.html").read_text()
        return tuple(html.split(f'<section id="{name}">', 1)[1].split("</section>", 1)[0] for name in ("iris", "flowers"))

    link = 'href="docs/examples/rendered/scatter.html"'
    try:
        iris, flowers = build()
        assert link in iris and link not in flowers
        assert "unrendered.html" not in iris
        example.write_text(text.replace(":sampledata: iris", ":sampledata: flowers"))
        iris, flowers = build()
        assert link not in iris and link in flowers
        example.unlink()
        iris, flowers = build()
        assert link not in iris + flowers
    finally:
        _clean_up_global_state()
