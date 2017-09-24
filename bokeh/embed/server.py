#-----------------------------------------------------------------------------
# Copyright (c) 2012 - 2017, Anaconda, Inc. All rights reserved.
#
# Powered by the Bokeh Development Team.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------
'''

'''

#-----------------------------------------------------------------------------
# Boilerplate
#----------------------------------------------------------------------------
from __future__ import absolute_import, division, print_function, unicode_literals

import logging
log = logging.getLogger(__name__)

from bokeh.util.api import public, internal ; public, internal

#-----------------------------------------------------------------------------
# Imports
#-----------------------------------------------------------------------------

# Standard library imports
from six.moves.urllib.parse import urlparse, quote_plus

# External imports

# Bokeh imports
from ..core.templates import AUTOLOAD_TAG, FILE
from ..resources import DEFAULT_SERVER_HTTP_URL
from ..util.serialization import make_id
from ..util.string import encode_utf8, format_docstring
from .bundle import bundle_for_objs_and_resources
from .util import html_page_for_render_items

#-----------------------------------------------------------------------------
# Globals and constants
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Public API
#-----------------------------------------------------------------------------

@public((1,0,0))
def server_document(url="default", relative_urls=False, resources="default", arguments=None):
    ''' Return a script tag that embeds content from a Bokeh server.

    Bokeh apps embedded using these methods will NOT set the browser window title.

    Args:
        url (str, optional) :
            A URL to a Bokeh application on a Bokeh server (default: "default")

            If ``"default"`` the default URL ``{DEFAULT_SERVER_HTTP_URL}`` will be used.

        relative_urls (bool, optional) :
            Whether to use relative URLs for resources.

            If ``True`` the links generated for resources such a BokehJS
            JavaScript and CSS will be relative links.

            This should normally be set to ``False``, but must be set to
            ``True`` in situations where only relative URLs will work. E.g.
            when running the Bokeh behind reverse-proxies under certain
            configurations

        resources (str) : A string specifying what resources need to be loaded
            along with the document.

            If ``default`` then the default JS/CSS bokeh files will be loaded.

            If None then none of the resource files will be loaded. This is
            useful if you prefer to serve those resource files via other means
            (e.g. from a caching server). Be careful, however, that the resource
            files you'll load separately are of the same version as that of the
            server's, otherwise the rendering may not work correctly.

       arguments (dict[str, str], optional) :
            A dictionary of key/values to be passed as HTTP request arguments
            to Bokeh application code (default: None)

    Returns:
        A ``<script>`` tag that will embed content from a Bokeh Server.

    '''
    url = _clean_url(url)

    app_path = _get_app_path(url)

    elementid = make_id()
    src_path = _src_path(url, elementid)

    src_path += _process_app_path(app_path)
    src_path += _process_relative_urls(relative_urls, url)
    src_path += _process_resources(resources)
    src_path += _process_arguments(arguments)

    tag = AUTOLOAD_TAG.render(
        src_path  = src_path,
        app_path  = app_path,
        elementid = elementid,
    )

    return encode_utf8(tag)

@public((1,0,0))
def server_session(model, session_id, url="default", relative_urls=False, resources="default", arguments=None):
    ''' Return a script tag that embeds content from a specific existing session on
    a Bokeh server.

    This function is typically only useful for serving from a a specific session
    that was previously created using the ``bokeh.client`` API.

    Bokeh apps embedded using these methods will NOT set the browser window title.

    .. note::
        Typically you will not want to save or re-use the output of this
        function for different or multiple page loads.

    Args:
        model (Model) :
            The object to render from the session

        session_id (str) :
            A server session ID (default: None)

        url (str, optional) :
            A URL to a Bokeh application on a Bokeh server (default: "default")

            If ``"default"`` the default URL ``{DEFAULT_SERVER_HTTP_URL}`` will be used.

        relative_urls (bool, optional) :
            Whether to use relative URLs for resources.

            If ``True`` the links generated for resources such a BokehJS
            JavaScript and CSS will be relative links.

            This should normally be set to ``False``, but must be set to
            ``True`` in situations where only relative URLs will work. E.g.
            when running the Bokeh behind reverse-proxies under certain
            configurations

        resources (str) : A string specifying what resources need to be loaded
            along with the document.

            If ``default`` then the default JS/CSS bokeh files will be loaded.

            If None then none of the resource files will be loaded. This is
            useful if you prefer to serve those resource files via other means
            (e.g. from a caching server). Be careful, however, that the resource
            files you'll load separately are of the same version as that of the
            server's, otherwise the rendering may not work correctly.

        arguments (dict[str, str], optional) :
            A dictionary of key/values to be passed as HTTP request arguments
            to Bokeh application code (default: None)

    Returns:
        A ``<script>`` tag that will embed content from a Bokeh Server.

        .. warning::
            It is typically a bad idea to re-use the same ``session_id`` for
            every page load. This is likely to create scalability and security
            problems, and will cause "shared Google doc" behavior, which is
            probably not desired.

    '''
    url = _clean_url(url)

    app_path = _get_app_path(url)

    elementid = make_id()
    src_path = _src_path(url, elementid)

    src_path += _process_app_path(app_path)
    src_path += _process_relative_urls(relative_urls, url)
    src_path += _process_session_id(session_id)
    src_path += _process_resources(resources)
    src_path += _process_arguments(arguments)

    tag = AUTOLOAD_TAG.render(
        src_path  = src_path,
        app_path  = app_path,
        elementid = elementid,
        modelid   = model._id,
    )

    return encode_utf8(tag)

