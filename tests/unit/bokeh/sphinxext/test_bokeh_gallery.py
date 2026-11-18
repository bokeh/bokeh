#-----------------------------------------------------------------------------
# Copyright (c) Anaconda, Inc. and contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------

from __future__ import annotations

import json
from pathlib import Path

from bokeh.sphinxext._internal.bokeh_example_metadata import read_example_metadata

REPO_ROOT = Path(__file__).parents[4]
GALLERY = REPO_ROOT / "docs/bokeh/source/docs/gallery.json"
IMAGES = REPO_ROOT / "docs/bokeh/source/_images/examples/server/app"


def test_server_gallery_uses_new_demo_catalog() -> None:
    gallery = json.loads(GALLERY.read_text())
    assert set(gallery) == {"server/app"}
    entries = gallery["server/app"]

    names = [entry["name"] for entry in entries]
    assert names == [
        "mobility",
        "terrain-contours",
        "airport-access",
        "climate",
        "market-monitor",
        "task-scheduler",
        "chaotic-motion",
        "wave-field",
        "spectrum-monitor",
        "research-lineage",
        "image-processing",
        "cellular-automata",
    ]
    assert {path.name for path in IMAGES.glob("*.png")} == {
        f"{name}{suffix}.png"
        for name in names
        for suffix in ("", "@2x")
    }
    for entry in entries:
        name = entry["name"]
        assert entry["title"]
        assert entry["url"] == f"https://demo.bokeh.org/{name}"
        assert "https://github.com/bokeh/demo.bokeh.org/blob/main/" in entry["desc"]
        assert (IMAGES / f"{name}.png").is_file()
        assert (IMAGES / f"{name}@2x.png").is_file()


def test_example_metadata_does_not_parse_newer_python_syntax(tmp_path: Path) -> None:
    example = tmp_path / "example.py"
    example.write_text(
        '"""\n'
        'A ``scatter`` example with a `dataset`_.\n\n'
        '.. bokeh-example-metadata::\n'
        '    :apis: bokeh.plotting.figure.line,\n'
        '        bokeh.models.HoverTool\n'
        '    :gallery: A line plot.\n'
        '"""\n'
        'this is deliberately ! invalid syntax\n',
        encoding="utf-8",
    )
    summary, fields = read_example_metadata(example)
    assert summary == "A ``scatter`` example with a `dataset`_."
    assert fields == {
        "apis": "bokeh.plotting.figure.line, bokeh.models.HoverTool",
        "gallery": "A line plot.",
    }


def test_gallery_rejects_unknown_directory(tmp_path: Path, monkeypatch) -> None:
    from types import SimpleNamespace

    import pytest
    from sphinx.errors import SphinxError

    from bokeh.sphinxext._internal import bokeh_gallery

    monkeypatch.setattr(bokeh_gallery, "REPO_TOP", tmp_path)
    monkeypatch.setattr(bokeh_gallery, "_read_inventory", lambda directive: [])
    directive = SimpleNamespace(
        content=["topics/hierarchal"],
        env=SimpleNamespace(config=SimpleNamespace(bokeh_example_categories=[]), srcdir=tmp_path),
    )
    with pytest.raises(SphinxError, match=r"Unknown example category.*topics/hierarchal"):
        bokeh_gallery.BokehGalleryDirective.run(directive)


def test_empty_gallery_does_not_emit_raw_directive(tmp_path: Path, monkeypatch) -> None:
    from types import SimpleNamespace

    from bokeh.sphinxext._internal import bokeh_gallery

    (tmp_path / "examples/basic/lines").mkdir(parents=True)
    monkeypatch.setattr(bokeh_gallery, "REPO_TOP", tmp_path)
    monkeypatch.setattr(bokeh_gallery, "_read_inventory", lambda directive: [])
    directive = SimpleNamespace(
        content=["basic/lines"],
        env=SimpleNamespace(config=SimpleNamespace(bokeh_example_categories=[]), srcdir=tmp_path),
    )
    assert bokeh_gallery.BokehGalleryDirective.run(directive) == []


def test_category_defaults_and_overrides() -> None:
    from bokeh.sphinxext._internal.bokeh_gallery import _example_categories

    path = Path("plotting/stocks.py")
    assert _example_categories(path, {}) == ["plotting"]
    assert _example_categories(path, {"categories": "basic/lines, topics/timeseries, basic/lines"}) == [
        "basic/lines", "topics/timeseries",
    ]
    assert _example_categories(Path("basic/annotations/quiver.py"), {"categories": "topics/vector_fields"}) == [
        "topics/vector_fields",
    ]


def test_category_validation(tmp_path: Path) -> None:
    from types import SimpleNamespace

    import pytest
    from sphinx.errors import SphinxError

    from bokeh.sphinxext._internal.bokeh_gallery import _validate_category

    (tmp_path / "basic/lines").mkdir(parents=True)
    config = SimpleNamespace(bokeh_example_categories=["topics/vector_fields"])
    for category in ("basic/lines", "topics/vector_fields"):
        _validate_category(category, tmp_path, config)
    for category in ("basic/lnies", "topics/vector_feilds", "", "../examples", "/tmp", "basic/lines,"):
        with pytest.raises(SphinxError, match=r"Unknown example category.* in examples/plotting/stocks.py"):
            _validate_category(category, tmp_path, config, source=Path("plotting/stocks.py"))
