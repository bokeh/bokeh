#-----------------------------------------------------------------------------
# Copyright (c) 2012 - 2020, Anaconda, Inc., and Bokeh Contributors.
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
# Imports
#-----------------------------------------------------------------------------


# Standard library imports
from itertools import permutations

# Bokeh imports
from bokeh.layouts import column
from bokeh.models import (
    BoxZoomTool,
    CDSView,
    Circle,
    ColumnDataSource,
    CustomJS,
    DataTable,
    GlyphRenderer,
    GroupFilter,
    HoverTool,
    Label,
    LabelSet,
    MultiLine,
    PanTool,
    Plot,
    Range1d,
    ResetTool,
    TableColumn,
    TapTool,
)

#-----------------------------------------------------------------------------
# Globals and constants
#-----------------------------------------------------------------------------

__all__ = ('generate_structure_plot',)

# -----------------------------------------------------------------------------
# General API
# -----------------------------------------------------------------------------


def generate_structure_plot(f):
    """  Given a bokeh model f, return a model that displays the graph of its submodels.

    Clicking on the nodes of the graph reveals the attributes of that submodel.

    """

    return _BokehStructureGraph(f).model


# -----------------------------------------------------------------------------
# Private API
# -----------------------------------------------------------------------------

class _BokehStructureGraph:
    """ Class for exploring the graph of submodels of a Bokeh model.

    If M is such a model and X=_BokehStructureGraph(M), then:

    - X.model is the interactive model itself of
    the submodel graph; pass it to show or file_html.  Self contained so
    works in a jupyter notebook, no server needed.

    - X.graph is the networkx DiGraph of submodels.

    - X.property_df is a pandas dataframe including all of the properties of
    all of the submodels, with their docstrings.  Used for the datatable
    displayed when clicking on X.model

    """

    def __init__(self, model):

        self._model = model
        self._graph = self._make_graph(model)
        self._graph.graph["graph"] = {"rankdir": "LR"}
        self._prop_df = self._make_prop_dict()
        self._graph_plot = self._make_graph_plot()
        self._data_table = self._make_data_table()
        self._graph_plot.title.text = "Structure of model type {} with id {}".format(
            self._model.__class__.__name__, self._model.id
        )
        self._structure_graph = self._combined()

    @property
    def model(self):
        """ The bokeh model consisting of the structure graph and the datatable
        for the attributes.

        Can be passed to show or file_html. Self contained,
        so remains interactive in a notebook or html file; no server needed.

        """
        return self._structure_graph

    @property
    def graph(self):
        """ The networkx digraph of submodels of the given model.

        """
        return self._graph

    @property
    def property_df(self):
        """ A pandas dataframe of all of the properties of the model with their
        values, types, and docstrings.  The base information for the datatable.

        """
        return self._prop_df

    def _make_graph(self, M):
        """ Builds a networkx DiGraph() G from the model M.


        G.nodes are the submodels of M, with node attributes
            - "model" giving the class name of of the submodel
            - "id" giving the id of the submodel

        An edge runs from a to b if the submodel b belongs to an attribute of
            a

        Args:
            A bokeh model M

        """
        import networkx as nx

        def test_condition(s, y, H):
            answer1 = False
            answer2 = False
            answer3 = False
            try:
                answer1 = (s in getattr(H, y))
            except TypeError:
                pass
            try:
                answer2 = (s == getattr(H, y))
            except TypeError:
                pass
            try:
                answer3 = (s in getattr(H, y).values())
            except (AttributeError, ValueError):
                pass
            return (answer1 | answer2 | answer3)

        K = nx.DiGraph()
        T = {}
        for m in M.references():
            T[m.id] = {y.id for y in m.references()}

        K.add_nodes_from(
            [(x, {"model": M.select_one({"id": x}).__class__.__name__}) for x in T]
        )
        E = [(y, x) for x, y in permutations(T, 2) if T[x] <= T[y]]
        K.add_edges_from(E)
        dead_edges = []
        for id in K.nodes:
            H = M.select_one({"id": id})
            for x in K.neighbors(id):
                s = H.select_one({"id": x})
                keep_edge = False
                for y in H.properties():
                    if test_condition(s, y, H):
                        keep_edge = True
                if not keep_edge:
                    dead_edges.append((id, x))
        K.remove_edges_from(dead_edges)
        return K

    def _obj_props_to_df2(self, obj):
        """ Returns a pandas dataframe of the properties of a bokeh model

        Each row contains  an attribute, its type (a bokeh property), and its docstring.

        """
        obj_dict = obj.properties_with_values()
        types = [obj.lookup(x) for x in obj_dict.keys()]
        docs = [getattr(type(obj), x).__doc__ for x in obj_dict.keys()]
        df = {
            "props": list(obj_dict.keys()),
            "values": list(obj_dict.values()),
            "types": types,
            "doc": docs,
        }
        return df

    def _make_graph_plot(self):
        """ Builds the graph portion of the final model.

        """
        import networkx as nx

        nodes = nx.nx_pydot.graphviz_layout(self._graph, prog="dot")
        node_x, node_y = zip(*nodes.values())
        models = [self._graph.nodes[x]["model"] for x in nodes]
        node_id = list(nodes.keys())
        node_source = ColumnDataSource(
            {"x": node_x, "y": node_y, "index": node_id, "model": models}
        )
        edge_x_coords = []
        edge_y_coords = []
        for start_node, end_node in self._graph.edges:
            edge_x_coords.extend([[nodes[start_node][0], nodes[end_node][0]]])
            edge_y_coords.extend([[nodes[start_node][1], nodes[end_node][1]]])
        edge_source = ColumnDataSource({"xs": edge_x_coords, "ys": edge_y_coords})

        p2 = Plot(outline_line_alpha=0.0)
        xinterval = max(max(node_x) - min(node_x), 200)
        yinterval = max(max(node_y) - min(node_y), 200)
        p2.x_range = Range1d(
            start=min(node_x) - 0.15 * xinterval, end=max(node_x) + 0.15 * xinterval
        )
        p2.y_range = Range1d(
            start=min(node_y) - 0.15 * yinterval, end=max(node_y) + 0.15 * yinterval
        )

        node_renderer = GlyphRenderer(
            data_source=node_source,
            glyph=Circle(x="x", y="y", size=15, fill_color="lightblue"),
            nonselection_glyph=Circle(x="x", y="y", size=15, fill_color="lightblue"),
            selection_glyph=Circle(x="x", y="y", size=15, fill_color="green"),
        )

        edge_renderer = GlyphRenderer(
            data_source=edge_source, glyph=MultiLine(xs="xs", ys="ys")
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
            text_font_size="8pt",
            x_offset=-20,
            y_offset=7,
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
            [node_hover_tool, tap_tool, BoxZoomTool(), ResetTool(), PanTool()]
        )
        p2.renderers.append(labels)
        self._node_source = node_source
        self._edge_source = edge_source
        return p2

    def _make_prop_dict(self):
        """ Returns a dataframe containing all the properties of all the submodels of the model being
        analyzed. Used as datasource to show attributes.

        """
        import pandas as pd
        df = pd.DataFrame()
        for x in self._graph.nodes(data=True):
            M = self._model.select_one({"id": x[0]})
            Z = pd.DataFrame(self._obj_props_to_df2(M))
            Z["id"] = x[0]
            Z["model"] = str(M)
            Z["values"] = Z["values"].map(lambda x: str(x))
            Z["types"] = Z["types"].map(lambda x: str(x))
            df = df.append(Z)
        return df

    def _make_data_table(self):
        """ Builds the datatable portion of the final plot.

        """
        columns = [
            TableColumn(field="props", title="Property"),
            TableColumn(field="values", title="Value"),
        ]
        prop_source = ColumnDataSource(self._prop_df)
        model_id = self._node_source.data["index"][0]
        groupfilter = GroupFilter(column_name="id", group=model_id)

        data_table2_view = CDSView(source=prop_source, filters=[groupfilter])
        data_table2 = DataTable(
            source=prop_source,
            view=data_table2_view,
            columns=columns,
            visible=False,
            index_position=None,
            fit_columns=True,
            editable=False,
        )

        self._groupfilter = groupfilter
        self._prop_source = prop_source
        return data_table2

    def _combined(self):
        """ Connects the graph and the datatable with a simple CustomJS callback.

        Clicking on a node/submodel narrows the view in the datatable to the
        attributes associated with that submodel.

        """

        js_code = """const index = node_source.selected.indices[0];
            f['group']=node_source.data['index'][index];
            table['visible']=true;
            prop_source.change.emit();"""

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
