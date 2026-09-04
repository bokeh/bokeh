from __future__ import annotations

# Standard library imports
import json
from pathlib import Path

# Bokeh imports
import bokeh


def test_wheel_contains_built_notebook_adapters_without_legacy_protocol() -> None:
    package = Path(bokeh.__file__).parent / "jupyter"
    anywidget = (package / "anywidget.js").read_text()
    labextension = package / "labextension"
    javascript = "\n".join(path.read_text() for path in sorted((labextension / "static").glob("*.js")))

    assert json.loads((labextension / "package.json").read_text())["name"] == "@bokeh/bokeh-jupyter"
    assert "application/vnd.bokeh.display+json" in javascript
    assert "PAYLOAD_INVALID" in anywidget
    assert "application/vnd.bokeh.document+json" not in anywidget + javascript
    assert "embed_items_notebook" not in anywidget + javascript
    assert "Bokeh.index" not in anywidget + javascript
    assert "Bokeh.documents" not in anywidget + javascript
    assert "view_manager" not in anywidget + javascript
    assert "_bokeh_notebook_artifacts" not in anywidget + javascript
