from datetime import date

import numpy as np
import pytest

from bokeh.core.validation import check_integrity
from bokeh.document import Document
from bokeh.models import GeometryDataSource


def test_geometry_source_loads_geojson_and_preserves_rows() -> None:
    point = dict(type="Point", coordinates=[2, 3])
    source = GeometryDataSource(dict(type="FeatureCollection", features=[
        dict(type="Feature", geometry=point, properties={"name": "first"}),
        dict(type="Feature", geometry=None, properties={}),
    ]))
    assert source.length == 2
    assert source.geometries == [point, None]
    assert source.data == {"name": ["first", None]}
    assert source.column_names == ["geometry", "name"]

    doc = Document()
    doc.add_root(source)
    restored = Document.from_json(doc.to_json()).roots[0]
    assert isinstance(restored, GeometryDataSource)
    assert restored.geometries == source.geometries
    assert restored.data == source.data


def test_geometry_source_rejects_misaligned_attributes() -> None:
    with pytest.raises(ValueError, match="same length as geometries"):
        GeometryDataSource(geometries=[None], data={"name": []})

def test_geometry_protocol_and_replacement() -> None:
    class GeoObject:
        crs = "EPSG:4326"
        __geo_interface__ = {"type": "Point", "coordinates": (0, 1)}

    obj = GeoObject()
    for source in (GeometryDataSource(obj), GeometryDataSource(data=obj)):
        assert source.crs == obj.crs
        source.update(geometries=[obj, {"type": "Feature", "geometry": obj.__geo_interface__}])
        assert source.geometries == [obj.__geo_interface__, obj.__geo_interface__]
        doc = Document()
        doc.add_root(source)
        restored = Document.from_json(doc.to_json()).roots[0]
        assert isinstance(restored, GeometryDataSource)
        assert [list(geometry["coordinates"]) for geometry in restored.geometries] == [[0, 1], [0, 1]]
        with pytest.raises(ValueError, match="GeoJSON mappings"):
            source.update(geometries=[5])

    source = GeometryDataSource([{"geometry": obj.__geo_interface__, "type": "GeometryCollection"}])
    assert source.length == 1
    assert source.data["type"] == ["GeometryCollection"]

def test_geometry_source_validation_reports_misaligned_updates() -> None:
    source = GeometryDataSource(geometries=[None], data={"name": ["first"]})
    source.geometries = [None, None]
    warnings = check_integrity([source]).warning
    assert [warning.name for warning in warnings] == ["GEOMETRY_ATTRIBUTE_LENGTH_MISMATCH"]
    assert "name" in warnings[0].extra

    source.update(geometries=[None, None, None], data={"name": ["first", "second", "third"]})
    assert check_integrity([source]).warning == []

@pytest.mark.parametrize(("x", "y", "message"), [
    ([[0], 1], [[0], 2], "matching nesting"),
    ([None], [0], "numbers or categorical factors"),
    ([float("nan")], [0], "must be finite"),
    ([1], [2], "at least three vertices"),
    ([0, "a", 2], [0, 1, 0], "cannot mix"),
])
def test_from_xy_rejects_invalid_coordinates(x, y, message) -> None:
    with pytest.raises(ValueError, match=message):
        GeometryDataSource.from_xy(x, y)


def test_from_xy_builds_polygon_records_from_flat_and_nested_coordinates() -> None:
    coordinates = [[0, 0], [2, 0], [0, 2], [0, 0]]
    polygon = dict(type="Polygon", coordinates=[coordinates])

    assert GeometryDataSource.from_xy([0, 2, 0], [0, 0, 2]).geometries == [polygon]

    source = GeometryDataSource.from_xy(
        [[0, 2, 0], [0, 2, 0]], [[0, 0, 2], [0, 0, 2]], data={"color": ["red", "blue"]},
    )
    assert source.geometries == [polygon, polygon]
    assert list(source.data["color"]) == ["red", "blue"]

def test_from_xy_supports_empty_and_temporal_coordinates() -> None:
    assert GeometryDataSource.from_xy([], [], data={"name": []}).length == 0
    empty = np.empty((0, 3))
    assert GeometryDataSource.from_xy(empty, empty).length == 0
    source = GeometryDataSource.from_xy(
        [date(1970, 1, 1), date(1970, 1, 2), date(1970, 1, 3)], [0, 1, 0],
    )
    assert source.geometries == [{"type": "Polygon", "coordinates": [
        [[0, 0], [86_400_000, 1], [172_800_000, 0], [0, 0]],
    ]}]
