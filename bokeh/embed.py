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

from contextlib import contextmanager
from collections import Sequence
from warnings import warn
import re

from six import string_types
from six.moves.urllib.parse import urlparse

from .core.templates import (
    AUTOLOAD_JS, AUTOLOAD_NB_JS, AUTOLOAD_TAG,
    FILE, NOTEBOOK_DIV, PLOT_DIV, DOC_JS, SCRIPT_TAG
)
from .core.json_encoder import serialize_json
from .document import Document, DEFAULT_TITLE
from .model import Model
from .resources import BaseResources, DEFAULT_SERVER_HTTP_URL, _SessionCoordinates
from .settings import settings
from .util.deprecation import deprecated
from .util.string import encode_utf8, format_docstring
from .util.serialization import make_id
from .util.compiler import bundle_all_models

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

def _wrap_in_script_tag(js):
    return SCRIPT_TAG.render(js_code=js)

@contextmanager
def _ModelInDocument(models, apply_theme=None):
    doc = _find_existing_docs(models)
    old_theme = doc.theme

    if apply_theme is FromCurdoc:
        from .io import curdoc; curdoc
        doc.theme = curdoc().theme
    elif apply_theme is not None:
        doc.theme = apply_theme

    models_to_dedoc = _add_doc_to_models(doc, models)

    if settings.perform_document_validation():
        doc.validate()

    yield models

    for model in models_to_dedoc:
        doc.remove_root(model, apply_theme)
    doc.theme = old_theme

@contextmanager
def _ModelInEmptyDocument(model, apply_theme=None):
    from .document import Document
    doc = _find_existing_docs([model])

    if apply_theme is FromCurdoc:
        from .io import curdoc; curdoc
        doc.theme = curdoc().theme
    elif apply_theme is not None:
        doc.theme = apply_theme

    model._document = None
    for ref in model.references():
        ref._document = None
    empty_doc = Document()
    empty_doc.add_root(model)

    if settings.perform_document_validation():
        empty_doc.validate()

    yield model

    model._document = doc
    for ref in model.references():
        ref._document = doc

def _find_existing_docs(models):
    existing_docs = set(m if isinstance(m, Document) else m.document for m in models)
    existing_docs.discard(None)

    if len(existing_docs) == 0:
        # no existing docs, use the current doc
        doc = Document()
    elif len(existing_docs) == 1:
        # all existing docs are the same, use that one
        doc = existing_docs.pop()
    else:
        # conflicting/multiple docs, raise an error
        msg = ('Multiple items in models contain documents or are '
               'themselves documents. (Models must be owned by only a '
               'single document). This may indicate a usage error.')
        raise RuntimeError(msg)
    return doc

def _add_doc_to_models(doc, models):
    models_to_dedoc = []
    for model in models:
        if isinstance(model, Model):
            if model.document is None:
                try:
                    doc.add_root(model)
                    models_to_dedoc.append(model)
                except RuntimeError as e:
                    child = re.search('\((.*)\)', str(e)).group(0)
                    msg = ('Sub-model {0} of the root model {1} is already owned '
                           'by another document (Models must be owned by only a '
                           'single document). This may indicate a usage '
                           'error.'.format(child, model))
                    raise RuntimeError(msg)
    return models_to_dedoc

class FromCurdoc: pass

def components(models, wrap_script=True, wrap_plot_info=True, theme=FromCurdoc):
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

        theme (Theme, optional) :
            Defaults to the ``Theme`` instance in the current document.
            Setting this to ``None`` uses the default theme or the theme
            already specified in the document. Any other value must be an
            instance of the ``Theme`` class.

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

    # 2) Append models to one document. Either pre-existing or new and render
    with _ModelInDocument(models, apply_theme=theme):
        (docs_json, render_items) = _standalone_docs_json_and_render_items(models)

    script  = bundle_all_models()
    script += _script_for_render_items(docs_json, render_items)
    if wrap_script:
        script = _wrap_in_script_tag(script)
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

def _any(objs, query):
    for obj in objs:
        if isinstance(obj, Document):
            if _any(obj.roots, query):
                return True
        else:
            if any(query(ref) for ref in obj.references()):
                return True
    else:
        return False

