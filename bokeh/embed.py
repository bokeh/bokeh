''' This module provides functions for embedding Bokeh plots in various
different ways.

'''

import uuid

from .protocol import serialize_json
from .templates import (
    AUTOLOAD, AUTOLOAD_SERVER, AUTOLOAD_STATIC, FILE,
    NOTEBOOK_DIV, PLOT_DIV, PLOT_JS, PLOT_SCRIPT, RESOURCES
)

def components(plot_object):
    ''' Return HTML components to embed a Bokeh plot.

    The data for the plot is stored directly in the returned HTML.

    .. note:: The returned components assume that BokehJS resources
              are **already loaded**.

    Args:
        plot_object (PlotObject) : Bokeh object to render
            typically a Plot or PlotContext

    Returns:
        (script, div)

    '''
    ref = plot_object.get_ref()
    elementid = str(uuid.uuid4())

    js = PLOT_JS.render(
        elementid = elementid,
        modelid = ref["id"],
        modeltype = ref["type"],
        all_models = serialize_json(curdoc().dump()),
    )
    script = PLOT_SCRIPT.render(
        plot_js = resources.js_wrapper(js),
    )
    div = PLOT_DIV.render(elementid=elementid)

    return script, div


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
    script, div = components(plot_object)
    html = NOTEBOOK_DIV.render(
        plot_script = script,
        plot_div = div,
    )
    return html.encode("utf-8")


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
    script, div = components(plot_object)
    html = file_template.render(
        title = title,
        plot_resources = plot_resources,
        plot_script = script,
        plot_div = div,
    )
    return html.encode("utf-8")


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
    if resources.mode != 'inline':
        raise ValueError("autoload_static() requires non-inline resources")

    if resources.dev:
        raise ValueError("autoload_static() only works with non-dev resources")

    elementid = str(uuid.uuid4())

    js = AUTOLOAD.render(
        js_url = resources.js_files[0],
        css_files = resources.css_files,
        elementid = elementid,
    )

    tag = AUTOLOAD_STATIC.render(
        src_path = script_path,
        elementid = elementid,
        modelid = plot_object._id,
        modeltype = plot_object.__view_model__,
    )

    return js, tag


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

    tag = AUTOLOAD_SERVER.render(
        src_path = session.root_url + "/bokeh/autoload.js/%s" % elementid,
        elementid = elementid,
        modelid = plot_object._id,
        modeltype = plot_object.__view_model__,
        root_url = session.root_url,
        docid =  session.docid,
        docapikey = session.api_key,
        conn_string = sess.conn_string,
    )

    return tag


