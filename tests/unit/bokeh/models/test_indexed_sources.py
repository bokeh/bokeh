from typing import TYPE_CHECKING, Any, cast

import pytest

from bokeh.core.validation import check_integrity
from bokeh.document import Document
from bokeh.document.events import ModelChangedEvent
from bokeh.models import (
    Bezier,
    BoxEditTool,
    ColumnDataSource,
    DataSource,
    DataView,
    EditTool,
    FreehandDrawTool,
    GlyphRenderer,
    GraphRenderer,
    GroupFilter,
    IndexedDataSource,
    Line,
    LineEditTool,
    Patches,
    PointDrawTool,
    PolyDrawTool,
    PolyEditTool,
    Rect,
    Scatter,
)
from bokeh.plotting import figure
from bokeh.protocol import apply_patch, patch_doc
from examples.server.app.record_data_source.record_data_source import RecordDataSource

if TYPE_CHECKING:
    from bokeh.core.has_props import Setter
    from bokeh.models.glyph import Glyph

def test_record_source_plotting() -> None:
    source = RecordDataSource(records=[dict(x=1, y=2, name="first")])
    assert isinstance(source, IndexedDataSource)
    assert isinstance(source, DataSource)
    assert "data" not in source.properties()
    assert "selected" not in DataSource.properties()
    plot = figure()
    renderer = plot.scatter("x", "y", source=source,
                            view=DataView(filter=GroupFilter(field_name="name", group="first")))
    assert renderer.data_source is source
    assert plot.add_glyph(source, Scatter()).data_source is source
    assert isinstance(renderer.view.filter, GroupFilter)
    assert renderer.view.filter.field_name == "name"
    assert check_integrity([renderer]).error == []


def test_record_source_held_protocol_updates_and_setter() -> None:
    source = RecordDataSource(records=[dict(x=1, y=2)])
    doc = Document()
    doc.add_root(source)
    copy = Document.from_json(doc.to_json())
    other = copy.get_model_by_id(source.id)
    assert isinstance(other, RecordDataSource)
    events = []
    callbacks = []
    source.on_change("records", lambda attr, old, new: callbacks.append(new))
    doc.on_change(events.append)
    doc.hold("combine")
    source.records = [dict(x=3, y=4)]
    source.records = [dict(x=5, y=6), dict(x=7, y=8)]
    assert events == []
    doc.unhold()
    assert len(events) == 1
    assert len(callbacks) == 1
    assert isinstance(events[0], ModelChangedEvent)
    assert events[0].attr == "records"
    received = []
    copy.on_change(received.append)
    setter = cast("Setter", object())
    apply_patch(patch_doc(events), copy, setter=setter)
    assert other.records == source.records
    assert len(received) == 1
    assert received[0].setter is setter
    source.selected.indices = [1]
    apply_patch(patch_doc(events[1:]), copy)
    assert other.selected.indices == [1]


def test_legacy_graph_reports_noncolumnar_sources_without_attribute_errors() -> None:
    source = RecordDataSource(records=[dict(index=0, start=0, end=0)])
    graph = GraphRenderer(
        node_renderer=GlyphRenderer(data_source=source, glyph=Scatter()),
        edge_renderer=GlyphRenderer(data_source=source, glyph=Bezier()),
    )
    errors = check_integrity([graph]).error
    assert len(errors) == 1
    assert errors[0].name == "MALFORMED_GRAPH_SOURCE"
    assert "columnar node and edge sources" in errors[0].extra


@pytest.mark.parametrize(("tool_type", "glyph_type"), [
    (PointDrawTool, Scatter),
    (BoxEditTool, Rect),
    (PolyDrawTool, Patches),
    (PolyEditTool, Patches),
    (FreehandDrawTool, Patches),
    (LineEditTool, Line),
])
def test_edit_tools_validate_columnar_sources(tool_type: type[EditTool], glyph_type: type["Glyph"]) -> None:
    source = RecordDataSource(records=[dict(x=1, y=2)])
    renderer = GlyphRenderer(data_source=source, glyph=glyph_type())
    kwargs: dict[str, Any] = dict(renderers=[renderer])
    tool = tool_type(**kwargs)
    errors = check_integrity([tool]).error
    assert len(errors) == 1
    assert errors[0].name == "INCOMPATIBLE_EDIT_SOURCE"
    assert str(renderer) in errors[0].extra
    renderer.data_source = ColumnDataSource()
    assert check_integrity([tool]).error == []


@pytest.mark.parametrize(("tool_type", "property_name"), [
    (PolyDrawTool, "vertex_renderer"),
    (PolyEditTool, "vertex_renderer"),
    (LineEditTool, "intersection_renderer"),
])
def test_edit_tools_validate_auxiliary_sources(tool_type: type[EditTool], property_name: str) -> None:
    renderer = GlyphRenderer(data_source=RecordDataSource(), glyph=Scatter())
    kwargs: dict[str, Any] = {property_name: renderer}
    tool = tool_type(**kwargs)
    errors = check_integrity([tool]).error
    assert len(errors) == 1
    assert errors[0].name == "INCOMPATIBLE_EDIT_SOURCE"
    renderer.data_source = ColumnDataSource()
    assert check_integrity([tool]).error == []


def test_record_legend_group_reports_column_requirement() -> None:
    source = RecordDataSource(records=[dict(x=1, y=2, name="first")])
    with pytest.raises(ValueError, match=r"legend_group requires a ColumnDataSource.*legend_field"):
        figure().scatter("x", "y", source=source, legend_group="name")
    renderer = figure().scatter("x", "y", source=source, legend_field="name")
    assert renderer.data_source is source
