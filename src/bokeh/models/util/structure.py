#-----------------------------------------------------------------------------
# Copyright (c) Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------
""" Functions to draw the a clickable graph of the submodels of a bokeh model.

Clicking on the nodes representing the submodels reveals the attributes of that submodel.
Uses simple custom javascript callbacks so no server is necessary;
works in a jupyter notebook.

Suppose M is a bokeh model (i.e. a plot or figure).  Then
generate_structure_plot(M) is a bokeh model that displays the submodel graph.

Based on a private class, _BokehStructureGraph.

- K = _BokehStructureGraph(M) creates the object.
- K.model returns the model consisting of the structure graph and associated datatable.
- K.graph returns the directed graph in networkx format
- K.property_df returns the dataframe of models, submodels and their properties.

"""

#-----------------------------------------------------------------------------
# Boilerplate
#-----------------------------------------------------------------------------
from __future__ import annotations

import logging # isort:skip
log = logging.getLogger(__name__)

#-----------------------------------------------------------------------------
# Imports
#-----------------------------------------------------------------------------

import json
from contextlib import closing
from dataclasses import dataclass
from itertools import permutations
from math import ceil
from typing import TYPE_CHECKING, Any

from ...core.property.descriptors import UnsetValueError
from ...core.property.vectorization import value
from ...layouts import column
from ..annotations import Label, LabelSet
from ..callbacks import CustomJS
from ..filters import GroupFilter
from ..glyphs import Bezier, Rect
from ..plots import Plot
from ..ranges import Range1d
from ..renderers import GlyphRenderer
from ..sources import ColumnDataSource, IndexedSubset
from ..tools import (
    BoxZoomTool,
    HoverTool,
    PanTool,
    ResetTool,
    TapTool,
)
from ..widgets import DataTable, TableColumn

if TYPE_CHECKING:
    import networkx as nx

    from ...core.property.descriptors import AliasPropertyDescriptor, PropertyDescriptor
    from ...core.types import ID
    from ...model import Model
    from ..sources import DataDict

#-----------------------------------------------------------------------------
# Globals and constants
#-----------------------------------------------------------------------------

__all__ = ('generate_structure_plot',)

# -----------------------------------------------------------------------------
# General API
# -----------------------------------------------------------------------------


def generate_structure_plot(f: Model) -> Model:
    """  Given a bokeh model f, return a model that displays the graph of its submodels.

    Clicking on the nodes of the graph reveals the attributes of that submodel.

    Requires NetworkX and PyGraphviz.

    """

    return _BokehStructureGraph(f).model


# -----------------------------------------------------------------------------
# Private API
# -----------------------------------------------------------------------------

@dataclass(frozen=True)
class _ModelProps:
    props: list[str]
    values: list[Any]
    types: list[PropertyDescriptor[Any] | AliasPropertyDescriptor[Any]]
    doc: list[str | None]

