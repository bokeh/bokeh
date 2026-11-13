import gzip
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
    EditTool,
    FreehandDrawTool,
    GlyphRenderer,
    GraphRenderer,
    GroupFilter,
    IndexedDataSource,
    IndexedSubset,
    Line,
    LineEditTool,
    Patches,
    PointDrawTool,
    PolyDrawTool,
    PolyEditTool,
    RecordDataSource,
    Rect,
    Scatter,
)
from bokeh.plotting import figure
from bokeh.protocol import apply_patch, patch_doc

if TYPE_CHECKING:
    from pathlib import Path

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
                            view=IndexedSubset(filter=GroupFilter(field_name="name", group="first")))
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


def test_record_source_serializes_row_sequences() -> None:
    rows = ({"x": 1, "meta": {"active": True}}, {"x": 2, "y": None})
    source = RecordDataSource(records=rows)
    assert source.records == list(rows)

    plot = figure()
    plot.scatter("x", "y", source=source)
    doc = Document()
    doc.add_root(plot)
    copy = Document.from_json(doc.to_json())
    other = copy.get_model_by_id(source.id)
    assert isinstance(other, RecordDataSource)
    assert other.records == list(rows)


@pytest.mark.parametrize("records", [{}, [1], [{1: "value"}]])
def test_record_source_rejects_invalid_rows(records: Any) -> None:
    with pytest.raises(ValueError, match="records"):
        RecordDataSource(records=records)


def test_record_source_from_jsonl(tmp_path: "Path") -> None:
    path = tmp_path / "records.jsonl"
    path.write_text('{"id":"001","x":2,"ok":true}\n \n{"x":3.5,"meta":{"depths":[1,null]}}\n', encoding="utf-8")
    source = RecordDataSource.from_jsonl(path)
    assert source.records == [{"id": "001", "x": 2, "ok": True}, {"x": 3.5, "meta": {"depths": [1, None]}}]
    assert source.records[0]["ok"] is True


@pytest.mark.parametrize("line", ['{"x":}', "[1,2]", "null"])
def test_record_source_from_jsonl_reports_line(tmp_path: "Path", line: str) -> None:
    path = tmp_path / "records.jsonl"
    path.write_text(f'{{"x":1}}\n\n{line}\n', encoding="utf-8")
    with pytest.raises(ValueError, match=r"records\.jsonl, line 3:"):
        RecordDataSource.from_jsonl(str(path))


def test_record_source_from_csv(tmp_path: "Path") -> None:
    path = tmp_path / "records.csv"
    path.write_text('id,depth,salinity,note\n001,2,3.5,"high, rising"\n002,4,5,\n', encoding="utf-8-sig")
    source = RecordDataSource.from_csv(path, converters={"depth": int, "salinity": float})
    assert source.records == [
        {"id": "001", "depth": 2, "salinity": 3.5, "note": "high, rising"},
        {"id": "002", "depth": 4, "salinity": 5.0, "note": ""},
    ]


@pytest.mark.parametrize("newline", ["\n", "\r\n"])
def test_record_source_from_csv_with_delimiter(tmp_path: "Path", newline: str) -> None:
    path = tmp_path / "records.tsv"
    path.write_text('id\tnote\n\n001\t"first\nsecond"\n', encoding="utf-8", newline=newline)
    source = RecordDataSource.from_csv(path, delimiter="\t")
    assert source.records == [{"id": "001", "note": f"first{newline}second"}]


def test_record_source_from_gzip_csv(tmp_path: "Path") -> None:
    path = tmp_path / "records.csv.gz"
    path.write_bytes(gzip.compress('id,depth,note\r\n001,4,"first\r\nsecond"\r\n'.encode("utf-8-sig")))
    source = RecordDataSource.from_csv(path, converters={"depth": int})
    assert source.records == [{"id": "001", "depth": 4, "note": "first\r\nsecond"}]


def test_record_source_from_gzip_jsonl(tmp_path: "Path") -> None:
    path = tmp_path / "records.jsonl.gz"
    path.write_bytes(gzip.compress(b'{"depth":4,"reviewed":true}\n\n{"depth":8,"reviewed":false}\n'))
    source = RecordDataSource.from_jsonl(str(path))
    assert source.records == [{"depth": 4, "reviewed": True}, {"depth": 8, "reviewed": False}]


@pytest.mark.parametrize(("contents", "message"), [
    ("x,x\n1,2\n", "unique, nonempty"),
    ("x,\n1,2\n", "unique, nonempty"),
    ("x,y\n1\n", "line 2: expected 2 fields, got 1"),
    ("x,y\n1,2,3\n", "line 2: expected 2 fields, got 3"),
    ('x,y\n1,"2\n', "line 2:"),
    ('x,y\n\n1,"two\n3,4\n5,6\n', "line 3: unexpected end of data"),
    ('x,y\n"one\ntwo"\n', "line 2: expected 2 fields, got 1"),
    ('x,y\nno,"two\nthree"\n', "line 2: cannot convert field 'x'"),
    ("x,y\nno,2\n", "line 2: cannot convert field 'x'"),
    ("z,y\n1,2\n", "converters reference unknown fields"),
])
def test_record_source_from_csv_reports_bad_input(tmp_path: "Path", contents: str, message: str) -> None:
    path = tmp_path / "records.csv"
    path.write_text(contents, encoding="utf-8")
    with pytest.raises(ValueError, match=message):
        RecordDataSource.from_csv(path, converters={"x": int})


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
    tool = tool_type(renderers=[renderer])
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
