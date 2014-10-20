from __future__ import absolute_import

from ...properties import Int, String
from ..widget import Widget

class Paragraph(Widget):
    text = String()
    width = Int(500)
    height = Int(400)

class PreText(Paragraph):
    pass
