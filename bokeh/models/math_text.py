from ..model import Model
from ..core.properties import (
    String,
)

class MathText(Model):
    """
    Class for signaling you want you text converted to LaTex
    """

    text = String(default="", help="""
    The text value to render.
    """)

    def __init__(self, text, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.text = text