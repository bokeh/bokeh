''' Provide functions to embed Bokeh models (e.g., plots, widget, layouts)
in various different ways.

There are a number of different combinations of options when embedding
Bokeh plots. The data for the plot can be contained in the document,
or on a Bokeh server, or in a sidecar JavaScript file. Likewise, BokehJS
may be inlined in the document, or loaded from CDN or a Bokeh server.

The functions in ``bokeh.embed`` provide functionality to embed in all
these different cases.

'''

from __future__ import absolute_import

import re
import uuid
from warnings import warn

from .resources import Resources
from .templates import (
    AUTOLOAD_JS, AUTOLOAD_TAG, FILE,
    NOTEBOOK_DIV, PLOT_DIV, DOC_JS, PLOT_SCRIPT,
    JS_RESOURCES, CSS_RESOURCES
)
from .util.string import encode_utf8

from .plot_object import PlotObject
from ._json_encoder import serialize_json
from .resources import DEFAULT_SERVER_HTTP_URL
from .client import DEFAULT_SESSION_ID
from .document import Document
from collections import Sequence
from six import string_types

def _wrap_in_function(code):
    # indent and wrap Bokeh function def around
    code = "\n".join(["    " + line for line in code.split("\n")])
    return 'Bokeh.$(function() {\n%s\n});' % code

def components(plot_objects, resources=None, wrap_script=True, wrap_plot_info=True):
    '''
    Return HTML components to embed a Bokeh plot. The data for the plot is
    stored directly in the returned HTML.

    An example can be found in examples/embed/embed_multiple.py

    .. note::
        The returned components assume that BokehJS resources are
        **already loaded**.

    Args:
        plot_objects (PlotObject|list|dict|tuple) :
            A single PlotObject, a list/tuple of PlotObjects, or a dictionary of keys and PlotObjects.

        resources :
            Deprecated argument

        wrap_script (boolean, optional) :
            If True, the returned javascript is wrapped in a script tag.
            (default: True)

        wrap_plot_info (boolean, optional) : If True, returns ``<div>`` strings.
            Otherwise, return dicts that can be used to build your own divs.
            (default: True)

            If False, the returned dictionary contains the following information:

            .. code-block:: python

                {
                    'modelid':  'The plots id, which can be used in the Bokeh.index',
                    'elementid': 'The css identifier the BokehJS will look for to target the plot',
                    'modeltype': 'The Bokeh model name e.g. Plot, Slider',
                }

    Returns:
        UTF-8 encoded *(script, div[s])* or *(raw_script, plot_info[s])*

    Examples:

        With default wrapping parameter values:

        .. code-block:: python

            components(plot)
            # => (script, plot_div)

            components((plot1, plot2))
            # => (script, (plot1_div, plot2_div))

            components({"Plot 1": plot1, "Plot 2": plot2})
            # => (script, {"Plot 1": plot1_div, "Plot 2": plot2_div})

    Examples:

        With wrapping parameters set to ``False``:

        .. code-block:: python

            components(plot, wrap_script=False, wrap_plot_info=False)
            # => (javascript, plot_dict)

            components((plot1, plot2), wrap_script=False, wrap_plot_info=False)
            # => (javascript, (plot1_dict, plot2_dict))

            components({"Plot 1": plot1, "Plot 2": plot2}, wrap_script=False, wrap_plot_info=False)
            # => (javascript, {"Plot 1": plot1_dict, "Plot 2": plot2_dict})

    '''
    if resources is not None:
        warn('Because the ``resources`` argument is no longer needed, '
             'it is deprecated and no longer has any effect',
             DeprecationWarning, stacklevel=2)

    # 1) Convert single items and dicts into list

    was_single_object = isinstance(plot_objects, PlotObject) or isinstance(plot_objects, Document)
    # converts single to list
    plot_objects = _check_plot_objects(plot_objects, allow_dict=True)
    # now convert dict to list, saving keys in the same order
    plot_object_keys = None
    if isinstance(plot_objects, dict):
        plot_object_keys = plot_objects.keys()
        values = []
        # don't just use .values() to ensure we are in the same order as key list
        for k in plot_object_keys:
            values.append(plot_objects[k])
        plot_objects = values

    # 2) Do our rendering

    (docs_json, render_items) = _standalone_docs_json_and_render_items(plot_objects)
    script = _script_for_render_items(docs_json, render_items, websocket_url=None, wrap_script=wrap_script)
    script = encode_utf8(script)

    if wrap_plot_info:
        results = list(_div_for_render_item(item) for item in render_items)
    else:
        results = render_items

    # 3) convert back to the input shape

    if was_single_object:
        return script, results[0]
    elif plot_object_keys is not None:
        result = {}
        for (key, value) in zip(plot_object_keys, results):
            result[key] = value
        return script, result
    else:
        return script, tuple(results)

