from ..model import Model
from ..core.properties import (
    String,
    Nullable
)

class MathText(Model):
    """
    Class for signaling you want you text converted to LaTex
    """

    text = Nullable(String, help="""
    The text value to render.
    """)

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        if len(args) == 1:
            self.text = args[0]
