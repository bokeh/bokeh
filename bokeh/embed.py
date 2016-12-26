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

from collections import Sequence
from warnings import warn

from six import string_types

from .core.templates import (
    AUTOLOAD_JS, AUTOLOAD_NB_JS, AUTOLOAD_TAG,
    FILE, NOTEBOOK_DIV, PLOT_DIV, DOC_JS, SCRIPT_TAG
)
from .core.json_encoder import serialize_json
from .document import Document, DEFAULT_TITLE
from .model import Model, _ModelInDocument, _ModelInEmptyDocument
from .resources import BaseResources, _SessionCoordinates, EMPTY
from .util.string import encode_utf8
from .util.serialization import make_id
from .util.deprecation import deprecated

def _indent(text, n=2):
    return "\n".join([ " "*n + line for line in text.split("\n") ])

def _wrap_in_safely(code):
    return """\
Bokeh.safely(function() {
%(code)s
});""" % dict(code=_indent(code, 2))

def _wrap_in_onload(code):
    return """\
(function() {
  var fn = function() {
%(code)s
  };
  if (document.readyState != "loading") fn();
  else document.addEventListener("DOMContentLoaded", fn);
})();
""" % dict(code=_indent(code, 4))

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
        deprecated('Because the ``resources`` argument is no longer needed, '
                   'it is deprecated and no longer has any effect.')

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

    script = _script_for_render_items(docs_json, render_items, websocket_url=None, wrap_script=wrap_script)
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

def _use_widgets(objs):
    from .models.widgets import Widget

    def _needs_widgets(obj):
        return isinstance(obj, Widget)

    for obj in objs:
        if isinstance(obj, Document):
            if _use_widgets(obj.roots):
                return True
        else:
            if any(_needs_widgets(ref) for ref in obj.references()):
                return True
    else:
        return False

def _bundle_for_objs_and_resources(objs, resources):
    if isinstance(resources, BaseResources):
        js_resources = css_resources = resources
    elif isinstance(resources, tuple) and len(resources) == 2 and all(r is None or isinstance(r, BaseResources) for r in resources):
        js_resources, css_resources = resources

        if js_resources and not css_resources:
            warn('No Bokeh CSS Resources provided to template. If required you will need to provide them manually.')

        if css_resources and not js_resources:
            warn('No Bokeh JS Resources provided to template. If required you will need to provide them manually.')
    else:
        raise ValueError("expected Resources or a pair of optional Resources, got %r" % resources)

    from copy import deepcopy

    # XXX: force all components on server and in notebook, because we don't know in advance what will be used
    use_widgets =  _use_widgets(objs) if objs else True

    if js_resources:
        js_resources = deepcopy(js_resources)
        if not use_widgets and "bokeh-widgets" in js_resources.components:
            js_resources.components.remove("bokeh-widgets")
        bokeh_js = js_resources.render_js()
    else:
        bokeh_js = None

    if css_resources:
        css_resources = deepcopy(css_resources)
        if not use_widgets and "bokeh-widgets" in css_resources.components:
            css_resources.components.remove("bokeh-widgets")
        bokeh_css = css_resources.render_css()
    else:
        bokeh_css = None

    return bokeh_js, bokeh_css


def notebook_div(model, notebook_comms_target=None):
    ''' Return HTML for a div that will display a Bokeh plot in an
    IPython Notebook

    The data for the plot is stored directly in the returned HTML.

    Args:
        model (Model) : Bokeh object to render
        notebook_comms_target (str, optional) :
            A target name for a Jupyter Comms object that can update
            the document that is rendered to this notebook div

    Returns:
        UTF-8 encoded HTML text for a ``<div>``

    .. note::
        Assumes :func:`~bokeh.util.notebook.load_notebook` or the equivalent
        has already been executed.

    '''
    model = _check_one_model(model)

    with _ModelInEmptyDocument(model):
        (docs_json, render_items) = _standalone_docs_json_and_render_items([model])

    item = render_items[0]
    if notebook_comms_target:
        item['notebook_comms_target'] = notebook_comms_target
    else:
        notebook_comms_target = ''

    script = _wrap_in_onload(DOC_JS.render(
        docs_json=serialize_json(docs_json),
        render_items=serialize_json(render_items)
    ))
    resources = EMPTY

    js = AUTOLOAD_NB_JS.render(
        comms_target=notebook_comms_target,
        js_urls = resources.js_files,
        css_urls = resources.css_files,
        js_raw = resources.js_raw + [script],
        css_raw = resources.css_raw_str,
        elementid = item['elementid']
    )
    div = _div_for_render_item(item)

    html = NOTEBOOK_DIV.render(
        plot_script = js,
        plot_div = div,
    )
    return encode_utf8(html)

