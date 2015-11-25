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

from .templates import (
    AUTOLOAD_JS, AUTOLOAD_TAG, FILE,
    NOTEBOOK_DIV, PLOT_DIV, DOC_JS, SCRIPT_TAG
)
from .util.string import encode_utf8

from .model import Model, _ModelInDocument
from ._json_encoder import serialize_json
from .resources import DEFAULT_SERVER_HTTP_URL
from .client import DEFAULT_SESSION_ID
from .document import Document, DEFAULT_TITLE
from collections import Sequence
from six import string_types

def _wrap_in_function(code):
    # indent and wrap Bokeh function def around
    code = "\n".join(["    " + line for line in code.split("\n")])
    return 'Bokeh.$(function() {\n%s\n});' % code

def components(models, resources=None, wrap_script=True, wrap_plot_info=True):
    '''
    Return HTML components to embed a Bokeh plot. The data for the plot is
    stored directly in the returned HTML.

    An example can be found in examples/embed/embed_multiple.py

    .. note::
        The returned components assume that BokehJS resources are
        **already loaded**.

    Args:
        models (Model|list|dict|tuple) :
            A single Model, a list/tuple of Models, or a dictionary of keys and Models.

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
                    'modelid':  'The model ID, used with Document.get_model_by_id',
                    'elementid': 'The css identifier the BokehJS will look for to target the plot',
                    'docid': 'Used by Bokeh to find the doc embedded in the returned script',
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

    was_single_object = isinstance(models, Model) or isinstance(models, Document)
    # converts single to list
    models = _check_models(models, allow_dict=True)
    # now convert dict to list, saving keys in the same order
    model_keys = None
    if isinstance(models, dict):
        model_keys = models.keys()
        values = []
        # don't just use .values() to ensure we are in the same order as key list
        for k in model_keys:
            values.append(models[k])
        models = values

    # 2) Do our rendering

    with _ModelInDocument(models):
        (docs_json, render_items) = _standalone_docs_json_and_render_items(models)
        custom_models = _extract_custom_models(models)

    script = _script_for_render_items(docs_json, render_items, custom_models=custom_models,
                                      websocket_url=None, wrap_script=wrap_script)
    script = encode_utf8(script)

    if wrap_plot_info:
        results = list(_div_for_render_item(item) for item in render_items)
    else:
        results = render_items

    # 3) convert back to the input shape

    if was_single_object:
        return script, results[0]
    elif model_keys is not None:
        result = {}
        for (key, value) in zip(model_keys, results):
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

def _extract_custom_models(models):
    custom_models = {}

    def extract_from_model(model):
        for r in model.references():
            impl = getattr(r.__class__, "__implementation__", None)
            if impl is not None:
                name = r.__class__.__name__
                impl = "['%s', {}]" % _escape_code(impl)
                custom_models[name] = impl

    for o in models:
        if isinstance(o, Document):
            for r in o.roots:
                extract_from_model(r)
        else:
            extract_from_model(o)

    return custom_models

def notebook_div(model):
    ''' Return HTML for a div that will display a Bokeh plot in an
    IPython Notebook

    The data for the plot is stored directly in the returned HTML.

    Args:
        model (Model) : Bokeh object to render

    Returns:
        UTF-8 encoded HTML text for a ``<div>``

    .. note::
        Assumes :func:`~bokeh.util.notebook.load_notebook` or the equivalent
        has already been executed.

    '''
    model = _check_one_model(model)

    with _ModelInDocument(model):
        (docs_json, render_items) = _standalone_docs_json_and_render_items([model])
        custom_models = _extract_custom_models([model])

    script = _script_for_render_items(docs_json, render_items,
                                      custom_models=custom_models,
                                      websocket_url=None)

    item = render_items[0]

    div = _div_for_render_item(item)

    html = NOTEBOOK_DIV.render(
        plot_script = script,
        plot_div = div,
    )
    return encode_utf8(html)

def _use_widgets(models):
    from .models.widgets import Widget
    for o in models:
        if isinstance(o, Document):
            if _use_widgets(o.roots):
                return True
        else:
            if any(isinstance(model, Widget) for model in o.references()):
                return True
    return False

def file_html(models,
              resources,
              title=None,
              js_resources=None,
              css_resources=None,
              template=FILE,
              template_variables={}):
    '''Return an HTML document that embeds Bokeh Model or Document objects.

    The data for the plot is stored directly in the returned HTML.

    This is an alias for standalone_html_page_for_models() which
    supports customizing the JS/CSS resources independently and
    customizing the jinja2 template.

    Args:
        models (Model or Document or list) : Bokeh object or objects to render
            typically a Model or Document
        resources (Resources) : a resource configuration for Bokeh JS & CSS assets. Pass ``None`` if
            using js_resources of css_resources manually.
        title (str, optional) : a title for the HTML document ``<title>`` tags or None. (default: None)
            If None, attempt to automatically find the Document title from the given plot objects.
        js_resources (JSResources, optional): custom JS Resources (default: ``None``), if
            resources is also provided, resources will override js_resources.
        css_resources (CSSResources, optional): custom CSS Resources (default: ``None``), if
            resources is also provided, resources will override css_resources.
        template (Template, optional) : HTML document template (default: FILE)
            A Jinja2 Template, see bokeh.templates.FILE for the required
            template parameters
        template_variables (dict, optional) : variables to be used in the Jinja2
            template. If used, the following variable names will be overwritten:
            title, bokeh_js, bokeh_css, plot_script, plot_div

    Returns:
        UTF-8 encoded HTML

    '''
    models = _check_models(models)

    with _ModelInDocument(models):

        (docs_json, render_items) = _standalone_docs_json_and_render_items(models)
        title = _title_from_models(models, title)
        custom_models = _extract_custom_models(models)
        return _html_page_for_render_items(resources, docs_json, render_items, title=title,
                                           custom_models=custom_models, websocket_url=None,
                                           js_resources=js_resources, css_resources=css_resources,
                                           template=template, template_variables=template_variables,
                                           use_widgets=_use_widgets(models))

# TODO rename this "standalone"?
def autoload_static(model, resources, script_path):
    ''' Return JavaScript code and a script tag that can be used to embed
    Bokeh Plots.

    The data for the plot is stored directly in the returned JavaScript code.

    Args:
        model (Model or Document) :
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

    model = _check_one_model(model)

    with _ModelInDocument(model):

        (docs_json, render_items) = _standalone_docs_json_and_render_items([model])
        item = render_items[0]

        model_id = ""
        if 'modelid' in item:
            model_id = item['modelid']
        doc_id = ""
        if 'docid' in item:
            doc_id = item['docid']

        js = AUTOLOAD_JS.render(
            docs_json = serialize_json(docs_json),
            js_urls = resources.js_files,
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

def autoload_server(model, app_path="/", session_id=DEFAULT_SESSION_ID, url="default", loglevel="info"):
    ''' Return a script tag that can be used to embed Bokeh Plots from
    a Bokeh Server.

    The data for the plot is stored on the Bokeh Server.

    Args:
        model (Model) : the object to render from the session, or None for entire document
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
    if model is not None:
        model_id = model._id

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

def _script_for_render_items(docs_json, render_items, websocket_url,
                             custom_models, wrap_script=True):
    # this avoids emitting the "register custom models" code at all
    # just to register an empty set
    if (custom_models is not None) and len(custom_models) == 0:
        custom_models = None

    plot_js = _wrap_in_function(
        DOC_JS.render(
            custom_models=custom_models,
            websocket_url=websocket_url,
            docs_json=serialize_json(docs_json),
            render_items=serialize_json(render_items)
        )
    )
    if wrap_script:
        return SCRIPT_TAG.render(js_code=plot_js)
    else:
        return plot_js

def _html_page_for_render_items(resources, docs_json, render_items, title, websocket_url,
                                custom_models, js_resources=None, css_resources=None,
                                template=FILE, template_variables={}, use_widgets=True):
    if title is None:
        title = DEFAULT_TITLE

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
        js_resources = js_resources.use_widgets(use_widgets)
        bokeh_js = js_resources.render_js()

    bokeh_css = ''
    if css_resources:
        if not js_resources:
            warn('No Bokeh JS Resources provided to template. If required you will need to provide them manually.')
        css_resources = css_resources.use_widgets(use_widgets)
        bokeh_css = css_resources.render_css()

    script = _script_for_render_items(docs_json, render_items, websocket_url, custom_models)

    template_variables_full = template_variables.copy()

    template_variables_full.update(dict(
        title = title,
        bokeh_js = bokeh_js,
        bokeh_css = bokeh_css,
        plot_script = script,
        plot_div = "\n".join(_div_for_render_item(item) for item in render_items)
    ))

    html = template.render(template_variables_full)
    return encode_utf8(html)

def _check_models(models, allow_dict=False):
    input_type_valid = False

    # Check for single item
    if isinstance(models, (Model, Document)):
        models = [models]

    # Check for sequence
    if isinstance(models, Sequence) and all(isinstance(x, (Model, Document)) for x in models):
        input_type_valid = True

    if allow_dict:
        if isinstance(models, dict) and \
           all(isinstance(x, string_types) for x in models.keys()) and \
           all(isinstance(x, (Model, Document)) for x in models.values()):
            input_type_valid = True

    if not input_type_valid:
        if allow_dict:
            raise ValueError(
                'Input must be a Model, a Document, a Sequence of Models and Document, or a dictionary from string to Model and Document'
            )
        else:
            raise ValueError('Input must be a Model, a Document, or a Sequence of Models and Document')

    return models

def _check_one_model(model):
    models = _check_models(model)
    if len(models) != 1:
        raise ValueError("Input must be exactly one Model or Document")
    return models[0]

def _div_for_render_item(item):
    return PLOT_DIV.render(elementid=item['elementid'])

# come up with our best title
def _title_from_models(models, title):
    # use override title
    if title is not None:
        return title

    # use title from any listed document
    for p in models:
        if isinstance(p, Document):
            return p.title

    # use title from any model's document
    for p in models:
        if p.document is not None:
            return p.document.title

    # use default title
    return DEFAULT_TITLE

def _standalone_docs_json_and_render_items(models):
    models = _check_models(models)

    render_items = []
    docs_by_id = {}
    for p in models:
        modelid = None
        if isinstance(p, Document):
            doc = p
        else:
            if p.document is None:
                raise ValueError("To render a Model as HTML it must be part of a Document")
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
def standalone_html_page_for_models(models, resources, title):
    ''' Return an HTML document that renders zero or more Bokeh documents or models.

    The document for each model will be embedded directly in the HTML, so the
    resulting HTML file is standalone (does not require a server). Depending
    on the provided resources, the HTML file may be completely self-contained
    or may have to load JS and CSS from different files.

    Args:
        models (Model or Document) : Bokeh object to render
            typically a Model or a Document
        resources (Resources) : a resource configuration for BokehJS assets
        title (str) : a title for the HTML document ``<title>`` tags or None to use the document title

    Returns:
        UTF-8 encoded HTML

    '''
    return file_html(models, resources, title)

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

    return _html_page_for_render_items(resources, {}, render_items, title,
                                       websocket_url=websocket_url, custom_models=None)

def server_html_page_for_session(session_id, resources, title, websocket_url):
    elementid = str(uuid.uuid4())
    render_items = [{
        'sessionid' : session_id,
        'elementid' : elementid,
        'use_for_title' : True
        # no 'modelid' implies the entire session document
    }]

    return _html_page_for_render_items(resources, {}, render_items, title,
                                       websocket_url=websocket_url, custom_models=None)
