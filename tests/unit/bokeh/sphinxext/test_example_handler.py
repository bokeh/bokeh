from __future__ import annotations

# Bokeh imports
from bokeh.document import Document

# Module under test
import bokeh.sphinxext._internal.example_handler as m # isort:skip


def test_example_handler_supports_legacy_output_setup() -> None:
    source = """
from bokeh.io import output_notebook, show
from bokeh.plotting import figure

output_notebook()
show(figure())
"""

    doc = Document()
    handler = m.ExampleHandler(source, "example.py")
    handler.modify_document(doc)

    assert not handler.failed
    assert len(doc.roots) == 1