def file_html(models,
              resources,
              title=None,
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
        resources (Resources or tuple(JSResources or None, CSSResources or None)) : a resource configuration for Bokeh JS & CSS assets.
        title (str, optional) : a title for the HTML document ``<title>`` tags or None. (default: None)
            If None, attempt to automatically find the Document title from the given plot objects.
        template (Template, optional) : HTML document template (default: FILE)
            A Jinja2 Template, see bokeh.core.templates.FILE for the required
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
        bundle = _bundle_for_objs_and_resources(models, resources)
        return _html_page_for_render_items(bundle, docs_json, render_items, title=title,
                                           template=template, template_variables=template_variables)

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
    # TODO: maybe warn that it's not exactly useful, but technically possible
    # if resources.mode == 'inline':
    #     raise ValueError("autoload_static() requires non-inline resources")

    model = _check_one_model(model)

    with _ModelInDocument(model):
        (docs_json, render_items) = _standalone_docs_json_and_render_items([model])

    script = _script_for_render_items(docs_json, render_items, wrap_script=False)
    item = render_items[0]

    js = _wrap_in_onload(AUTOLOAD_JS.render(
        js_urls = resources.js_files,
        css_urls = resources.css_files,
        js_raw = resources.js_raw + [script],
        css_raw = resources.css_raw_str,
        elementid = item['elementid'],
    ))

    tag = AUTOLOAD_TAG.render(
        src_path = script_path,
        elementid = item['elementid'],
        modelid = item.get('modelid', ''),
        docid = item.get('docid', ''),
    )

    return encode_utf8(js), encode_utf8(tag)

def autoload_server(model, app_path="/", session_id=None, url="default"):
    '''Return a script tag that embeds the given model (or entire
    Document) from a Bokeh server session.

    In a typical deployment, each browser tab connecting to a
    Bokeh application will have its own unique session ID. The session ID
    identifies a unique Document instance for each session (so the state
    of the Document can be different in every tab).

    If you call ``autoload_server(model=None)``, you'll embed the
    entire Document for a freshly-generated session ID. Typically,
    you should call ``autoload_server()`` again for each page load so
    that every new browser tab gets its own session.

    Sometimes when doodling around on a local machine, it's fine
    to set ``session_id`` to something human-readable such as
    ``"default"``.  That way you can easily reload the same
    session each time and keep your state.  But don't do this in
    production!

    In some applications, you may want to "set up" the session
    before you embed it. For example, you might ``session =
    bokeh.client.pull_session()`` to load up a session, modify
    ``session.document`` in some way (perhaps adding per-user
    data?), and then call ``autoload_server(model=None,
    session_id=session.id)``. The session ID obtained from
    ``pull_session()`` can be passed to ``autoload_server()``.

    Args:
        model (Model) : the object to render from the session, or None for entire document
        app_path (str, optional) : the server path to the app we want to load
        session_id (str, optional) : server session ID (default: None)
          If None, let the server autogenerate a random session ID. If you supply
          a specific model to render, you must also supply the session ID containing
          that model, though.
        url (str, optional) : server root URL (where static resources live, not where a specific app lives)

    Returns:
        tag :
            a ``<script>`` tag that will execute an autoload script
            loaded from the Bokeh Server

    .. note::
        Bokeh apps embedded using ``autoload_server`` will NOT set the browser
        window title.

    .. warning::
        It is a very bad idea to use the same ``session_id`` for every page
        load; you are likely to create scalability and security problems. So
        ``autoload_server()`` should be called again on each page load.

    '''

    coords = _SessionCoordinates(dict(url=url,
                                      session_id=session_id,
                                      app_path=app_path))

    elementid = make_id()

    # empty model_id means render the entire doc from session_id
    model_id = ""
    if model is not None:
        model_id = model._id

    if model_id and session_id is None:
        raise ValueError("A specific model was passed to autoload_server() but no session_id; "
                         "this doesn't work because the server will generate a fresh session "
                         "which won't have the model in it.")

    src_path = coords.server_url + "/autoload.js" + \
               "?bokeh-autoload-element=" + elementid

    # we want the server to generate the ID, so the autoload script
    # can be embedded in a static page while every user still gets
    # their own session. So we omit bokeh-session-id rather than
    # using a generated ID.
    if coords.session_id_allowing_none is not None:
        src_path = src_path + "&bokeh-session-id=" + session_id

    tag = AUTOLOAD_TAG.render(
        src_path = src_path,
        elementid = elementid,
        modelid = model_id,
    )

    return encode_utf8(tag)

def _script_for_render_items(docs_json, render_items, websocket_url=None, wrap_script=True):
    plot_js = _wrap_in_onload(_wrap_in_safely(DOC_JS.render(
        websocket_url=websocket_url,
        docs_json=serialize_json(docs_json),
        render_items=serialize_json(render_items),
    )))

    if wrap_script:
        return SCRIPT_TAG.render(js_code=plot_js)
    else:
        return plot_js

def _html_page_for_render_items(bundle, docs_json, render_items, title, websocket_url=None,
                                template=FILE, template_variables={}):
    if title is None:
        title = DEFAULT_TITLE

    bokeh_js, bokeh_css = bundle

    script = _script_for_render_items(docs_json, render_items, websocket_url)

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
            docid = make_id()
            docs_by_id[docid] = doc

        elementid = make_id()

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

def server_html_page_for_models(session_id, model_ids, resources, title, websocket_url, template=FILE):
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

    bundle = _bundle_for_objs_and_resources(None, resources)
    return _html_page_for_render_items(bundle, {}, render_items, title, template=template, websocket_url=websocket_url)

def server_html_page_for_session(session_id, resources, title, websocket_url, template=FILE,
                                 template_variables=None):
    elementid = make_id()
    render_items = [{
        'sessionid' : session_id,
        'elementid' : elementid,
        'use_for_title' : True
        # no 'modelid' implies the entire session document
    }]

    if template_variables is None:
        template_variables = {}

    bundle = _bundle_for_objs_and_resources(None, resources)
    return _html_page_for_render_items(bundle, {}, render_items, title, template=template,
            websocket_url=websocket_url, template_variables=template_variables)
