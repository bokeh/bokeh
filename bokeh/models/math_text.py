# Bokeh imports
from ..core.properties import Nullable, String
from ..model import Model


class MathText(Model):
    """
    Class for signaling you want you text converted to LaTex
    """

    text = Nullable(String, help="""
    The text value to render.
    """)

    def __init__(self, *args, **kwargs):
        super().__init__(**kwargs)
        if len(args) == 1:
            self.text = args[0]