def _use_widgets(objs):
    from .models.widgets import Widget
    return _any(objs, lambda obj: isinstance(obj, Widget))

def _use_tables(objs):
    from .models.widgets import TableWidget
    return _any(objs, lambda obj: isinstance(obj, TableWidget))

def _use_gl(objs):
    from .models.plots import Plot
    return _any(objs, lambda obj: isinstance(obj, Plot) and obj.output_backend == "webgl")

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
    use_tables  =  _use_tables(objs)  if objs else True
    use_gl      =  _use_gl(objs)      if objs else True

    if js_resources:
        js_resources = deepcopy(js_resources)
        if not use_widgets and "bokeh-widgets" in js_resources.js_components:
            js_resources.js_components.remove("bokeh-widgets")
        if not use_tables and "bokeh-tables" in js_resources.js_components:
            js_resources.js_components.remove("bokeh-tables")
        if not use_gl and "bokeh-gl" in js_resources.js_components:
            js_resources.js_components.remove("bokeh-gl")
        bokeh_js = js_resources.render_js()
    else:
        bokeh_js = None

    if css_resources:
        css_resources = deepcopy(css_resources)
        if not use_widgets and "bokeh-widgets" in css_resources.css_components:
            css_resources.css_components.remove("bokeh-widgets")
        if not use_tables and "bokeh-tables" in css_resources.css_components:
            css_resources.css_components.remove("bokeh-tables")
        bokeh_css = css_resources.render_css()
    else:
        bokeh_css = None

    return bokeh_js, bokeh_css

