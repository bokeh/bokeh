import networkx as nx
import numpy as np

from bokeh.models.graphs import GraphSource, StaticLayoutProvider
from bokeh.models.sources import ColumnDataSource

def test_staticlayoutprovider_init_props():
    provider = StaticLayoutProvider()
    assert provider.graph_layout == {}

def test_graphsource_init_props():
    source = GraphSource()
    assert source.nodes.data == dict(index=[])
    assert source.edges.data == dict(start=[], end=[])
    assert source.layout_provider is None

def test_graphsource_check_malformed_graph_source_no_errors():
    source = GraphSource()

    check = source._check_malformed_graph_source()
    assert check == []

def test_graphsource_check_malformed_graph_source_no_node_index():
    node_source = ColumnDataSource()
    source = GraphSource(nodes=node_source)

    check = source._check_malformed_graph_source()
    assert check != []

def test_graphsource_check_malformed_graph_source_no_edge_start_or_end():
    edge_source = ColumnDataSource()
    source = GraphSource(edges=edge_source)

    check = source._check_malformed_graph_source()
    assert check != []

def test_graphsource_check_malformed_missing_index_in_start():
    edge_source = ColumnDataSource(data=dict(
        start=[1,2,5],
        end=[1,2,3]))
    node_source = ColumnDataSource(data=dict(index=[1,2,3]))
    source = GraphSource(nodes=node_source, edges=edge_source)

    check = source._check_malformed_graph_source()
    assert check != []

def test_graphsource_check_malformed_missing_index_in_end():
    edge_source = ColumnDataSource(data=dict(
        start=[1,2,3],
        end=[1,2,6]))
    node_source = ColumnDataSource(data=dict(index=[1,2,3]))
    source = GraphSource(nodes=node_source, edges=edge_source)

    check = source._check_malformed_graph_source()
    assert check != []

def test_graphsource_from_networkx():
    G=nx.Graph()
    G.add_nodes_from([0,1,2,3])
    G.add_edges_from([[0,1], [0,2], [2,3]])

    source = GraphSource.from_networkx(G, nx.circular_layout)
    assert source.nodes.data["index"] == [0,1,2,3]
    assert source.edges.data["start"] == [0,0,2]
    assert source.edges.data["end"] == [1,2,3]

    gl = source.layout_provider.graph_layout
    assert set(gl.keys()) == set([0,1,2,3])
    assert np.array_equal(gl[0], np.array([1., 0.]))

def test_graphsource_from_networkx_with_kwargs():
    G=nx.Graph()
    G.add_nodes_from([0,1,2,3])
    G.add_edges_from([[0,1], [0,2], [2,3]])

    source = GraphSource.from_networkx(G, nx.circular_layout, scale=2)
    assert source.nodes.data["index"] == [0,1,2,3]
    assert source.edges.data["start"] == [0,0,2]
    assert source.edges.data["end"] == [1,2,3]

    gl = source.layout_provider.graph_layout
    assert set(gl.keys()) == set([0,1,2,3])
    assert np.array_equal(gl[0], np.array([2., 0.]))
