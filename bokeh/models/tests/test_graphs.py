import networkx as nx
import numpy as np
from numpy.testing import assert_allclose

from bokeh.models.graphs import StaticLayoutProvider, from_networkx


def test_staticlayoutprovider_init_props():
    provider = StaticLayoutProvider()
    assert provider.graph_layout == {}

def test_from_networkx_method():
    G=nx.Graph()
    G.add_nodes_from([0,1,2,3])
    G.add_edges_from([[0,1], [0,2], [2,3]])

    renderer = from_networkx(G, nx.circular_layout)
    assert renderer.node_renderer.data_source.data["index"] == [0,1,2,3]
    assert renderer.edge_renderer.data_source.data["start"] == [0,0,2]
    assert renderer.edge_renderer.data_source.data["end"] == [1,2,3]

    gl = renderer.layout_provider.graph_layout
    assert set(gl.keys()) == set([0,1,2,3])
    assert_allclose(gl[0], np.array([1., 0.]), atol=1e-7)

def test_from_networkx_method_with_kwargs():
    G=nx.Graph()
    G.add_nodes_from([0,1,2,3])
    G.add_edges_from([[0,1], [0,2], [2,3]])

    renderer = from_networkx(G, nx.circular_layout, scale=2)

    gl = renderer.layout_provider.graph_layout
    assert set(gl.keys()) == set([0,1,2,3])
    assert_allclose(gl[0], np.array([2., 0.]), atol=1e-7)

def test_from_networkx_with_attributes():
    G = nx.Graph()
    G.add_nodes_from([(0, {"attr_1": "a", "attr_2": 10}),
                      (1, {"attr_1": "b"}),
                      (2, {"attr_1": "c", "attr_2": 30})])
    G.add_edges_from([(0, 1, {'attr_1': 'A'}),
                      (0, 2, {'attr_1': 'B', 'attr_2': 10})])

    renderer = from_networkx(G, nx.circular_layout)

    assert renderer.node_renderer.data_source.data["index"] == [0, 1, 2]
    assert renderer.node_renderer.data_source.data["attr_1"] == ["a", "b", "c"]
    assert renderer.node_renderer.data_source.data["attr_2"] == [10, None, 30]

    assert renderer.edge_renderer.data_source.data["start"] == [0, 0]
    assert renderer.edge_renderer.data_source.data["end"] == [1, 2]
    assert renderer.edge_renderer.data_source.data["attr_1"] == ["A", "B"]
    assert renderer.edge_renderer.data_source.data["attr_2"] == [None, 10]