def _escape_code(code):
    """ Escape JS/CS source code, so that it can be embbeded in a JS string.

    This is based on https://github.com/joliss/js-string-escape.
    """
    def escape(match):
        ch = match.group(0)

        if ch == '"' or ch == "'" or ch == '\\':
            return '\\' + ch
        elif ch == '\n':
            return '\\n'
        elif ch == '\r':
            return '\\r'
        elif ch == '\u2028':
            return '\\u2028'
        elif ch == '\u2029':
            return '\\u2029'

    return re.sub(u"""['"\\\n\r\u2028\u2029]""", escape, code)

def _extract_custom_models(plot_object):
    custom_models = {}

    for obj in plot_object.references():
        impl = getattr(obj.__class__, "__implementation__", None)

        if impl is not None:
            name = obj.__class__.__name__
            impl = "['%s', {}]" % _escape_code(impl)
            custom_models[name] = impl

    return custom_models

def notebook_div(plot_object):
    ''' Return HTML for a div that will display a Bokeh plot in an
    IPython Notebook

    The data for the plot is stored directly in the returned HTML.

    Args:
        plot_object (PlotObject) : Bokeh object to render

    Returns:
        UTF-8 encoded HTML text for a ``<div>``

    .. note::
        Assumes :func:`~bokeh.util.notebook.load_notebook` or the equivalent
        has already been executed.

    '''
    plot_object = _check_one_plot_object(plot_object)

    (docs_json, render_items) = _standalone_docs_json_and_render_items([plot_object])
    item = render_items[0]

    script = _script_for_render_items(docs_json, render_items, websocket_url=None)

    div = _div_for_render_item(item)

    html = NOTEBOOK_DIV.render(
        plot_script = script,
        plot_div = div,
    )
    return encode_utf8(html)

def file_html(plot_objects,
              resources,
              title,
              js_resources=None,
              css_resources=None,
              template=FILE,
              template_variables=None):
    '''Return an HTML document that embeds Bokeh PlotObject or Document objects.

    The data for the plot is stored directly in the returned HTML.

    This is an alias for standalone_html_page_for_models() which
    supports customizing the JS/CSS resources independently and
    customizing the jinja2 template.

    Args:
        plot_objects (PlotObject or Document or list) : Bokeh object or objects to render
            typically a PlotObject or Document
        resources (Resources) : a resource configuration for BokehJS assets
        title (str) : a title for the HTML document ``<title>`` tags
        template (Template, optional) : HTML document template (default: FILE)
            A Jinja2 Template, see bokeh.templates.FILE for the required
            template parameters
        template_variables (dict, optional) : variables to be used in the Jinja2
            template. If used, the following variable names will be overwritten:
            title, js_resources, css_resources, plot_script, plot_div

    Returns:
        UTF-8 encoded HTML

    '''
    plot_objects = _check_plot_objects(plot_objects)

    (docs_json, render_items) = _standalone_docs_json_and_render_items(plot_objects)
    return _html_page_for_render_items(resources, docs_json, render_items, title, websocket_url=None,
                                       js_resources=js_resources, css_resources=css_resources,
                                       template=template, template_variables=template_variables)

