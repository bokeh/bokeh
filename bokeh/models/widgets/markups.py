''' Various kinds of markup (static content) widgets.

.. warning::
    The explicit purpose of these Bokeh Models is to embed *raw HTML text* for
    a browser to execute. If any portion of the text is derived from untrusted
    user inputs, then you must take appropriate care to sanitize the user input
    prior to passing to Bokeh.

'''
from __future__ import absolute_import

from ...core.has_props import abstract
from ...core.properties import Any, Bool, String, Dict

from .widget import Widget

@abstract
class Markup(Widget):
    ''' Base class for Bokeh models that represent HTML markup elements.

    Markups include e.g., ``<div>``, ``<p>``, and ``<pre>``.

    '''

    text = String(default="", help="""
    The contents of the widget.
    """)

    style = Dict(String, Any, default={}, help="""
    Raw CSS style declaration. Note this may be web browser dependent.
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
