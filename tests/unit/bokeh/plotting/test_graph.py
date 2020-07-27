#-----------------------------------------------------------------------------
# Copyright (c) 2012 - 2020, Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Boilerplate
#-----------------------------------------------------------------------------
import pytest ; pytest

#-----------------------------------------------------------------------------
# Imports
#-----------------------------------------------------------------------------

# External imports
import networkx as nx
import numpy as np
from numpy.testing import assert_allclose

# Module under test
import bokeh.plotting.graph as bpg # isort:skip

#-----------------------------------------------------------------------------
# Setup
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# General API
#-----------------------------------------------------------------------------

def test_from_networkx_method() -> None:
    G=nx.Graph()
    G.add_nodes_from([0,1,2,3])
    G.add_edges_from([[0,1], [0,2], [2,3]])

    renderer = bpg.from_networkx(G, nx.circular_layout)
    assert renderer.node_renderer.data_source.data["index"] == [0,1,2,3]
    assert renderer.edge_renderer.data_source.data["start"] == [0,0,2]
    assert renderer.edge_renderer.data_source.data["end"] == [1,2,3]

    gl = renderer.layout_provider.graph_layout
    assert set(gl.keys()) == {0, 1, 2, 3}
    assert_allclose(gl[0], np.array([1.0, 0.0]), atol=1e-7)


def test_from_networkx_method_with_kwargs() -> None:
    G=nx.Graph()
    G.add_nodes_from([0,1,2,3])
    G.add_edges_from([[0,1], [0,2], [2,3]])

    renderer = bpg.from_networkx(G, nx.circular_layout, scale=2)

    gl = renderer.layout_provider.graph_layout
    assert set(gl.keys()) == {0, 1, 2, 3}
    assert_allclose(gl[0], np.array([2.0, 0.0]), atol=1e-7)


def test_from_networkx_with_scalar_attributes() -> None:
    G = nx.Graph()
    G.add_nodes_from([(0, {"attr_1": "a", "attr_2": 10}),
                      (1, {"attr_1": "b"}),
                      (2, {"attr_1": "c", "attr_2": 30})])
    G.add_edges_from([(0, 1, {"attr_1": "A"}),
                      (0, 2, {"attr_1": "B", "attr_2": 10})])

    renderer = bpg.from_networkx(G, nx.circular_layout)

    assert renderer.node_renderer.data_source.data["index"] == [0, 1, 2]
    assert renderer.node_renderer.data_source.data["attr_1"] == ["a", "b", "c"]
    assert renderer.node_renderer.data_source.data["attr_2"] == [10, None, 30]

    assert renderer.edge_renderer.data_source.data["start"] == [0, 0]
    assert renderer.edge_renderer.data_source.data["end"] == [1, 2]
    assert renderer.edge_renderer.data_source.data["attr_1"] == ["A", "B"]
    assert renderer.edge_renderer.data_source.data["attr_2"] == [None, 10]

@pytest.mark.parametrize('typ', [list, tuple])
def test_from_networkx_with_sequence_attributes(typ) -> None:
    G = nx.Graph()
    G.add_nodes_from([(0, {"attr_1": typ([1, 2]), "attr_2": 10}),
                      (1, {}),
                      (2, {"attr_1": typ([3]), "attr_2": 30})])
    G.add_edges_from([(0, 1, {"attr_1": typ([1, 11])}),
                      (0, 2, {"attr_1": typ([2, 22]), "attr_2": 10})])

    renderer = bpg.from_networkx(G, nx.circular_layout)

    assert renderer.node_renderer.data_source.data["index"] == [0, 1, 2]
    assert renderer.node_renderer.data_source.data["attr_1"] == [[1, 2], [], [3]]
    assert renderer.node_renderer.data_source.data["attr_2"] == [10, None, 30]

    assert renderer.edge_renderer.data_source.data["start"] == [0, 0]
    assert renderer.edge_renderer.data_source.data["end"] == [1, 2]
    assert renderer.edge_renderer.data_source.data["attr_1"] == [[1, 11], [2, 22]]
    assert renderer.edge_renderer.data_source.data["attr_2"] == [None, 10]

