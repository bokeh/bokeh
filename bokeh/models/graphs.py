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

        '''

        # inline import to prevent circular imports
        from ..models.renderers import GraphRenderer
        from ..models.graphs import StaticLayoutProvider

        nodes = graph.nodes()
        edges = graph.edges()
        edges_start = [edge[0] for edge in edges]
        edges_end = [edge[1] for edge in edges]

        node_source = ColumnDataSource(data=dict(index=nodes))
        edge_source = ColumnDataSource(data=dict(
            start=edges_start,
            end=edges_end
        ))

        graph_renderer = GraphRenderer()
        graph_renderer.node_renderer.data_source = node_source
        graph_renderer.edge_renderer.data_source = edge_source

        graph_layout = layout_function(graph, **kwargs)
        graph_renderer.layout_provider = StaticLayoutProvider(graph_layout=graph_layout)

        return graph_renderer
