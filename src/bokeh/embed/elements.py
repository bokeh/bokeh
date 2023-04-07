#-----------------------------------------------------------------------------
# Copyright (c) 2012 - 2023, Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------
''' Generate various HTML elements from Bokeh render items.

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

# Standard library imports
from html import escape
from typing import TYPE_CHECKING, Any

## External imports
if TYPE_CHECKING:
    from jinja2 import Template

# Bokeh imports
from ..core.json_encoder import serialize_json
from ..core.templates import (
    DOC_JS,
    FILE,
    MACROS,
    PLOT_DIV,
    get_env,
)
from ..document.document import DEFAULT_TITLE
from ..settings import settings
from ..util.serialization import make_id
from .util import RenderItem
from .wrappers import wrap_in_onload, wrap_in_safely, wrap_in_script_tag

if TYPE_CHECKING:
    from ..core.types import ID
    from ..document.document import DocJson
    from .bundle import Bundle

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

def div_for_render_item(item: RenderItem) -> str:
    ''' Render an HTML div for a Bokeh render item.

    Args:
        item (RenderItem):
            the item to create a div for

    Returns:
        str

    '''
    return PLOT_DIV.render(doc=item, macros=MACROS)

def html_page_for_render_items(
    bundle: Bundle | tuple[str, str],
    docs_json: dict[ID, DocJson],
    render_items: list[RenderItem],
    *,
    title: str | None = None,
    template: Template | str | None = None,
    template_variables: dict[str, Any] = {},
) -> str:
    ''' Render an HTML page from a template and Bokeh render items.

    Args:
        bundle (tuple):
            a tuple containing (bokehjs, bokehcss)

        docs_json (JSON-like):
            Serialized Bokeh Document

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

    docs_json_id = make_id()
    docs_json_str = escape(serialize_json(docs_json), quote=False)
    docs_json_tag = wrap_in_script_tag(docs_json_str, "application/json", docs_json_id)

    render_items_id = make_id()
    render_items_str = escape(serialize_json(render_items), quote=False)
    render_items_tag = wrap_in_script_tag(render_items_str, "application/json", render_items_id)

    script_tag = wrap_in_script_tag(script_for_render_items(docs_json_id, render_items_id))

    context = template_variables.copy()

    context.update(dict(
        title = title,
        bokeh_js = bokeh_js,
        bokeh_css = bokeh_css,
        plot_script = docs_json_tag + render_items_tag + script_tag,
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
    elif isinstance(template, str):
        template = get_env().from_string("{% extends base %}\n" + template)

    html = template.render(context)
    return html

def script_for_render_items(docs_json_or_id: ID | dict[ID, DocJson], render_items_or_id: ID | list[RenderItem],
                            app_path: str | None = None, absolute_url: str | None = None) -> str:
    ''' Render an script for Bokeh render items.
    Args:
        docs_json_or_id:
            can be None

        render_items (RenderItems) :
            Specific items to render from the document and where

        app_path (str, optional) :

        absolute_url (Theme, optional) :

    Returns:
        str
    '''
    def encode(json_or_id: ID | Any) -> str:
        if isinstance(json_or_id, str):
            json_str = f"document.getElementById('{json_or_id}').textContent"
        else:
            # XXX: encodes &, <, > and `, but not " and '. This is because " is used a lot in
            # JSON, and encoding it would significantly increase size of generated files. Doing
            # so is safe, because " in strings was already encoded by JSON, and the semi-encoded
            # JSON string is included in JavaScript in backtick quotes.
            json_str = serialize_json(json_or_id)      # JSON string
            json_str = escape(json_str, quote=False)   # make HTML-safe
            json_str = json_str.replace("`", "&#x96;") # remove backticks
            json_str = json_str.replace("\\", "\\\\")  # double encode escapes
            json_str = "`" + json_str + "`"            # JS string
        return json_str

    js = DOC_JS.render(
        docs_json=encode(docs_json_or_id),
        render_items=encode(render_items_or_id),
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
