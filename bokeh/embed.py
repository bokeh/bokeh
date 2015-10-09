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

import re
import uuid
from warnings import warn

from .resources import Resources
from .templates import (
    AUTOLOAD, AUTOLOAD_SERVER, AUTOLOAD_STATIC, FILE,
    NOTEBOOK_DIV, PLOT_DIV, PLOT_JS, DOC_JS, PLOT_SCRIPT, JS_RESOURCES, CSS_RESOURCES
)
from .util.string import encode_utf8

from .plot_object import PlotObject
from ._json_encoder import serialize_json
from collections import Sequence
from six import string_types


def _wrap_in_function(code):
    # indent and wrap Bokeh function def around
    code = "\n".join(["    " + line for line in code.split("\n")])
    return 'Bokeh.$(function() {\n%s\n});' % code

# TODO (havocp) this function doesn't work anymore; need to understand
# how/why/by-whom it is called and fix it up
def components(plot_objects, resources=None, wrap_script=True, wrap_plot_info=True):
    '''
    Return HTML components to embed a Bokeh plot. The data for the plot is
    stored directly in the returned HTML.

    An example can be found in examples/embed/embed_multiple.py

    .. note:: The returned components assume that BokehJS resources
              are **already loaded**.

    Args:
        plot_objects : PlotObject|list|dict|tuple
            A single PlotObject, a list/tuple of PlotObjects, or a dictionary of keys and PlotObjects.

        resources :
            Deprecated argument

        wrap_script : boolean, optional
            If True, the returned javascript is wrapped in a script tag. (default: True)

        wrap_plot_info : boolean, optional
            If True, then a set of divs are returned.
            If set to False, then dictionaries are returned that can be used to manually
            build your own divs. (default: True)

            If False, the returned dictionary contains the following information::

                {
                    'modelid':  'The plots id, which can be used in the Bokeh.index',
                    'elementid': 'The css identifier the BokehJS will look for to target the plot',
                    'modeltype': 'The Bokeh model name e.g. Plot, Slider',
                }

    Returns:
        (script, div[s]) :  UTF-8 encoded

            The output depends on the input as follows::

                components(plot)
                # => (script, plot_div)

                components((plot1, plot2))
                # => (script, (plot1_div, plot2_div))

                components({"Plot 1": plot1, "Plot 2": plot2})
                # => (script, {"Plot 1": plot1_div, "Plot 2": plot2_div})

        (raw_script, plot_info[s]) : UTF-8 encoded

            The output depends on the input as follows::

                components(plot, wrap_script=False, wrap_plot_info=False)
                # => (javascript, plot_dict)

                components((plot1, plot2), wrap_script=False, wrap_plot_info=False)
                # => (javascript, (plot1_dict, plot2_dict))

                components({"Plot 1": plot1, "Plot 2": plot2}, wrap_script=False, wrap_plot_info=False)
                # => (javascript, {"Plot 1": plot1_dict, "Plot 2": plot2_dict})
    '''
    custom_models, all_models, plots, plot_info, divs = _get_components(plot_objects, resources)

    if wrap_script:
        script = _get_script(custom_models, all_models, plots)
    else:
        script = _get_js(custom_models, all_models, plots)
    script = encode_utf8(script)

    if wrap_plot_info:
        return script, divs
    else:
        return script, plot_info


def _get_components(plot_objects, resources=None):
    plot_objects = _check_components_input(plot_objects, resources)

    custom_models = {}
    all_models = dict()
    plots = []

    if isinstance(plot_objects, Sequence):
        divs = []
        for idx, plot_object in enumerate(plot_objects):
            elementid = str(uuid.uuid4())
            _append_plot(custom_models, all_models, plots, plot_object, elementid)
            divs = _append_div(elementid, divs)
        if len(divs) == 1:
            divs = divs[0]
            plot_info = plots[0]
        else:
            divs = tuple(divs)
            plot_info = tuple(plots)

    if isinstance(plot_objects, dict):
        divs = {}
        plot_info = {}
        for key in plot_objects.keys():
            elementid = str(uuid.uuid4())
            plot_info[key] = _append_plot(custom_models, all_models, plots, plot_objects[key], elementid)
            divs = _append_div(elementid, divs, key)

    return custom_models, list(all_models.values()), plots, plot_info, divs


def _check_components_input(plot_objects, resources=None):
    from .document import Document
    if resources is not None:
        warn('Because the ``resources`` argument is no longer needed, '
             'it is deprecated and will be removed in'
             'a future version.', DeprecationWarning, stacklevel=2)

    input_type_valid = False

    # Check for single item
    if isinstance(plot_objects, (PlotObject, Document)):
        plot_objects = [plot_objects]

    # Check for sequence
    if isinstance(plot_objects, Sequence) and all(isinstance(x, (PlotObject, Document)) for x in plot_objects):
        input_type_valid = True

    if isinstance(plot_objects, dict) and \
       all(isinstance(x, string_types) for x in plot_objects.keys()) and \
       all(isinstance(x, (PlotObject, Document)) for x in plot_objects.values()):
        input_type_valid = True

    if not input_type_valid:
        raise ValueError('Input must be a PlotObject, a Sequence of PlotObjects, or a mapping of string to PlotObjects')

    return plot_objects


