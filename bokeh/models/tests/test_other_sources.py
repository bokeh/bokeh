import json
import pytest
from bokeh.models.sources import (
    DataSource,
    ServerDataSource,
    GeoJSONDataSource,
)


## *************************
## GeoJSONDataSource Tests
## *************************

@pytest.fixture
def point_geojson():
    return """{
      "type": "FeatureCollection",
      "features": [
        {
            "type": "Feature",
            "geometry": {"type": "Point", "coordinates": [125.6, 10.1]},
            "properties": {"name": "Dinagat Islands"}
        }
    ]
}"""


@pytest.fixture
def point_data():
    data = {
        'x': [125.6],
        'y': [10.1],
        'name': ["Dinagat Islands"]
    }
    return data.copy()


def test_geojson_datasource_populates_data_on_initialization(point_geojson, point_data):
    geo_source = GeoJSONDataSource(geojson=point_geojson)
    assert geo_source.data == point_data


def test_geojson_datasource_geojson_to_data_converts_point_feature(point_geojson, point_data):
    data = GeoJSONDataSource.geojson_to_data(point_geojson)
    assert data == point_data


def test_geojson_datasource_data_to_geojson_converts_back_to_point_feature(point_geojson, point_data):
    geojson = GeoJSONDataSource.data_to_geojson(point_data)
    assert json.loads(geojson) == json.loads(point_geojson)


def test_geojson_datasource_when_column_is_added_to_data_its_converted_into_geojson(point_geojson, point_data):
    geo_source = GeoJSONDataSource(geojson=point_geojson)
    geo_source.add(data=['New property'], name='prop2')
    point_data.update({'prop2': ['New property']})
    assert geo_source.data == point_data


def test_geojson_datasource_when_column_is_remove_from_data_its_converted_into_geojson(point_geojson, point_data):
    geo_source = GeoJSONDataSource(geojson=point_geojson)
    geo_source.remove('name')
    point_data.pop('name')
    assert geo_source.data == point_data


def test_geojson_datasource_prevents_remove_of_x_y(point_geojson):
    geo_source = GeoJSONDataSource(geojson=point_geojson)
    with pytest.raises(ValueError):
        geo_source.remove('x')
    with pytest.raises(ValueError):
        geo_source.remove('y')


def test_geojson_datasource_vm_serialize_should_not_contain_data_field(point_geojson):
    geo_source = GeoJSONDataSource(geojson=point_geojson)
    serialized = geo_source.vm_serialize()
    assert 'data' not in serialized
    assert 'geojson' in serialized
    assert serialized['geojson'] == point_geojson


## *************************
## ServerDataSource Tests
## *************************

def test_server_datasource_is_instance_of_datasource():
    ds = ServerDataSource()
    assert isinstance(ds, DataSource)