def test_from_networkx_errors_with_mixed_attributes() -> None:
    G = nx.Graph()
    G.add_nodes_from([(0, {"attr_1": [1, 2], "attr_2": 10}),
                      (1, {}),
                      (2, {"attr_1": 3, "attr_2": 30})])

    with pytest.raises(ValueError):
        bpg.from_networkx(G, nx.circular_layout)

    G = nx.Graph()
    G.add_edges_from([(0, 1, {"attr_1": [1, 11]}),
                      (0, 2, {"attr_1": 2, "attr_2": 10})])

    with pytest.raises(ValueError):
        bpg.from_networkx(G, nx.circular_layout)

def test_from_networkx_with_bad_attributes() -> None:
    G = nx.Graph()
    G.add_nodes_from([(0, {"index": "a", "attr_1": 10}),
                      (1, {"index": "b", "attr_1": 20})])
    G.add_edges_from([[0, 1]])

    with pytest.warns(UserWarning):
        renderer = bpg.from_networkx(G, nx.circular_layout)
        assert renderer.node_renderer.data_source.data["index"] == [0, 1]
        assert renderer.node_renderer.data_source.data["attr_1"] == [10, 20]

    G = nx.Graph()
    G.add_nodes_from([0, 1])
    G.add_edges_from([(0, 1, {"start": "A", "attr_1": 10})])

    with pytest.warns(UserWarning):
        renderer = bpg.from_networkx(G, nx.circular_layout)
        assert renderer.edge_renderer.data_source.data["start"] == [0]
        assert renderer.edge_renderer.data_source.data["end"] == [1]
        assert renderer.edge_renderer.data_source.data["attr_1"] == [10]

    G = nx.Graph()
    G.add_nodes_from([0, 1])
    G.add_edges_from([(0, 1, {"end": "A", "attr_1": 10})])

    with pytest.warns(UserWarning):
        renderer = bpg.from_networkx(G, nx.circular_layout)
        assert renderer.edge_renderer.data_source.data["start"] == [0]
        assert renderer.edge_renderer.data_source.data["end"] == [1]
        assert renderer.edge_renderer.data_source.data["attr_1"] == [10]

def test_from_networkx_fixed_layout() -> None:
    G = nx.Graph()
    G.add_nodes_from([0, 1, 2])
    G.add_edges_from([[0, 1], [0, 2]])

    fixed_layout = {0: [0, 1],
                    1: [-1, 0],
                    2: [1, 0]}

    renderer = bpg.from_networkx(G, fixed_layout)
    assert renderer.node_renderer.data_source.data["index"] == [0, 1, 2]
    assert renderer.edge_renderer.data_source.data["start"] == [0, 0]
    assert renderer.edge_renderer.data_source.data["end"] == [1, 2]

    gl = renderer.layout_provider.graph_layout
    assert set(gl.keys()) == {0, 1, 2}
    assert renderer.layout_provider.graph_layout[0] == fixed_layout[0]
    assert renderer.layout_provider.graph_layout[1] == fixed_layout[1]
    assert renderer.layout_provider.graph_layout[2] == fixed_layout[2]

def test_from_networkx_with_missing_layout() -> None:
    G = nx.Graph()
    G.add_nodes_from([0, 1, 2])
    G.add_edges_from([[0, 1], [0, 2]])

    missing_fixed_layout = {0: [0, 1],
                            1: [-1, 0]}

    with pytest.warns(UserWarning):
        renderer = bpg.from_networkx(G, missing_fixed_layout)
        gl = renderer.layout_provider.graph_layout
        assert set(gl.keys()) == {0, 1}
        assert renderer.layout_provider.graph_layout[0] == missing_fixed_layout[0]
        assert renderer.layout_provider.graph_layout[1] == missing_fixed_layout[1]

#-----------------------------------------------------------------------------
# Dev API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Private API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Code
#-----------------------------------------------------------------------------
