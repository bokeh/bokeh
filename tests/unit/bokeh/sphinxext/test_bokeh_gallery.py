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
        '    :gallery:\n'
        '    :thumbnail-alt: A line plot.\n'
        '    :apis: bokeh.plotting.figure.line,\n'
        '        bokeh.models.HoverTool\n'
        '"""\n'
        'this is deliberately ! invalid syntax\n',
        encoding="utf-8",
    )
    summary, fields = read_example_metadata(example)
    assert summary == "A scatter example with a dataset."
    assert fields == {
        "gallery": "",
        "thumbnail-alt": "A line plot.",
        "apis": "bokeh.plotting.figure.line, bokeh.models.HoverTool",
    }