class _BokehStructureGraph:
    """ Class for exploring the graph of submodels of a Bokeh model.

    If M is such a model and X=_BokehStructureGraph(M), then:

    - X.model is the interactive model itself of the submodel graph. Pass it to
    show or ``embed(...).page()``. It is self-contained and works in a Jupyter
    notebook without a server.

    - X.graph is the networkx DiGraph of submodels.

    - X.property_df is a pandas dataframe including all of the properties of
    all of the submodels, with their docstrings.  Used for the datatable
    displayed when clicking on X.model

    """

    def __init__(self, model: Model) -> None:

        self._model = model
        self._graph = self._make_graph(model)
        self._prop_df = self._make_prop_dict()
        self._graph_plot = self._make_graph_plot()
        self._data_table = self._make_data_table()
        if self._graph_plot.title is not None:
            self._graph_plot.title.text = f"Structure of model type {self._model.__class__.__name__} with id {self._model.id}"
        self._structure_graph = self._combined()

    @property
    def model(self) -> Model:
        """ The bokeh model consisting of the structure graph and the datatable
        for the attributes.

        Can be passed to show or ``embed(...).page()``. It is self-contained,
        so remains interactive in a notebook or HTML file without a server.

        """
        return self._structure_graph

    @property
    def graph(self) -> nx.DiGraph[ID]:
        """ The networkx digraph of submodels of the given model.

        """
        return self._graph

    @property
    def property_df(self) -> DataDict:
        """ A pandas dataframe of all of the properties of the model with their
        values, types, and docstrings.  The base information for the datatable.

        """
        return self._prop_df

    def _make_graph(self, M: Model) -> nx.DiGraph[ID]:
        """ Builds a networkx DiGraph() G from the model M.


        G.nodes are the submodels of M, with node attributes
            - "model" giving the class name of of the submodel
            - "id" giving the id of the submodel

        An edge runs from a to b if the submodel b belongs to an attribute of
            a

        Args:
            M: A bokeh model M

        """
        import networkx as nx

        def test_condition(s: Model, y: str, H: Model) -> bool:
            answer1: bool = False
            answer2: bool = False
            answer3: bool = False
            try:
                answer1 = s in getattr(H, y)
            except (TypeError, UnsetValueError):
                pass
            try:
                answer2 = s == getattr(H, y)
            except (TypeError, UnsetValueError):
                pass
            try:
                answer3 = s in getattr(H, y).values()
            except (AttributeError, ValueError, UnsetValueError):
                pass
            return answer1 | answer2 | answer3

        K: nx.DiGraph[ID] = nx.DiGraph()
        T: dict[ID, set[ID]] = {}
        for m in M.references():
            T[m.id] = {y.id for y in m.references()}

        def model_name(id: ID) -> str:
            model = M.select_one(dict(id=id))
            assert model is not None
            return model.__class__.__name__

        K.add_nodes_from(
            [(x, dict(model=model_name(x))) for x in T],
        )
        E = [(y, x) for x, y in permutations(T, 2) if T[x] <= T[y]]
        K.add_edges_from(E)
        dead_edges: list[tuple[ID, ID]] = []
        for id in K.nodes:
            H = M.select_one(dict(id=id))
            assert H is not None
            for x in K.neighbors(id):
                s = H.select_one(dict(id=x))
                assert s is not None
                keep_edge = False
                for y in H.properties():
                    if test_condition(s, y, H):
                        keep_edge = True
                if not keep_edge:
                    dead_edges.append((id, x))
        K.remove_edges_from(dead_edges)
        return K

    def _obj_props_to_df2(self, obj: Model) -> _ModelProps:
        """ Returns a pandas dataframe of the properties of a bokeh model

        Each row contains an attribute, its type (a bokeh property), and its docstring.

        """
        obj_dict = obj.properties_with_values()
        types = [obj.lookup(x) for x in obj_dict.keys()]
        docs = [getattr(type(obj), x).__doc__ for x in obj_dict.keys()]
        return _ModelProps(
            props=list(obj_dict.keys()),
            values=list(obj_dict.values()),
            types=types,
            doc=docs,
        )

    def _make_graph_plot(self) -> Plot:
        """ Builds the graph portion of the final model.

        """
        import networkx as nx

        with closing(nx.nx_agraph.to_agraph(self._graph)) as graph:
            graph.graph_attr.update(rankdir="LR", nodesep="0.08", ranksep="0.3")
            graph.node_attr.update(shape="box", fixedsize="true", height=str(22/72), fontname="monospace", fontsize="11")
            graph.edge_attr.update(arrowhead="none", tailport="e", headport="w")
            for node in self._graph:
                model = self._graph.nodes[node]["model"]
                graph.add_node(node, label=model, width=str((len(model) * 7 + 16) / 72))
            graph.layout(prog="dot")
            output = graph.draw(format="json")
            assert output is not None
            layout = json.loads(output)
        objects = layout["objects"]
        node_x, node_y = zip(*(map(float, node["pos"].split(",")) for node in objects))
        node_source = ColumnDataSource(dict(
            x=node_x, y=node_y,
            index=[node["name"] for node in objects],
            model=[node["label"] for node in objects],
            width=[float(node["width"]) * 72 for node in objects],
        ))

        edge_data: dict[str, list[float]] = {key: [] for key in ("x0", "y0", "cx0", "cy0", "cx1", "cy1", "x1", "y1")}
        for edge in layout.get("edges", []):
            for operation in edge["_draw_"]:
                if operation["op"] != "b":
                    continue
                points = operation["points"]
                for i in range(0, len(points) - 1, 3):
                    for (x_key, y_key), (x, y) in zip(
                        (("x0", "y0"), ("cx0", "cy0"), ("cx1", "cy1"), ("x1", "y1")), points[i:i + 4],
                    ):
                        edge_data[x_key].append(x)
                        edge_data[y_key].append(y)
        edge_source = ColumnDataSource(dict(edge_data))

        left, bottom, right, top = map(float, layout["bb"].split(","))
        frame_width = max(400, ceil(right - left) + 40)
        frame_height = max(200, ceil(top - bottom) + 64)
        x_padding = (frame_width - (right - left)) / 2
        y_padding = (frame_height - (top - bottom)) / 2

        p2 = Plot(
            outline_line_alpha=0.0,
            frame_width=frame_width,
            frame_height=frame_height,
            x_range=Range1d(left - x_padding, right + x_padding),
            y_range=Range1d(bottom - y_padding - 16, top + y_padding - 16),
        )

        node_glyph = Rect(
            x="x", y="y", width="width", height=22,
            fill_color="#f0f6fb", line_color="#8aa3b8", border_radius=5,
        )
        node_renderer = GlyphRenderer(
            data_source=node_source,
            glyph=node_glyph,
            nonselection_glyph=node_glyph.clone(),
            selection_glyph=node_glyph.clone(fill_color="#c5e1f5", line_color="#2c6b9a"),
        )

        edge_renderer = GlyphRenderer(
            data_source=edge_source,
            glyph=Bezier(x0="x0", y0="y0", x1="x1", y1="y1", cx0="cx0", cy0="cy0", cx1="cx1", cy1="cy1",
                         line_color="#9caab6", line_alpha=0.7),
        )

        node_hover_tool = HoverTool(tooltips=[("id", "@index"), ("model", "@model")])
        node_hover_tool.renderers = [node_renderer]

        tap_tool = TapTool()
        tap_tool.renderers = [node_renderer]

        labels = LabelSet(
            x="x",
            y="y",
            text="model",
            source=node_source,
            text_font=value("monospace"),
            text_font_size="11px",
            text_align="center",
            text_baseline="middle",
        )

        help = Label(
            x=20,
            y=20,
            x_units="screen",
            y_units="screen",
            text_font_size="8pt",
            text_font_style="italic",
            text="Click on a model to see its attributes",
        )
        p2.add_layout(help)
        p2.add_layout(edge_renderer)
        p2.add_layout(node_renderer)
        p2.tools.extend(
            [node_hover_tool, tap_tool, BoxZoomTool(), ResetTool(), PanTool()],
        )
        p2.renderers.append(labels)
        self._node_source = node_source
        self._edge_source = edge_source
        return p2

    def _make_prop_dict(self) -> DataDict:
        """ Returns a dataframe containing all the properties of all the submodels of the model being
        analyzed. Used as datasource to show attributes.

        """
        ids: list[str] = []
        models: list[str] = []
        values: list[str] = []
        types: list[str] = []
        props: list[str] = []
        for id in self._graph.nodes:
            M = self._model.select_one(dict(id=id))
            assert M is not None
            Z = self._obj_props_to_df2(M)
            n_items = len(Z.values)
            ids.extend([str(id)] * n_items)
            models.extend([str(M)] * n_items)
            values.extend(map(str, Z.values))
            types.extend(map(str, Z.types))
            props.extend(Z.props)
        return dict(id=ids, model=models, values=values, types=types, props=props)

    def _make_data_table(self) -> DataTable:
        """ Builds the datatable portion of the final plot.

        """
        columns = [
            TableColumn(field="props", title="Property"),
            TableColumn(field="values", title="Value"),
        ]
        prop_source = ColumnDataSource(self._prop_df)
        model_id = self._node_source.data["index"][0]
        groupfilter = GroupFilter(field_name="id", group=model_id)

        data_table2_view = IndexedSubset(filter=groupfilter)
        data_table2 = DataTable(
            source=prop_source,
            view=data_table2_view,
            columns=columns,
            visible=False,
            index_position=None,
            autosize_mode="force_fit",
            editable=False,
        )

        self._groupfilter = groupfilter
        self._prop_source = prop_source
        return data_table2

    def _combined(self) -> Model:
        """ Connects the graph and the datatable with a simple CustomJS callback.

        Clicking on a node/submodel narrows the view in the datatable to the
        attributes associated with that submodel.

        """

        js_code = """\
            const index = node_source.selected.indices[0];
            f['group'] = node_source.data['index'][index];
            table['visible'] = true;
            prop_source.change.emit();
        """

        js = CustomJS(
            args=dict(
                node_source=self._node_source,
                prop_source=self._prop_source,
                f=self._groupfilter,
                table=self._data_table,
            ),
            code=js_code,
        )

        self._node_source.selected.js_on_change("indices", js)
        layout = column(self._graph_plot, self._data_table)
        return layout