#-----------------------------------------------------------------------------
# Internal API
#-----------------------------------------------------------------------------

@internal((1,0,0))
def server_html_page_for_models(session_id, model_ids, resources, title, template=FILE):
    '''

    '''
    render_items = []
    for modelid in model_ids:
        if modelid is None:
            raise ValueError("None found in list of model_ids")

        elementid = make_id()

        render_items.append({
            'sessionid' : session_id,
            'elementid' : elementid,
            'modelid' : modelid
            })

    bundle = bundle_for_objs_and_resources(None, resources)
    return html_page_for_render_items(bundle, {}, render_items, title, template=template)

@internal((1,0,0))
def server_html_page_for_session(session_id, resources, title, template=FILE, template_variables=None):
    '''

    '''
    elementid = make_id()
    render_items = [{
        'sessionid' : session_id,
        'elementid' : elementid,
        'use_for_title' : True
        # no 'modelid' implies the entire session document
    }]

    if template_variables is None:
        template_variables = {}

    bundle = bundle_for_objs_and_resources(None, resources)
    return html_page_for_render_items(bundle, {}, render_items, title, template=template, template_variables=template_variables)

#-----------------------------------------------------------------------------
# Private API
#-----------------------------------------------------------------------------

def _clean_url(url):
    '''

    '''
    if url == 'default':
        url = DEFAULT_SERVER_HTTP_URL

    if url.startswith("ws"):
        raise ValueError("url should be the http or https URL for the server, not the websocket URL")

    return url.rstrip("/")

def _get_app_path(url):
    '''

    '''
    if url == "default": return ""

    app_path = urlparse(url).path.rstrip("/")
    if not app_path.startswith("/"):
        app_path = "/" + app_path
    return app_path

def _process_arguments(arguments):
    '''

    '''
    if arguments is None: return ""
    result = ""
    for key, value in arguments.items():
        if not key.startswith("bokeh-"):
            result += "&{}={}".format(quote_plus(str(key)), quote_plus(str(value)))
    return result

def _process_app_path(app_path):
    '''

    '''
    if app_path == "/": return ""
    return "&bokeh-app-path=" + app_path

def _process_relative_urls(relative_urls, url):
    '''

    '''
    if relative_urls: return ""
    return "&bokeh-absolute-url=" + url

def _process_resources(resources):
    '''

    '''
    if resources not in ("default", None):
        raise ValueError("`resources` must be either 'default' or None.")
    if resources is None:
        return "&resources=none"
    return ""

def _process_session_id(session_id):
    '''

    '''
    return "&bokeh-session-id=" + session_id

def _src_path(url, elementid):
    '''

    '''
    return url + "/autoload.js?bokeh-autoload-element=" + elementid

#-----------------------------------------------------------------------------
# Code
#-----------------------------------------------------------------------------

server_document.__doc__ = format_docstring(server_document.__doc__, DEFAULT_SERVER_HTTP_URL=DEFAULT_SERVER_HTTP_URL)
server_session.__doc__ = format_docstring(server_session.__doc__, DEFAULT_SERVER_HTTP_URL=DEFAULT_SERVER_HTTP_URL)
