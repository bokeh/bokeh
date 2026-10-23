#-----------------------------------------------------------------------------
# Copyright (c) Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Boilerplate
#-----------------------------------------------------------------------------
from __future__ import annotations # isort:skip

import pytest ; pytest

#-----------------------------------------------------------------------------
# Imports
#-----------------------------------------------------------------------------

# Module under test
from bokeh.models.graphs import ( # isort:skip
    ArcEdgePathProvider,
    BezierEdgePathProvider,
    CircularLayoutProvider,
    ForceDirectedLayoutProvider,
    GridLayoutProvider,
    OrthogonalEdgePathProvider,
    StaticLayoutProvider,
    StraightEdgePathProvider,
)
# Bokeh imports
from bokeh.models.sources import GraphDataSource

#-----------------------------------------------------------------------------
# Setup
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# General API
#-----------------------------------------------------------------------------

def test_staticlayoutprovider_init_props() -> None:
    provider = StaticLayoutProvider()
    assert provider.graph_layout == {}


def test_staticlayoutprovider_accepts_composite_node_ids() -> None:
    provider = StaticLayoutProvider(graph_layout={(1, 2): [0, 0]})

    assert provider.graph_layout == {(1, 2): [0, 0]}


def test_algorithmic_layout_provider_defaults() -> None:
    circular = CircularLayoutProvider()
    assert circular.center == (0, 0)
    assert circular.radius == 1
    assert circular.start_angle == 0
    assert circular.clockwise is False

    grid = GridLayoutProvider()
    assert grid.center == (0, 0)
    assert grid.spacing == 1
    assert grid.columns is None

    force = ForceDirectedLayoutProvider()
    assert force.center == (0, 0)
    assert force.scale == 1
    assert force.seed == 1
    assert force.iterations == 100


def test_layout_coordinates_retain_graph_source() -> None:
    source = GraphDataSource(nodes=[0, 1], edges=[(0, 1)])
    provider = CircularLayoutProvider()
    paths = StraightEdgePathProvider()

    assert provider.node_coordinates(source).source is source
    coordinates = paths.edge_coordinates(source, provider)
    assert coordinates.source is source
    assert coordinates.layout is provider
    assert coordinates.path is paths


def test_edge_path_provider_defaults() -> None:
    straight = StraightEdgePathProvider()
    assert straight.loop_radius == 0.15
    assert straight.loop_spacing == 0.25
    assert straight.steps == 24

    bezier = BezierEdgePathProvider()
    assert bezier.curvature == 0.2
    assert bezier.parallel_spacing == 0.15

    arc = ArcEdgePathProvider()
    assert arc.curvature == 0.2
    assert arc.parallel_spacing == 0.15

    orthogonal = OrthogonalEdgePathProvider()
    assert orthogonal.orientation == "horizontal"
    assert orthogonal.offset == 0
    assert orthogonal.corner_radius == 0

#-----------------------------------------------------------------------------
# Dev API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Private API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Code
#-----------------------------------------------------------------------------