# TODO rename this "standalone"?
def autoload_static(plot_object, resources, script_path):
    ''' Return JavaScript code and a script tag that can be used to embed
    Bokeh Plots.

    The data for the plot is stored directly in the returned JavaScript code.

    Args:
        plot_object (PlotObject or Document) :
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

    # TODO why is this?
    if resources.dev:
        raise ValueError("autoload_static() only works with non-dev resources")

    plot_object = _check_one_plot_object(plot_object)

    (docs_json, render_items) = _standalone_docs_json_and_render_items([plot_object])
    item = render_items[0]

    model_id = ""
    if 'modelid' in item:
        model_id = item['modelid']
    doc_id = ""
    if 'docid' in item:
        doc_id = item['docid']

    js = AUTOLOAD_JS.render(
        docs_json = serialize_json(docs_json),
        # TODO we should load all the JS files, but the code
        # in AUTOLOAD_JS isn't smart enough to deal with it.
        js_url = resources.js_files[0],
        css_files = resources.css_files,
        elementid = item['elementid'],
        websocket_url = None
    )

    tag = AUTOLOAD_TAG.render(
        src_path = script_path,
        elementid = item['elementid'],
        modelid = model_id,
        docid = doc_id,
        loglevel = resources.log_level
    )

    return encode_utf8(js), encode_utf8(tag)

def autoload_server(plot_object, app_path="/", session_id=DEFAULT_SESSION_ID, url="default", loglevel="info"):
    ''' Return a script tag that can be used to embed Bokeh Plots from
    a Bokeh Server.

    The data for the plot is stored on the Bokeh Server.

    Args:
        plot_object (PlotObject) : the object to render from the session, or None for entire document
        app_path (str, optional) : the server path to the app we want to load
        session_id (str, optional) : server session ID
        url (str, optional) : server root URL (where static resources live, not where a specific app lives)
        loglevel (str, optional) : "trace", "debug", "info", "warn", "error", "fatal"

    Returns:
        tag :
            a ``<script>`` tag that will execute an autoload script
            loaded from the Bokeh Server

    '''

    if url == "default":
        url = DEFAULT_SERVER_HTTP_URL

    elementid = str(uuid.uuid4())

    # empty model_id means render the entire doc from session_id
    model_id = ""
    if plot_object is not None:
        model_id = plot_object._id

    if not url.endswith("/"):
        url = url + "/"
    if not app_path.endswith("/"):
        app_path = app_path + "/"
    if app_path.startswith("/"):
        app_path = app_path[1:]
    src_path = url + app_path + "autoload.js" + "?bokeh-autoload-element=" + elementid

    tag = AUTOLOAD_TAG.render(
        src_path = src_path,
        elementid = elementid,
        modelid = model_id,
        sessionid = session_id,
        loglevel = loglevel
    )

    return encode_utf8(tag)

def _script_for_render_items(docs_json, render_items, websocket_url, wrap_script = True):
    plot_js = _wrap_in_function(
        DOC_JS.render(
            custom_models={}, # TODO
            websocket_url=websocket_url,
            docs_json=serialize_json(docs_json),
            render_items=serialize_json(render_items)
        )
    )
    if wrap_script:
        return PLOT_SCRIPT.render(plot_js=plot_js)
    else:
        return plot_js

def _html_page_for_render_items(resources, docs_json, render_items, title, websocket_url,
                                js_resources=None, css_resources=None, template=FILE,
                                template_variables=None):
    if resources:
        if js_resources:
            warn('Both resources and js_resources provided. resources will override js_resources.')
        if css_resources:
            warn('Both resources and css_resources provided. resources will override css_resources.')

        js_resources = resources
        css_resources = resources

    bokeh_js = ''
    if js_resources:
        if not css_resources:
            warn('No Bokeh CSS Resources provided to template. If required you will need to provide them manually.')
        bokeh_js = JS_RESOURCES.render(js_raw=js_resources.js_raw, js_files=js_resources.js_files)

    bokeh_css = ''
    if css_resources:
        if not js_resources:
            warn('No Bokeh JS Resources provided to template. If required you will need to provide them manually.')
        bokeh_css = CSS_RESOURCES.render(css_raw=css_resources.css_raw, css_files=css_resources.css_files)

    script = _script_for_render_items(docs_json, render_items, websocket_url)

    template_variables_full = \
        template_variables.copy() if template_variables is not None else {}

    template_variables_full.update({
        'title': title,
        'bokeh_js': bokeh_js,
        'bokeh_css': bokeh_css,
        'plot_script': script,
        'plot_div': "\n".join(_div_for_render_item(item) for item in render_items)
    })

    html = template.render(template_variables_full)
    return encode_utf8(html)

def _check_plot_objects(plot_objects, allow_dict=False):
    input_type_valid = False

    # Check for single item
    if isinstance(plot_objects, (PlotObject, Document)):
        plot_objects = [plot_objects]

    # Check for sequence
    if isinstance(plot_objects, Sequence) and all(isinstance(x, (PlotObject, Document)) for x in plot_objects):
        input_type_valid = True

    if allow_dict:
        if isinstance(plot_objects, dict) and \
           all(isinstance(x, string_types) for x in plot_objects.keys()) and \
           all(isinstance(x, (PlotObject, Document)) for x in plot_objects.values()):
            input_type_valid = True

    if not input_type_valid:
        if allow_dict:
            raise ValueError('Input must be a PlotObject, a Document, a Sequence of PlotObjects and Document, or a dictionary from string to PlotObject and Document')
        else:
            raise ValueError('Input must be a PlotObject, a Document, or a Sequence of PlotObjects and Document')

    return plot_objects

def _check_one_plot_object(plot_object):
    plot_objects = _check_plot_objects(plot_object)
    if len(plot_objects) != 1:
        raise ValueError("Input must be exactly one PlotObject or Document")
    return plot_objects[0]

def _div_for_render_item(item):
    return PLOT_DIV.render(elementid=item['elementid'])

def _standalone_docs_json_and_render_items(plot_objects):
    plot_objects = _check_plot_objects(plot_objects)

    render_items = []
    docs_by_id = {}
    for p in plot_objects:
        modelid = None
        if isinstance(p, Document):
            doc = p
        else:
            if p.document is None:
                raise ValueError("To render a PlotObject as HTML it must be part of a Document")
            doc = p.document
            modelid = p._id
        docid = None
        for key in docs_by_id:
            if docs_by_id[key] == doc:
                docid = key
        if docid is None:
            docid = str(uuid.uuid4())
            docs_by_id[docid] = doc

        elementid = str(uuid.uuid4())

        render_items.append({
            'docid' : docid,
            'elementid' : elementid,
            # if modelid is None, that means the entire document
            'modelid' : modelid
            })

    docs_json = {}
    for k, v in docs_by_id.items():
        docs_json[k] = v.to_json()

    return (docs_json, render_items)

# TODO this is a theory about what file_html() "should" be,
# with a more explicit name similar to the server names below,
# and without the jinja2 entanglement. Thus this encapsulates that
# we use jinja2 and encapsulates the exact template variables we require.
# Anyway, we should deprecate file_html or else drop this version,
# most likely.
def standalone_html_page_for_models(plot_objects, resources, title):
    ''' Return an HTML document that renders zero or more Bokeh documents or models.

    The document for each model will be embedded directly in the HTML, so the
    resulting HTML file is standalone (does not require a server). Depending
    on the provided resources, the HTML file may be completely self-contained
    or may have to load JS and CSS from different files.

    Args:
        plot_objects (PlotObject or Document) : Bokeh object to render
            typically a PlotObject or a Document
        resources (Resources) : a resource configuration for BokehJS assets
        title (str) : a title for the HTML document ``<title>`` tags

    Returns:
        UTF-8 encoded HTML

    '''
    return file_html(plot_objects, resources, title)

def server_html_page_for_models(session_id, model_ids, resources, title, websocket_url):
    render_items = []
    for modelid in model_ids:
        if modelid is None:
            raise ValueError("None found in list of model_ids")

        elementid = str(uuid.uuid4())

        render_items.append({
            'sessionid' : session_id,
            'elementid' : elementid,
            'modelid' : modelid
            })

    return _html_page_for_render_items(resources, {}, render_items, title, websocket_url)

def server_html_page_for_session(session_id, resources, title, websocket_url):
    elementid = str(uuid.uuid4())
    render_items = [{
        'sessionid' : session_id,
        'elementid' : elementid
        # no 'modelid' implies the entire session document
    }]

    return _html_page_for_render_items(resources, {}, render_items, title, websocket_url)
