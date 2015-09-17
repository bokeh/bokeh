""" Various kinds of markup (static content) widgets.

"""
from __future__ import absolute_import

from ...properties import abstract
from ...properties import Int, String
from ..widget import Widget

@abstract
class Markup(Widget):
    """ Base class for HTML markup widget models. """

class Paragraph(Markup):
    """ A block (paragraph) of text.

    """

    text = String(help="""
    The contents of the widget.
    """)

    width = Int(500, help="""
    The width of the block in pixels.
    """)

    height = Int(400, help="""
    The height of the block in pixels.
    """)


class PreText(Paragraph):
    """ A block (paragraph) of pre-formatted text.

    """
