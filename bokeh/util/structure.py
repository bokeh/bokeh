#-----------------------------------------------------------------------------
# Copyright (c) 2012 - 2020, Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------
'''Functions to create the directed acyclic graph of submodels of a model in networkx format,
   and to draw that DAG using bokeh graph rendering.
'''


#-----------------------------------------------------------------------------
# Boilerplate
#-----------------------------------------------------------------------------
import logging # isort:skip
log = logging.getLogger(__name__)


#-----------------------------------------------------------------------------
# Imports
#-----------------------------------------------------------------------------

# Standard library imports
from itertools import permutations

# External imports
import networkx as nx

# Bokeh imports
from bokeh.models import ColumnDataSource, HoverTool, LabelSet, Range1d
from bokeh.models.glyphs import Circle, MultiLine
from bokeh.plotting import figure, from_networkx

#-----------------------------------------------------------------------------
# General API
#-----------------------------------------------------------------------------

def make_graph(M):
    """Return a networkx DiGraph() G so that:
       G.nodes are the submodels of M, with node attributes
           - "model" giving the class name of of the submodel
           - "id" giving the id of the submodel
           - "in" giving the attribute of the parent model to which this submodel is attached
       Two nodes are joined by an edge if the head node is a member of (or equal to) an attribute of the tail node.

    Args:
        A bokeh model M
    """
    G = nx.DiGraph()

    T = {}
    for m in M.references():
        T[m.id] = set([y.id for y in m.references()])

    G.add_nodes_from(
        [
            (x, {"model": M.select_one({"id": x}).__class__.__name__})
            for x in T
        ]
    )
    E = [(y, x) for x, y in permutations(T, 2) if T[x].issubset(T[y])]
    G.add_edges_from(E)
    K = nx.algorithms.dag.transitive_reduction(G)
    nx.set_node_attributes(K, dict(G.nodes(data="model")), "model")
    nx.set_node_attributes(K, "root", "in")
    for id in K.nodes:
        H = M.select_one({"id": id})
        for x in K.neighbors(id):
            for y in H.properties():
                if y in H.properties_containers():
                    if H.select_one({"id": x}) in getattr(H, y):
                        K.nodes[x]["in"] = y
                else:
                    if getattr(H, y) == H.select_one({"id": x}):
                        K.nodes[x]["in"] = y
    return K


def draw_model(M):
    """Returns a Bokeh Plot Model that draws the directed graph constructed by make_graph
    using the Bokeh graph plotting primitives.  Typically one would use show() to view the result.

    Args:
       A bokeh model M
    """
    K = make_graph(M)
    plot = figure(title="Structure Graph for Bokeh Model", height=600, width=600)

    plot.xaxis.visible = False
    plot.yaxis.visible = False
    plot.xgrid.visible = False
    plot.ygrid.visible = False

    K.graph["graph"] = {"rankdir": "LR"}

    graph_renderer = from_networkx(
        K, layout_function=nx.nx_pydot.graphviz_layout, prog="dot"
    )
    graph_renderer.node_renderer.glyph = Circle(
        radius=4, fill_alpha=1, fill_color="lightblue"
    )

    graph_renderer.edge_renderer.glyph = MultiLine(line_width=3, line_color="#ababab")
    plot.renderers = [graph_renderer]

    node_hover_tool = HoverTool(
        tooltips=[("id", "@index"), ("model", "@model"), ("in", "@in")]
    )
    plot.add_tools(node_hover_tool)

    x, y = zip(*graph_renderer.layout_provider.graph_layout.values())
    xinterval = max(max(x) - min(x),200)
    yinterval = max(max(y) - min(y),200)
    plot.x_range = Range1d(
        start=min(x) - 0.15 * xinterval, end=max(x) + 0.15 * xinterval
    )
    plot.y_range = Range1d(
        start=min(y) - 0.15 * yinterval, end=max(y) + 0.15 * yinterval
    )
    D = {"x": x, "y": y, "model": list(dict(K.nodes(data="model")).values())}
    labels = LabelSet(
        x="x",
        y="y",
        text="model",
        source=ColumnDataSource(D),
        text_font_size="8pt",
        x_offset=-20,
        y_offset=7,
    )
    plot.renderers.append(labels)

    return plot
