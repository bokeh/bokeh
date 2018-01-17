from ..core.properties import Int, Seq
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
