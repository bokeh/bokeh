#-----------------------------------------------------------------------------
# Copyright (c) 2012 - 2018, Anaconda, Inc. All rights reserved.
#
# Powered by the Bokeh Development Team.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------
''' Generate various HTML elements from Bokeh render items.

'''

#-----------------------------------------------------------------------------
# Boilerplate
#-----------------------------------------------------------------------------
from __future__ import absolute_import, division, print_function, unicode_literals

import logging
log = logging.getLogger(__name__)

#-----------------------------------------------------------------------------
# Imports
#-----------------------------------------------------------------------------

# Standard library imports

# External imports
from six import string_types

# Bokeh imports
from ..core.json_encoder import serialize_json
from ..core.templates import _env, DOC_JS, FILE, MACROS, PLOT_DIV
from ..document.document import DEFAULT_TITLE
from ..settings import settings
from ..util.compiler import bundle_all_models
from ..util.serialization import make_id
from ..util.string import encode_utf8, escape
from .wrappers import wrap_in_onload, wrap_in_safely, wrap_in_script_tag

#-----------------------------------------------------------------------------
# Globals and constants
#-----------------------------------------------------------------------------

__all__ = (
    'div_for_render_item',
    'html_page_for_render_items',
    'script_for_render_items',
)

#-----------------------------------------------------------------------------
# General API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Dev API
#-----------------------------------------------------------------------------

def div_for_render_item(item):
    ''' Render an HTML div for a Bokeh render item.

    Args:
        item (RenderItem):
            the item to create a div for

    Returns:
        str

    '''
    return PLOT_DIV.render(doc=item, macros=MACROS)

def html_page_for_render_items(bundle, docs_json, render_items, title, template=None, template_variables={}):
    ''' Render an HTML page from a template and Bokeh render items.

    Args:
        bundle (tuple):
            a tuple containing (bokehjs, bokehcss)

        docs_json (JSON-like):
            Serialized Bokeh Documen t

        render_items (RenderItems)
            Specific items to render from the document and where

        title (str or None)
            A title for the HTML page. If None, DEFAULT_TITLE is used

        template (str or Template or None, optional) :
            A Template to be used for the HTML page. If None, FILE is used.

        template_variables (dict, optional):
            Any Additional variables to pass to the template

    Returns:
        str

    '''
    if title is None:
        title = DEFAULT_TITLE

    bokeh_js, bokeh_css = bundle

    json_id = make_id()
    json = escape(serialize_json(docs_json), quote=False)
    json = wrap_in_script_tag(json, "application/json", json_id)

    script = bundle_all_models()
    script += script_for_render_items(json_id, render_items)
    script = wrap_in_script_tag(script)

    context = template_variables.copy()

    context.update(dict(
        title = title,
        bokeh_js = bokeh_js,
        bokeh_css = bokeh_css,
        plot_script = json + script,
        docs = render_items,
        base = FILE,
        macros = MACROS,
    ))

    if len(render_items) == 1:
        context["doc"] = context["docs"][0]
        context["roots"] = context["doc"].roots

    # XXX: backwards compatibility, remove for 1.0
    context["plot_div"] = "\n".join(div_for_render_item(item) for item in render_items)

    if template is None:
        template = FILE
    elif isinstance(template, string_types):
        template = _env.from_string("{% extends base %}\n" + template)

    html = template.render(context)
    return encode_utf8(html)

def script_for_render_items(docs_json_or_id, render_items, app_path=None, absolute_url=None):
    '''

    '''
    if isinstance(docs_json_or_id, string_types):
        docs_json = "document.getElementById('%s').textContent" % docs_json_or_id
    else:
        # XXX: encodes &, <, > and ', but not ". This is because " is used a lot in JSON,
        # and encoding it would significantly increase size of generated files. Doing so
        # is safe, because " in strings was already encoded by JSON, and the semi-encoded
        # JSON string is included in JavaScript in single quotes.
        docs_json = serialize_json(docs_json_or_id, pretty=False) # JSON string
        docs_json = escape(docs_json, quote=("'",))               # make HTML-safe
        docs_json = docs_json.replace("\\", "\\\\")               # double encode escapes
        docs_json =  "'" + docs_json + "'"                        # JS string

    js = DOC_JS.render(
        docs_json=docs_json,
        render_items=serialize_json([ item.to_json() for item in render_items ], pretty=False),
        app_path=app_path,
        absolute_url=absolute_url,
    )

    if not settings.dev:
        js = wrap_in_safely(js)

    return wrap_in_onload(js)

#-----------------------------------------------------------------------------
# Private API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Code
#-----------------------------------------------------------------------------
