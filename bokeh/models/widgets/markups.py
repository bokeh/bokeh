""" Various kinds of markup (static content) widgets.

"""
from __future__ import absolute_import

from ...core.properties import abstract
from ...core.properties import String, Bool
from .widget import Widget


@abstract
class Markup(Widget):
    """ Base class for HTML markup widget models. """

    text = String(default="", help="""
    The contents of the widget.
    """)


class Paragraph(Markup):
    """ A block (paragraph) of text.

    """


class Div(Markup):
    """ A block (div) of text.

    """

    render_as_text = Bool(False, help="""
    Should the text be rendered as raw text (False, default), or should the text be interprited as an HTML string (True)
    """)


class PreText(Paragraph):
    """ A block (paragraph) of pre-formatted text.

    """