def _get_js(custom_models, all_models, plots):
    js = PLOT_JS.render(
        custom_models=custom_models,
        all_models=serialize_json(all_models),
        plots=plots
    )
    return _wrap_in_function(js)


def _get_script(custom_models, all_models, plots):
    js = _get_js(custom_models, all_models, plots)
    script = PLOT_SCRIPT.render(
        plot_js=js,
    )
    return script


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

def _append_plot(custom_models, all_models, plots, plot_object, elementid):
    ref = plot_object.ref

    custom_models.update(_extract_custom_models(plot_object))

    for item in plot_object.dump():
        all_models[item['id']] = item

    plot_info = {
        'modelid': ref["id"],
        'elementid': elementid,
        'modeltype': ref["type"]
    }
    plots.append(plot_info)
    return plot_info


def _append_div(elementid, divs=None, key=None):
    div = PLOT_DIV.render(
        elementid=elementid
    )
    if isinstance(divs, list):
        divs.append(encode_utf8(div))
        return divs
    elif isinstance(divs, dict):
        divs[key] = encode_utf8(div)
        return divs
    else:
        return encode_utf8(div)


def notebook_div(plot_object):
    ''' Return HTML for a div that will display a Bokeh plot in an
    IPython Notebook

    The data for the plot is stored directly in the returned HTML.

    Args:
        plot_object (PlotObject) : Bokeh object to render
            typically a Plot or PlotContext

    Returns:
        div : UTF-8 encoded HTML text

    .. note::
        Assumes ``bokeh.load_notebook()`` or the equivalent has already
        been executed.

    '''
    ref = plot_object.ref
    elementid = str(uuid.uuid4())

    plots = [{
        'modelid': ref["id"],
        'elementid': elementid,
        'modeltype': ref["type"]
    }]

    js = PLOT_JS.render(
        custom_models = _extract_custom_models(plot_object),
        all_models = serialize_json(plot_object.dump()),
        plots = plots
    )
    script = PLOT_SCRIPT.render(
        plot_js = _wrap_in_function(js),
    )
    div = PLOT_DIV.render(elementid=elementid)
    html = NOTEBOOK_DIV.render(
        plot_script = script,
        plot_div = div,
    )
    return encode_utf8(html)


def file_html(plot_object, resources, title, js_resources=None, css_resources=None, template=FILE, template_variables=None):
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
        template_variables (dict, optional) : variables to be used in the Jinja2
            template. If used, the following variable names will be overwritten:
            title, js_resources, css_resources, plot_script, plot_div

    Returns:
        html : standalone HTML document with embedded plot

    '''
    from .document import Document
    if not isinstance(plot_object, (PlotObject, Document)):
        raise ValueError('plot_object must be a single PlotObject')

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

    script, div = components(plot_object)
    template_variables_full = \
        template_variables.copy() if template_variables is not None else {}
    template_variables_full.update(
        {
            'title': title,
            'bokeh_js': bokeh_js,
            'bokeh_css': bokeh_css,
            'plot_script': script,
            'plot_div': div,
        }
    )
    html = template.render(template_variables_full)
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


def autoload_server(plot_object, session, public=False):
    ''' Return a script tag that can be used to embed Bokeh Plots from
    a Bokeh Server.

    The data for the plot is stored on the Bokeh Server.

    Args:
        plot_object (PlotObject) :
        session (Session) :

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


# TODO (havocp) this is the new file_html but for now it
# doesn't support some things file_html does so keeping it
# separate just until we clean up the code above.
def html_page_for_models(plot_objects, resources, title):
    from .document import Document
    input_type_valid = False

    # Check for single item
    if isinstance(plot_objects, (PlotObject, Document)):
        plot_objects = [plot_objects]

    # Check for sequence
    if isinstance(plot_objects, Sequence) and all(isinstance(x, (PlotObject, Document)) for x in plot_objects):
        input_type_valid = True

    if not input_type_valid:
        raise ValueError('Input must be a PlotObject, a Document, or a Sequence of PlotObjects and Document')

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

        div = PLOT_DIV.render(
            elementid=elementid
        )
        render_items.append({
            'docid' : docid,
            'elementid' : elementid,
            'div' : div,
            # if modelid is None, that means the entire document
            'modelid' : modelid
            })

    bokeh_js = JS_RESOURCES.render(js_raw=resources.js_raw, js_files=resources.js_files)
    bokeh_css = CSS_RESOURCES.render(css_raw=resources.css_raw, css_files=resources.css_files)

    docs_json = {}
    for k, v in docs_by_id.items():
        docs_json[k] = v.to_json()

    render_items_without_div = []
    for r in render_items:
        copy = r.copy()
        del copy['div']
        render_items_without_div.append(copy)

    script = PLOT_SCRIPT.render(
        plot_js=_wrap_in_function(
            DOC_JS.render(
                custom_models={}, # TODO
                docs_json=serialize_json(docs_json),
                render_items=serialize_json(render_items_without_div)
            )
        )
    )

    template_variables = {
        'title': title,
        'bokeh_js': bokeh_js,
        'bokeh_css': bokeh_css,
        'plot_script': script,
        'plot_div': "\n".join(d['div'] for d in render_items)
    }

    html = FILE.render(template_variables)
    return encode_utf8(html)