def notebook_div(model, notebook_comms_target=None, theme=FromCurdoc):
    ''' Return HTML for a div that will display a Bokeh plot in a
    Jupyter/Zeppelin Notebook. notebook_comms_target is only supported
    in Jupyter for now.

    The data for the plot is stored directly in the returned HTML.

    Args:
        model (Model) : Bokeh object to render
        notebook_comms_target (str, optional) :
            A target name for a Jupyter Comms object that can update
            the document that is rendered to this notebook div
        theme (Theme, optional) :
            Defaults to the ``Theme`` instance in the current document.
            Setting this to ``None`` uses the default theme or the theme
            already specified in the document. Any other value must be an
            instance of the ``Theme`` class.

    Returns:
        UTF-8 encoded HTML text for a ``<div>``

    .. note::
        Assumes :func:`~bokeh.util.notebook.load_notebook` or the equivalent
        has already been executed.

    '''
    model = _check_one_model(model)

    # Append models to one document. Either pre-existing or new and render
    with _ModelInEmptyDocument(model, apply_theme=theme):
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

    js = AUTOLOAD_NB_JS.render(
        comms_target = notebook_comms_target,
        js_urls = [],
        css_urls = [],
        js_raw = [script],
        css_raw = "",
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
              template_variables={},
              theme=FromCurdoc):
    ''' Return an HTML document that embeds Bokeh Model or Document objects.

    The data for the plot is stored directly in the returned HTML, with
    support for customizing the JS/CSS resources independently and
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
        theme (Theme, optional) :
            Defaults to the ``Theme`` instance in the current document.
            Setting this to ``None`` uses the default theme or the theme
            already specified in the document. Any other value must be an
            instance of the ``Theme`` class.

    Returns:
        UTF-8 encoded HTML

    '''
    models = _check_models(models)

    with _ModelInDocument(models, apply_theme=theme):
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

    with _ModelInDocument([model]):
        (docs_json, render_items) = _standalone_docs_json_and_render_items([model])

    bundle = bundle_all_models()
    script = _script_for_render_items(docs_json, render_items)
    item = render_items[0]

    js = _wrap_in_onload(AUTOLOAD_JS.render(
        js_urls = resources.js_files,
        css_urls = resources.css_files,
        js_raw = resources.js_raw + [bundle, script],
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


def _connect_session_or_document(model=None, app_path=None, session_id=None, url="default", relative_urls=False, resources="default", arguments=None):
    ''' Return a script tag that embeds content from a Bokeh server. This is
    a private method not meant to be called directly. Instead it is meant to be
    called by other methods that thinly wrap around it for different use cases:
    autoload_server, server_document and server_session.

    Bokeh apps embedded using these methods will NOT set the browser window title.

    .. note::
        Typically you will not want to save or re-use the output of this
        function for different or multiple page loads.

    Args:
        model (Model, optional) : The object to render from the session

            If ``None`` an entire document is rendered. (default: ``None``)

            If you supply a specific model to render, you must also supply the
            session ID containing that model.

            Supplying a model is usually only useful when embedding
            a specific session that was previously created using the
            ``bokeh.client`` API.

        session_id (str, optional) : A server session ID (default: None)

            If ``None``, let the server auto-generate a random session ID.

            Supplying a session id is usually only useful when embedding
            a specific session that was previously created using the
            ``bokeh.client`` API.

        url (str, optional) : A URL to a Bokeh application on a Bokeh server

            If ``None`` the default URL ``{DEFAULT_SERVER_HTTP_URL}`` will be used.

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

        arguments (dict[str, str], optional) : A dictionary of the arguments to
            be passed to Bokeh (default: None)


    Returns:
        A ``<script>`` tag that will embed content from a Bokeh Server.

    Examples:

        In the simplest and most common case, we wish to embed Bokeh server
        application by providing the URL to where it is located.

        Suppose the app is running (perhaps behind Nginx or some other proxy)
        at ``http://app.server.org/foo/myapp``. We wish to embed this app in
        a page at ``mysite.com``. The following will provide an HTML script
        tag to do that, that can be included in ``mysite.com``:

        .. code-block:: python

            script = autoload_server(url="http://app.server.org/foo/myapp")

        Note that in order for this embedding to work, the Bokeh server needs
        to have been configured to allow connections from the public URL where
        the embedding happens. In this case, if the autoload script is run from
        a page located at ``http://mysite.com/report`` then the Bokeh server
        must have been started with an ``--allow-websocket-origin`` option
        specifically allowing websocket connections from pages that originate
        from ``mysite.com``:

        .. code-block:: sh

            bokeh serve mayapp.py --allow-websocket-origin=mysite.com

        If an autoload script runs from an origin that has not been allowed,
        the Bokeh server will return a 403 error.

        It's also possible to initiate sessions on a Bokeh server from
        Python, using the functions :func:`~bokeh.client.push_session` and
        :func:`~bokeh.client.push_session`. This can be useful in advanced
        situations where you may want to "set up" the session before you
        embed it. For example, you might to load up a session and modify
        ``session.document`` in some way (perhaps adding per-user data).

        In such cases you will pass the session id as an argument as well:

        .. code-block:: python

            script = autoload_server(session_id="some_session_id",
                                     url="http://app.server.org/foo/myapp")

        .. warning::
            It is typically a bad idea to re-use the same ``session_id`` for
            every page load. This is likely to create scalability and security
            problems, and will cause "shared Google doc" behaviour, which is
            typically not desired.

    '''
    from .client.session import _encode_query_param

    if app_path is not None:
        deprecated((0, 12, 5), "app_path", "url", "Now pass entire app URLS in the url arguments, e.g. 'url=http://foo.com:5010/bar/myapp'")
        if not app_path.startswith("/"):
            app_path = "/" + app_path
        url = url + app_path

    coords = _SessionCoordinates(url=url, session_id=session_id)

    elementid = make_id()

    # empty model_id means render the entire doc from session_id
    model_id = ""
    if model is not None:
        model_id = model._id

    if model_id and session_id is None:
        raise ValueError("A specific model was passed to _connect_session_or_document() but no session_id; "
                         "this doesn't work because the server will generate a fresh session "
                         "which won't have the model in it.")

    src_path = coords.url + "/autoload.js?bokeh-autoload-element=" + elementid

    if url != "default":
        app_path = urlparse(url).path.rstrip("/")
        if not app_path.startswith("/"):
            app_path = "/" + app_path
        src_path += "&bokeh-app-path=" + app_path

    if not relative_urls:
        src_path += "&bokeh-absolute-url=" + coords.url

    # we want the server to generate the ID, so the autoload script
    # can be embedded in a static page while every user still gets
    # their own session. So we omit bokeh-session-id rather than
    # using a generated ID.
    if coords.session_id_allowing_none is not None:
        src_path = src_path + "&bokeh-session-id=" + session_id

    if resources not in ("default", None):
        raise ValueError("`resources` must be either 'default' or None.")
    if resources is None:
        src_path = src_path + "&resources=none"

    if arguments is not None:
        for key, value in arguments.items():
            if not key.startswith("bokeh-"):
                src_path = src_path + "&{}={}".format(_encode_query_param(str(key)), _encode_query_param(str(value)))

    tag = AUTOLOAD_TAG.render(
        src_path = src_path,
        app_path = app_path,
        elementid = elementid,
        modelid = model_id,
    )

    return encode_utf8(tag)

_connect_session_or_document.__doc__ = format_docstring(_connect_session_or_document.__doc__, DEFAULT_SERVER_HTTP_URL=DEFAULT_SERVER_HTTP_URL)

def autoload_server(model=None, app_path=None, session_id=None, url="default", relative_urls=False, arguments=None):
    ''' Return a script tag that embeds content from a Bokeh server and loads
    all the necessary JS/CSS resource files. Also accepts an optional dictionary
    of arguments to be passed to Bokeh.
    '''
    deprecated((0, 12, 7), 'bokeh.embed.autoload_server', 'bokeh.embed.server_document or bokeh.embed.server_session')
    return _connect_session_or_document(model=model, app_path=app_path, session_id=session_id, url=url, relative_urls=relative_urls,
                                        resources="default", arguments=arguments)

def server_document(url="default", relative_urls=False, resources="default", arguments=None):
    ''' Works similarly to ``autoload_server`` except a new session will be
    systematically generated and an entire document will be returned. Also
    accepts an optional dictionary of arguments to be passed to Bokeh, and
    resources files may optionally be omitted from loading by passing
    resources="none".
    '''
    return _connect_session_or_document(model=None, session_id=None, url=url, relative_urls=relative_urls,
                                        resources=resources, arguments=arguments)

def server_session(model, session_id, url="default", relative_urls=False, resources="default", arguments=None):
    ''' Works similarly to ``autoload_server`` except an existing session id and
    model must be provided. Also accepts an optional dictionary of arguments to
    be passed to Bokeh, and resources files may optionally be omitted from
    loading by passing resources="none".
    '''
    return _connect_session_or_document(model, session_id=session_id, url=url, relative_urls=relative_urls,
                                        resources=resources, arguments=arguments)

def _script_for_render_items(docs_json, render_items, app_path=None, absolute_url=None):
    js = DOC_JS.render(
        docs_json=serialize_json(docs_json),
        render_items=serialize_json(render_items),
        app_path=app_path,
        absolute_url=absolute_url,
    )

    if not settings.dev:
        js = _wrap_in_safely(js)

    return _wrap_in_onload(js)

def _html_page_for_render_items(bundle, docs_json, render_items, title,
                                template=FILE, template_variables={}):
    if title is None:
        title = DEFAULT_TITLE

    bokeh_js, bokeh_css = bundle

    script  = bundle_all_models()
    script += _script_for_render_items(docs_json, render_items)

    template_variables_full = template_variables.copy()

    template_variables_full.update(dict(
        title = title,
        bokeh_js = bokeh_js,
        bokeh_css = bokeh_css,
        plot_script = _wrap_in_script_tag(script),
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
    deprecated((0, 12, 5), 'bokeh.io.standalone_html_page_for_models', 'bokeh.io.file_html')
    return file_html(models, resources, title)

def server_html_page_for_models(session_id, model_ids, resources, title, template=FILE):
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
    return _html_page_for_render_items(bundle, {}, render_items, title, template=template)

def server_html_page_for_session(session_id, resources, title, template=FILE, template_variables=None):
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
    return _html_page_for_render_items(bundle, dict(), render_items, title, template=template, template_variables=template_variables)
