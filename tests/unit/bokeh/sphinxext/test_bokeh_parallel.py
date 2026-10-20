from __future__ import annotations

# Standard library imports
import json
from pathlib import Path
from typing import Any

# External imports
import pytest
from sphinx.errors import SphinxError
from sphinx.testing.util import SphinxTestApp, _clean_up_global_state


def _search(output: Path) -> dict[str, Any]:
    return json.loads((output / "searchindex.js").read_text().removeprefix("Search.setIndex(").removesuffix(")"))


@pytest.fixture
def source(tmp_path: Path) -> Path:
    source = tmp_path / "source"
    source.mkdir()
    (source / "chapter").mkdir()
    (source / "conf.py").write_text("""
extensions = ['sphinx.ext.autodoc', 'bokeh.sphinxext._internal.bokeh_autodoc']
html_theme = 'basic'
project = 'Parallel writing'
nitpicky = True
""")
    files = {
        "index.rst": "Contents\n========\n\n.. toctree::\n\n   alpha\n   chapter/beta\n   hidden\n   z_nosearch\n",
        "alpha.rst": ("Alpha\n=====\n\nAmber pear. :py:func:`calculate`\n\n.. py:function:: calculate(value)\n\n"
                      "   Calculate a value.\n\n.. index:: single: green fruit\n\n.. image:: image.svg\n\n:download:`Payload <payload.txt>`\n"),
        "chapter/beta.rst": "Beta\n====\n\nCobalt plum. :doc:`../alpha` and :py:func:`calculate`.\n\n.. image:: image.svg\n",
        "hidden.rst": "Hidden\n======\n\n.. toctree::\n   :hidden:\n\n   leaf\n",
        "leaf.rst": "Leaf\n====\n\nSilver banana.\n",
        "z_nosearch.rst": ":no-search:\n\nExcluded\n========\n\nUnsearchable pineapple.\n",
        "payload.txt": "Download contents.\n",
        "image.svg": '<svg xmlns="http://www.w3.org/2000/svg" width="1" height="1"></svg>',
        "chapter/image.svg": '<svg xmlns="http://www.w3.org/2000/svg" width="2" height="2"></svg>',
    }
    for name, text in files.items():
        if name.endswith(".rst"):
            text += "\n.. index:: shared\n"
        (source / name).write_text(text)
    return source


def _build(source: Path, output: Path, enabled: bool | None, parallel: int = 2) -> SphinxTestApp:
    _clean_up_global_state()
    return SphinxTestApp(srcdir=source, builddir=output, parallel=parallel, warningiserror=True,
                         confoverrides={} if enabled is None else {"bokeh_parallel_write": enabled})


@pytest.mark.parametrize(("parallel", "force_serial"), [(1, False), (2, False), (3, False), (2, True)])
@pytest.mark.parametrize("enabled", [None, True])
def test_parallel_resolution_preserves_html_search_and_assets(
        source: Path, tmp_path: Path, monkeypatch: pytest.MonkeyPatch, parallel: int, force_serial: bool,
        enabled: bool | None) -> None:
    if force_serial:
        monkeypatch.setattr("sphinx.builders.parallel_available", False)

    def build(setting: bool | None) -> Path:
        output = tmp_path / ("standard" if setting is False else "parallel")
        app = _build(source, output, setting, parallel)
        try:
            app.build()
            assert app.statuscode == 0, app.warning.getvalue()
            assert not hasattr(app.builder, "_bokeh_original_write_parallel")
            assert app.config.bokeh_parallel_write is (setting is not False)
            assert ("Bokeh parallel writing:" in app.status.getvalue()) == (setting is not False and app.builder.parallel_ok)
            return output / "html"
        finally:
            app.cleanup()

    def compare() -> tuple[Path, Path]:
        baseline = build(False)
        candidate = build(enabled)
        assert _search(candidate) == _search(baseline)
        for file in baseline.rglob("*"):
            if file.is_file() and (file.suffix == ".html" or file.name == "objects.inv" or "_images" in file.parts or "_downloads" in file.parts):
                assert (candidate / file.relative_to(baseline)).read_bytes() == file.read_bytes(), file
        return baseline, candidate

    _, candidate = compare()
    index = _search(candidate)
    assert index["titles"][index["docnames"].index("z_nosearch")] == ""
    assert "pineappl" not in index["terms"]
    (source / "alpha.rst").write_text(
        "Alpha\n=====\n\nViolet mango.\n\n.. py:function:: calculate(value)\n\n   A changed description.\n\n.. index:: pair: new; item\n",
    )
    (source / "leaf.rst").unlink()
    (source / "hidden.rst").write_text("Hidden\n======\n\nNo children.\n")
    _, candidate = compare()
    index = _search(candidate)
    assert "leaf" not in index["docnames"]
    assert "mango" in index["terms"]
    assert "cobalt" in index["terms"]
    assert not index["terms"].get("amber")


def test_other_html_builders_keep_the_standard_writer(source: Path, tmp_path: Path) -> None:
    _clean_up_global_state()
    app = SphinxTestApp(srcdir=source, builddir=tmp_path / "output", buildername="dirhtml",
                        parallel=2, warningiserror=True)
    try:
        app.build()
        assert app.config.bokeh_parallel_write is True
        assert app.statuscode == 0, app.warning.getvalue()
        assert "Bokeh parallel writing:" not in app.status.getvalue()
        assert not hasattr(app.builder, "_bokeh_original_write_parallel")
    finally:
        app.cleanup()


def test_worker_reference_warnings_fail_the_build(source: Path, tmp_path: Path) -> None:
    (source / "z_nosearch.rst").write_text("Warning\n=======\n\n:py:class:`missing.Target`\n")
    app = _build(source, tmp_path / "output", True)
    try:
        app.build()
        assert app.statuscode == 1
        assert "missing.Target" in app.warning.getvalue()
        assert not hasattr(app.builder, "_bokeh_original_write_parallel")
    finally:
        app.cleanup()


def test_worker_failure_is_propagated_and_restores_builder(source: Path, tmp_path: Path) -> None:
    app = _build(source, tmp_path / "output", True)

    def fail(app: Any, doctree: Any, docname: str) -> None:
        if docname == "z_nosearch":
            raise RuntimeError("worker failed")

    app.connect("doctree-resolved", fail)
    try:
        with pytest.raises(SphinxError):
            app.build()
        assert not hasattr(app.builder, "_bokeh_original_write_parallel")
    finally:
        app.cleanup()
