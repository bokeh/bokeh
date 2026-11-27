#-----------------------------------------------------------------------------
# Copyright (c) Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------

import pytest

from bokeh.document import Document
from bokeh.geometry import (
    geometry_collection,
    line_string,
    multi_line_string,
    multi_point,
    multi_polygon,
    point,
    polygon,
)
from bokeh.models import GeometryDataSource
from bokeh.protocol import apply_patch, patch_doc


@pytest.fixture(params=[
    point([1, 2, 3]),
    multi_point([[1, 2], [3, 4]]),
    line_string([[0, 0], [1, 1]]),
    multi_line_string([[[0, 0], [1, 1]], [[2, 2], [3, 3]]]),
    polygon([[[0, 0], [2, 0], [0, 2]]]),
    multi_polygon([[[[0, 0], [2, 0], [0, 2]]]]),
    geometry_collection([point([2, 3]), line_string([[2, 3], [4, 5]])]),
], ids=lambda value: value["type"])
def geometry_input(request):
    return request.param


def test_helpers_ingest_as_plain_geojson() -> None:
    ring = [[0, 0], [4, 0], [4, 4], [0, 4]]
    hole = [[1, 1], [2, 1], [1, 2]]
    geometries = [
        point([1, 2]), multi_point([[1, 2], [3, 4]]),
        line_string([[0, 0], [1, 1]]), multi_line_string([[[0, 0], [1, 1]], [[2, 2], [3, 3]]]),
        polygon([ring, hole]), multi_polygon([[ring, hole], [ring]]),
        geometry_collection([point([2, 3]), line_string([[2, 3], [4, 5]])]),
    ]

    source = GeometryDataSource(geometries=geometries, data=dict(name=list("abcdefg")))

    assert all(type(geometry) is dict for geometry in geometries)
    assert source.geometries == geometries
    assert source.data == {"name": list("abcdefg")}


def test_patch_keeps_helper_coordinates_independent() -> None:
    coordinates = [[0, 0, 7], [1, 1, 8]]
    geometry = line_string(coordinates)
    source = GeometryDataSource(geometries=[geometry])

    source.patch({"geometry": [((0, 1), [2, 3, 8])]})

    assert geometry["coordinates"] is coordinates
    assert coordinates == [[0, 0, 7], [1, 1, 8]]
    assert source.geometries == [{"type": "LineString", "coordinates": [[0, 0, 7], [2, 3, 8]]}]


def test_stream_accepts_a_helper_geometry_directly() -> None:
    source = GeometryDataSource()

    source.stream(point([1, 2]))

    assert source.geometries == [{"type": "Point", "coordinates": [1, 2]}]
    assert source.data == {}


def test_stream_helper_records_replay(geometry_input) -> None:
    source = GeometryDataSource(geometries=[None], data={"v": [0]})
    document = Document()
    document.add_root(source)
    receiver = Document.from_json(document.to_json())
    events = []
    document.on_change(events.append)

    source.stream({"geometries": [geometry_input], "data": {"v": [1]}}, rollover=1)
    apply_patch(patch_doc(events), receiver)

    assert source.geometries == receiver.roots[0].geometries == [geometry_input]
    assert source.data == receiver.roots[0].data == {"v": [1]}


def test_patch_helper_geometries_replay(geometry_input) -> None:
    source = GeometryDataSource(geometries=[None], data={"v": [0]})
    document = Document()
    document.add_root(source)
    receiver = Document.from_json(document.to_json())
    events = []
    document.on_change(events.append)

    source.patch({"geometry": [(0, geometry_input)], "v": [(0, 1)]})
    apply_patch(patch_doc(events), receiver)

    assert source.geometries == receiver.roots[0].geometries == [geometry_input]
    assert source.data == receiver.roots[0].data == {"v": [1]}
