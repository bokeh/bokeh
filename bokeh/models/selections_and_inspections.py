from ..core.properties import Int, Seq
from ..model import Model

class Selection(Model):
    '''

    '''

    indices = Seq(Int, default=[], help="""
    The indices included in a selection.
    """)
