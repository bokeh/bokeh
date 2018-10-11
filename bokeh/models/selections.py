from ..core.has_props import abstract
from ..core.properties import Dict, Int, Seq, String
from ..model import Model

class Selection(Model):
    '''
    A Selection represents a portion of the data in a DataSource, which
    can be visually manipulated in a plot.

    Selections are typically created by selecting points in a plot with
    a SelectTool, but can also be programmatically specified.

    '''

    indices = Seq(Int, default=[], help="""
    The indices included in a selection.
    """)

    line_indices = Seq(Int, default=[], help="""
    """)

    multiline_indices = Dict(String, Seq(Int), default={}, help="""
    """)

    # TODO (bev) image_indicies

@abstract
class SelectionPolicy(Model):
    '''

    '''

    pass

class IntersectRenderers(SelectionPolicy):
    '''
    When a data source is shared between multiple renderers, a row in the data
    source will only be selected if that point for each renderer is selected. The
    selection is made from the intersection of hit test results from all renderers.

    '''

    pass

class UnionRenderers(SelectionPolicy):
    '''
    When a data source is shared between multiple renderers, selecting a point on
    from any renderer will cause that row in the data source to be selected. The
    selection is made from the union of hit test results from all renderers.

    '''

    pass
