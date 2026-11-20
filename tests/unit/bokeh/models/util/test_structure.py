#-----------------------------------------------------------------------------
# Copyright (c) Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Boilerplate
#-----------------------------------------------------------------------------
from __future__ import annotations

#-----------------------------------------------------------------------------
# Imports
#-----------------------------------------------------------------------------
from math import isfinite

import pytest

from bokeh.model import collect_models
from bokeh.models import Column, Row
from bokeh.models.util import generate_structure_plot
from bokeh.models.util.structure import _BokehStructureGraph
from bokeh.plotting import figure

#-----------------------------------------------------------------------------
# Setup
#-----------------------------------------------------------------------------

@pytest.fixture(autouse=True)
def _require_pygraphviz():
    pytest.importorskip("pygraphviz")

#-----------------------------------------------------------------------------
# General API
#-----------------------------------------------------------------------------

def test_structure(nx):
    f = figure(width=400,height=400)
    f.line(x=[1,2,3],y=[1,2,3])
    K = generate_structure_plot(f)
    assert 48 == len(collect_models(K))


@pytest.mark.parametrize("kind", ["single", "branch", "cycle"])
def test_structure_layout(nx, kind):
    root = Row()
    if kind != "single":
        child = Column()
        root.children = [child]
        if kind == "cycle":
            child.children = [root]

    structure = _BokehStructureGraph(root)
    data = structure._node_source.data
    positions = dict(zip(data["index"], zip(data["x"], data["y"])))
    assert set(positions) == {model.id for model in root.references()}
    assert len(set(positions.values())) == len(positions)
    assert all(isfinite(coord) for point in positions.values() for coord in point)
    if kind == "branch":
        assert positions[root.id][0] < positions[child.id][0]
    elif kind == "cycle":
        assert len(structure._edge_source.data["x0"]) >= 2


def test_structure_routes_avoid_nodes(nx):
    f = figure()
    f.line(x=[1, 2, 3], y=[1, 2, 3])
    structure = _BokehStructureGraph(f)
    nodes = structure._node_source.data
    boxes = [(x - width/2, x + width/2, y - 11, y + 11)
             for x, y, width in zip(nodes["x"], nodes["y"], nodes["width"])]
    edges = structure._edge_source.data
    assert len(edges["x0"]) >= len(structure.graph.edges)
    for points in zip(*(edges[key] for key in ("x0", "y0", "cx0", "cy0", "cx1", "cy1", "x1", "y1"))):
        x0, y0, cx0, cy0, cx1, cy1, x1, y1 = points
        for step in range(1, 20):
            t = step / 20
            s = 1 - t
            x = s**3*x0 + 3*s**2*t*cx0 + 3*s*t**2*cx1 + t**3*x1
            y = s**3*y0 + 3*s**2*t*cy0 + 3*s*t**2*cy1 + t**3*y1
            # Graphviz rounds its JSON coordinates and dimensions separately.
            assert not any(left + 0.05 < x < right - 0.05 and bottom + 0.05 < y < top - 0.05
                           for left, right, bottom, top in boxes)


#-----------------------------------------------------------------------------
# Dev API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Private API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Code
#-----------------------------------------------------------------------------
