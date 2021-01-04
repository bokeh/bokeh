#-----------------------------------------------------------------------------
# Copyright (c) 2012 - 2020, Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------
'''

'''

#-----------------------------------------------------------------------------
# Boilerplate
#-----------------------------------------------------------------------------
import logging # isort:skip
log = logging.getLogger(__name__)

#-----------------------------------------------------------------------------
# Imports
#-----------------------------------------------------------------------------

# Standard library imports
from urllib.parse import quote_plus, urlparse

# Bokeh imports
from ..core.templates import AUTOLOAD_REQUEST_TAG, FILE
from ..resources import DEFAULT_SERVER_HTTP_URL
from ..util.serialization import make_id
from ..util.string import format_docstring
from .bundle import bundle_for_objs_and_resources
from .elements import html_page_for_render_items
from .util import RenderItem

#-----------------------------------------------------------------------------
# Globals and constants
#-----------------------------------------------------------------------------

__all__ = (
    'server_document',
    'server_session',
    'server_html_page_for_session',
)

#-----------------------------------------------------------------------------
# General API
#-----------------------------------------------------------------------------

def server_document(url="default", relative_urls=False, resources="default", arguments=None, headers=None):
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

       headers (dict[str, str], optional) :
            A dictionary of key/values to be passed as HTTP Headers
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

    headers = headers or {}

    tag = AUTOLOAD_REQUEST_TAG.render(
        src_path  = src_path,
        app_path  = app_path,
        elementid = elementid,
        headers   = headers,
    )

    return tag

def server_session(model=None, session_id=None, url="default", relative_urls=False, resources="default", headers={}):
    ''' Return a script tag that embeds content from a specific existing session on
    a Bokeh server.

    This function is typically only useful for serving from a a specific session
    that was previously created using the ``bokeh.client`` API.

    Bokeh apps embedded using these methods will NOT set the browser window title.

    .. note::
        Typically you will not want to save or re-use the output of this
        function for different or multiple page loads.

    Args:
        model (Model or None, optional) :
            The object to render from the session, or None. (default: None)

            If None, the entire document will be rendered.

        session_id (str) :
            A server session ID

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

       headers (dict[str, str], optional) :
            A dictionary of key/values to be passed as HTTP Headers
            to Bokeh application code (default: None)

    Returns:
        A ``<script>`` tag that will embed content from a Bokeh Server.

        .. warning::
            It is typically a bad idea to re-use the same ``session_id`` for
            every page load. This is likely to create scalability and security
            problems, and will cause "shared Google doc" behavior, which is
            probably not desired.

    '''
    if session_id is None:
        raise ValueError("Must supply a session_id")

    url = _clean_url(url)

    app_path = _get_app_path(url)

    elementid = make_id()
    modelid = "" if model is None else model.id
    src_path = _src_path(url, elementid)

    src_path += _process_app_path(app_path)
    src_path += _process_relative_urls(relative_urls, url)
    src_path += _process_resources(resources)

    headers = dict(headers) if headers else {}
    headers['Bokeh-Session-Id'] = session_id

    tag = AUTOLOAD_REQUEST_TAG.render(
        src_path  = src_path,
        app_path  = app_path,
        elementid = elementid,
        modelid   = modelid,
        headers   = headers,
    )

    return tag

#-----------------------------------------------------------------------------
# Dev API
#-----------------------------------------------------------------------------

def server_html_page_for_session(session, resources, title, template=FILE, template_variables=None):
    '''

    Args:
        session (ServerSession) :

        resources (Resources) :

        title (str) :

        template (Template) :

        template_variables (dict) :

    Returns:
        str

    '''
    render_item = RenderItem(
        token = session.token,
        roots = session.document.roots,
        use_for_title = True,
    )

    if template_variables is None:
        template_variables = {}

    bundle = bundle_for_objs_and_resources(None, resources)
    html = html_page_for_render_items(bundle, {}, [render_item], title,
        template=template, template_variables=template_variables)
    return html

#-----------------------------------------------------------------------------
# Private API
#-----------------------------------------------------------------------------

def _clean_url(url):
    ''' Produce a canonical Bokeh server URL.

    Args:
        url (str)
            A URL to clean, or "defatul". If "default" then the
            ``BOKEH_SERVER_HTTP_URL`` will be returned.

    Returns:
        str

    '''
    if url == 'default':
        url = DEFAULT_SERVER_HTTP_URL

    if url.startswith("ws"):
        raise ValueError("url should be the http or https URL for the server, not the websocket URL")

    return url.rstrip("/")

def _get_app_path(url):
    ''' Extract the app path from a Bokeh server URL

    Args:
        url (str) :

    Returns:
        str

    '''
    app_path = urlparse(url).path.rstrip("/")
    if not app_path.startswith("/"):
        app_path = "/" + app_path
    return app_path

def _process_arguments(arguments):
    ''' Return user-supplied HTML arguments to add to a Bokeh server URL.

    Args:
        arguments (dict[str, object]) :
            Key/value pairs to add to the URL

    Returns:
        str

    '''
    if arguments is None: return ""
    result = ""
    for key, value in arguments.items():
        if not key.startswith("bokeh-"):
            result += "&{}={}".format(quote_plus(str(key)), quote_plus(str(value)))
    return result

def _process_app_path(app_path):
    ''' Return an app path HTML argument to add to a Bokeh server URL.

    Args:
        app_path (str) :
            The app path to add. If the app path is ``/`` then it will be
            ignored and an empty string returned.

    '''
    if app_path == "/": return ""
    return "&bokeh-app-path=" + app_path

def _process_relative_urls(relative_urls, url):
    ''' Return an absolute URL HTML argument to add to a Bokeh server URL, if
    requested.

    Args:
        relative_urls (book) :
            If false, generate an absolute URL to add.

        url (str) :
            The absolute URL to add as an HTML argument

    Returns:
        str

    '''
    if relative_urls: return ""
    return "&bokeh-absolute-url=" + url

def _process_resources(resources):
    ''' Return an argument to suppress normal Bokeh server resources, if requested.

    Args:
        resources ("default" or None) :
            If None, return an HTML argument to suppress default resources.

    Returns:
        str

    '''
    if resources not in ("default", None):
        raise ValueError("`resources` must be either 'default' or None.")
    if resources is None:
        return "&resources=none"
    return ""

def _src_path(url, elementid):
    ''' Return a base autoload URL for a given element ID

    Args:
        url (str) :
            The base server URL

        elementid (str) :
            The div ID for autload to target

    Returns:
        str

    '''
    return url + "/autoload.js?bokeh-autoload-element=" + elementid

#-----------------------------------------------------------------------------
# Code
#-----------------------------------------------------------------------------

server_document.__doc__ = format_docstring(server_document.__doc__, DEFAULT_SERVER_HTTP_URL=DEFAULT_SERVER_HTTP_URL)
server_session.__doc__ = format_docstring(server_session.__doc__, DEFAULT_SERVER_HTTP_URL=DEFAULT_SERVER_HTTP_URL)
