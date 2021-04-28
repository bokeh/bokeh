#-----------------------------------------------------------------------------
# Copyright (c) 2012 - 2021, Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------
''' Various kinds of markup (static content) widgets.

.. warning::
    The explicit purpose of these Bokeh Models is to embed *raw HTML text* for
    a browser to execute. If any portion of the text is derived from untrusted
    user inputs, then you must take appropriate care to sanitize the user input
    prior to passing to Bokeh.

'''

#-----------------------------------------------------------------------------
# Boilerplate
#-----------------------------------------------------------------------------
from __future__ import annotations

import logging # isort:skip
log = logging.getLogger(__name__)

#-----------------------------------------------------------------------------
# Imports
#-----------------------------------------------------------------------------

# Bokeh imports
from ...core.has_props import abstract
from ...core.properties import (
    Any,
    Bool,
    Dict,
    String,
)
from .widget import Widget

#-----------------------------------------------------------------------------
# Globals and constants
#-----------------------------------------------------------------------------

__all__ = (
    'Div',
    'Markup',
    'Paragraph',
    'PreText',
)

#-----------------------------------------------------------------------------
# Dev API
#-----------------------------------------------------------------------------

@abstract
class Markup(Widget):
    ''' Base class for Bokeh models that represent HTML markup elements.

    Markups include e.g., ``<div>``, ``<p>``, and ``<pre>``.

    '''

    text = String(default="", help="""
    The text or HTML contents of the widget.

    .. note::
        If the HTML content contains elements which size depends on
        on external, asynchronously loaded resources, the size of
        the widget may be computed incorrectly. This is in particular
        an issue with images (``<img>``). To remedy this problem, one
        either has to set explicit dimensions using CSS properties,
        HTML attributes or model's ``width`` and ``height`` properties,
        or inline images' contents using data URIs.
    """)

    style = Dict(String, Any, default={}, help="""
    Raw CSS style declaration. Note this may be web browser dependent.
    """)

#-----------------------------------------------------------------------------
# General API
#-----------------------------------------------------------------------------

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

#-----------------------------------------------------------------------------
# Private API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Code
#-----------------------------------------------------------------------------
