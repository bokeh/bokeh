from ..core.has_props import abstract
from ..core.properties import Any, Dict, Either, Int, Seq, String
from ..model import Model
from ..models.sources import ColumnDataSource


@abstract
class LayoutProvider(Model):
    '''

    '''

    pass


class StaticLayoutProvider(LayoutProvider):
    '''

    '''

    graph_layout = Dict(Either(String, Int), Seq(Any), default={}, help="""
    The coordinates of the graph nodes in cartesian space. The dictionary
    keys correspond to a node index and the values are a two element sequence
    containing the x and y coordinates of the node.

    .. code-block:: python

        {
            0 : [0.5, 0.5],
            1 : [1.0, 0.86],
            2 : [0.86, 1],
        }
    """)

def from_networkx(graph, layout_function, **kwargs):
        '''
        Generate a GraphRenderer from a networkx.Graph object and networkx
        layout function. Any keyword arguments will be passed to the
        layout function.

        Args:
            graph (networkx.Graph) : a networkx graph to render
            layout_function (function) : a networkx layout function

        Returns:
            instance (GraphRenderer)

        .. warning::
            Only two dimensional layouts are currently supported.

        .. warning::
            Node attributes labeled 'index' and edge attributes labeled 'start' or 'end' are ignored.
            If you want to convert these attributes, please re-label them to other names.

        '''

        # inline import to prevent circular imports
        from ..models.renderers import GraphRenderer
        from ..models.graphs import StaticLayoutProvider

        # Handles nx 1.x vs 2.x data structure change
        # Convert node attributes
        node_attr_keys = [attr_key for node in list(graph.nodes(data=True))
                          for attr_key in node[1].keys()]
        node_attr_keys = list(set(node_attr_keys))
        node_dict = _rows_to_columns(graph.nodes(data=True), node_attr_keys)

        if 'index' in node_attr_keys:
            from warnings import warn
            warn("Converting node attributes labeled 'index' are skipped. "
                 "If you want to convert these attributes, please re-label with other names.")

        node_dict['index'] = list(graph.nodes())

        # Convert edge attributes
        edge_attr_keys = [attr_key for edge in graph.edges(data=True)
                          for attr_key in edge[2].keys()]
        edge_attr_keys = list(set(edge_attr_keys))
        edge_dict = _rows_to_columns(graph.edges(data=True), edge_attr_keys)

        if 'start' in edge_attr_keys or 'end' in edge_attr_keys:
            from warnings import warn
            warn("Converting edge attributes labeled 'start' or 'end' are skipped. "
                 "If you want to convert these attributes, please re-label them with other names.")

        edge_dict['start'] = [x[0] for x in graph.edges(data=True)]
        edge_dict['end'] = [x[1] for x in graph.edges(data=True)]

        node_source = ColumnDataSource(data=node_dict)
        edge_source = ColumnDataSource(data=edge_dict)

        graph_renderer = GraphRenderer()
        graph_renderer.node_renderer.data_source.data = node_source.data
        graph_renderer.edge_renderer.data_source.data = edge_source.data

        graph_layout = layout_function(graph, **kwargs)
        graph_renderer.layout_provider = StaticLayoutProvider(graph_layout=graph_layout)

        return graph_renderer


def _rows_to_columns(source, attr_keys):
    '''
    Convert to a dictionary with node/edge attribute key as key and attribute value list as value.
    '''

    attr_dict = {}
    for attr_key in attr_keys:
        attr_dict[attr_key] = [attr[attr_key] if attr_key in attr.keys() else None for *_, attr in source]
    return attr_dict


@abstract
class GraphHitTestPolicy(Model):
    '''

    '''

    pass


class NodesOnly(GraphHitTestPolicy):
    '''
    With the NodesOnly policy, only graph nodes are able to be selected and
    inspected. There is no selection or inspection of graph edges.

    '''

    pass

class NodesAndLinkedEdges(GraphHitTestPolicy):
    '''
    With the NodesAndLinkedEdges policy, inspection or selection of graph
    nodes will result in the inspection or selection of the node and of the
    linked graph edges. There is no direct selection or inspection of graph
    edges.

    '''

    pass

class EdgesAndLinkedNodes(GraphHitTestPolicy):
    '''
    With the EdgesAndLinkedNodes policy, inspection or selection of graph
    edges will result in the inspection or selection of the edge and of the
    linked graph nodes. There is no direct selection or inspection of graph
    nodes.

    '''

    pass
