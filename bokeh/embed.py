''' This module provides functions for embedding Bokeh plots in various
different ways.

There are a number of different combinations of options when embedding
Bokeh plots. The data for the plot can be contained in the document,
or on a Bokeh server, or in a sidecar JavaScript file. Likewise, BokehJS
may be inlined in the document, or loaded from CDN or a Bokeh server.

The functions in ``bokeh.embed`` provide functionality to embed in all
these different cases.

'''

from __future__ import absolute_import

import uuid

from .protocol import serialize_json
from .resources import Resources
from .templates import (
    AUTOLOAD, AUTOLOAD_SERVER, AUTOLOAD_STATIC, FILE,
    NOTEBOOK_DIV, PLOT_DIV, PLOT_JS, PLOT_SCRIPT, RESOURCES
)
from .util.string import encode_utf8

def components(plot_object, resources):
    ''' Return HTML components to embed a Bokeh plot.

    The data for the plot is stored directly in the returned HTML.

    .. note:: The returned components assume that BokehJS resources
              are **already loaded**.

    Args:
        plot_object (PlotObject) : Bokeh object to render
            typically a Plot or PlotContext
        resources (Resources, optional) : BokehJS resources config

    Returns:
        (script, div) : UTF-8 encoded

    '''
    ref = plot_object.ref
    elementid = str(uuid.uuid4())

    js = PLOT_JS.render(
        elementid = elementid,
        modelid = ref["id"],
        modeltype = ref["type"],
        all_models = serialize_json(plot_object.dump()),
    )
    script = PLOT_SCRIPT.render(
        plot_js = resources.js_wrapper(js),
    )
    div = PLOT_DIV.render(elementid=elementid)

    return encode_utf8(script), encode_utf8(div)


def notebook_div(plot_object):
    ''' Return HTML for a div that will display a Bokeh plot in an
    IPython Notebook

    The data for the plot is stored directly in the returned HTML.

    Args:
        plot_object (PlotObject) : Bokeh object to render
            typically a Plot or PlotContext

    Returns:
        div : UTF-8 encoded HTML text

    .. note:: Assumes ``bokeh.load_notebook()`` or the equivalent has
              already been executed.

    '''
    ref = plot_object.ref
    resources = Resources()
    elementid = str(uuid.uuid4())

    js = PLOT_JS.render(
        elementid = elementid,
        modelid = ref["id"],
        modeltype = ref["type"],
        all_models = serialize_json(plot_object.dump()),
    )
    script = PLOT_SCRIPT.render(
        plot_js = resources.js_wrapper(js),
    )
    div = PLOT_DIV.render(elementid=elementid)
    html = NOTEBOOK_DIV.render(
        plot_script = script,
        plot_div = div,
    )
    return encode_utf8(html)


def file_html(plot_object, resources, title, template=FILE):
    ''' Return an HTML document that embeds a Bokeh plot.

    The data for the plot is stored directly in the returned HTML.

    Args:
        plot_object (PlotObject) : Bokeh object to render
            typically a Plot or PlotContext
        resources (Resources) : a resource configuration for BokehJS assets
        title (str) : a title for the HTML document ``<title>`` tags
        template (Template, optional) : HTML document template (default: FILE)
            A Jinja2 Template, see bokeh.templates.FILE for the required
            template parameters

    Returns:
        html : standalone HTML document with embedded plot

    '''
    plot_resources = RESOURCES.render(
        js_raw = resources.js_raw,
        css_raw = resources.css_raw,
        js_files = resources.js_files,
        css_files = resources.css_files,
    )
    script, div = components(plot_object, resources)
    html = template.render(
        title = title,
        plot_resources = plot_resources,
        plot_script = script,
        plot_div = div,
    )
    return encode_utf8(html)


def autoload_static(plot_object, resources, script_path):
    ''' Return JavaScript code and a script tag that can be used to embed
    Bokeh Plots.

    The data for the plot is stored directly in the returned JavaScript code.

    Args:
        plot_object (PlotObject) :
        resources (Resources) :
        script_path (str) :

    Returns:
        (js, tag) :
            JavaScript code to be saved at ``script_path`` and a ``<script>``
            tag to load it

    Raises:
        ValueError

    '''
    if resources.mode == 'inline':
        raise ValueError("autoload_static() requires non-inline resources")

    if resources.dev:
        raise ValueError("autoload_static() only works with non-dev resources")

    elementid = str(uuid.uuid4())

    js = AUTOLOAD.render(
        all_models = serialize_json(plot_object.dump()),
        js_url = resources.js_files[0],
        css_files = resources.css_files,
        elementid = elementid,
    )

    tag = AUTOLOAD_STATIC.render(
        src_path = script_path,
        elementid = elementid,
        modelid = plot_object._id,
        modeltype = plot_object.__view_model__,
        loglevel = resources.log_level,
    )

    return encode_utf8(js), encode_utf8(tag)


def autoload_server(plot_object, session):
    ''' Return a script tag that can be used to embed Bokeh Plots from
    a Bokeh Server.

    The data for the plot is stored on the Bokeh Server.

    Args:
        plot_object (PlotObject) :
        session (session) :

    Returns:
        tag :
            a ``<script>`` tag that will execute an autoload script
            loaded from the Bokeh Server

    '''
    elementid = str(uuid.uuid4())
    resources = Resources(root_url=session.root_url, mode="server")
    tag = AUTOLOAD_SERVER.render(
        src_path = resources._autoload_path(elementid),
        elementid = elementid,
        modelid = plot_object._id,
        root_url = resources.root_url,
        docid =  session.docid,
        docapikey = session.apikey,
        loglevel = resources.log_level,
    )

    return encode_utf8(tag)

def autoload_server(plot_object, session, public=False):
    ''' Return a script tag that can be used to embed Bokeh Plots from
    a Bokeh Server.

    The data for the plot is stored on the Bokeh Server.

    Args:
        plot_object (PlotObject) :
        session (session) :

    Returns:
        tag :
            a ``<script>`` tag that will execute an autoload script
            loaded from the Bokeh Server

    '''
    elementid = str(uuid.uuid4())
    resources = Resources(root_url=session.root_url, mode="server")
    tag = AUTOLOAD_SERVER.render(
        src_path = resources._autoload_path(elementid),
        elementid = elementid,
        modelid = plot_object._id,
        root_url = resources.root_url,
        docid =  session.docid,
        docapikey = session.apikey,
        loglevel = resources.log_level,
        public = public
    )

    return encode_utf8(tag)
