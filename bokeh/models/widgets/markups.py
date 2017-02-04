''' Various kinds of markup (static content) widgets.

'''
from __future__ import absolute_import

from ...core.has_props import abstract
from ...core.properties import Bool, String

from .widget import Widget

@abstract
class Markup(Widget):
    ''' Base class for Bokeh models that represent HTML markup elements.

    Markups include e.g., ``<div>``, ``<p>``, and ``<pre>``.

    '''

    text = String(default="", help="""
    The contents of the widget.
    """)

class Paragraph(Markup):
    ''' A block (paragraph) of text.

    This Bokeh model corresponds to an HTML ``<p>`` element.

    '''

    __example__ = "sphinx/source/docs/user_guide/examples/interaction_paragraph.py"

class Div(Markup):
    ''' A block (div) of text.

    This Bokeh model corresponds to an HTML ``<div>`` element.

    '''

    __example__ = "sphinx/source/docs/user_guide/examples/interaction_div.py"

    render_as_text = Bool(False, help="""
    Whether the contents should be rendered as raw text or as interpreted HTML.
    The default value is ``False``, meaning contents are rendered as HTML.
    """)

class PreText(Paragraph):
    ''' A block (paragraph) of pre-formatted text.

    This Bokeh model corresponds to an HTML ``<pre>`` element.

    '''

    __example__ = "sphinx/source/docs/user_guide/examples/interaction_pretext.py"
