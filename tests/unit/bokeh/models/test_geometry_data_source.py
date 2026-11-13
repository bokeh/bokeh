import pytest

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


def test_from_xy_builds_polygon_records_from_flat_and_nested_coordinates() -> None:
    coordinates = [[0, 0], [2, 0], [0, 2]]
    polygon = dict(type="Polygon", coordinates=[coordinates])

    assert GeometryDataSource.from_xy([0, 2, 0], [0, 0, 2]).geometries == [polygon]

    source = GeometryDataSource.from_xy(
        [[0, 2, 0], [0, 2, 0]], [[0, 0, 2], [0, 0, 2]], data={"color": ["red", "blue"]},
    )
    assert source.geometries == [polygon, polygon]
    assert list(source.data["color"]) == ["red", "blue"]
