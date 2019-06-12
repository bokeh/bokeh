#-----------------------------------------------------------------------------
# Copyright (c) 2012 - 2019, Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------
'''

'''

#-----------------------------------------------------------------------------
# Boilerplate
#-----------------------------------------------------------------------------
from __future__ import absolute_import, division, print_function, unicode_literals

import logging
log = logging.getLogger(__name__)

#-----------------------------------------------------------------------------
# Imports
#-----------------------------------------------------------------------------

# Standard library imports
from bokeh.util.future import collections_abc # goes away with py2

# External imports
from six import string_types

# Bokeh imports
from ..core.templates import AUTOLOAD_JS, AUTOLOAD_TAG, FILE, ROOT_DIV, MACROS
from ..document.document import DEFAULT_TITLE, Document
from ..model import Model
from ..util.compiler import bundle_all_models
from ..util.string import encode_utf8
from .bundle import bundle_for_objs_and_resources
from .elements import html_page_for_render_items, script_for_render_items
from .util import FromCurdoc, OutputDocumentFor, standalone_docs_json, standalone_docs_json_and_render_items
from .wrappers import wrap_in_onload, wrap_in_script_tag

#-----------------------------------------------------------------------------
# Globals and constants
#-----------------------------------------------------------------------------

__all__ = (
    'autoload_static',
    'components',
    'file_html',
    'json_item',
)

#-----------------------------------------------------------------------------
# General API
#-----------------------------------------------------------------------------

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

    if isinstance(model, Model):
        models = [model]
    elif isinstance (model, Document):
        models = model.roots
    else:
        raise ValueError("autoload_static expects a single Model or Document")

    with OutputDocumentFor(models):
        (docs_json, [render_item]) = standalone_docs_json_and_render_items([model])

    bundle = bundle_all_models() or ""
    script = script_for_render_items(docs_json, [render_item])

    (modelid, elementid) = list(render_item.roots.to_json().items())[0]

    js = wrap_in_onload(AUTOLOAD_JS.render(
        js_urls = resources.js_files,
        css_urls = resources.css_files,
        js_raw = resources.js_raw + [bundle, script],
        css_raw = resources.css_raw_str,
        elementid = elementid,
    ))

    tag = AUTOLOAD_TAG.render(
        src_path = script_path,
        elementid = elementid,
    )

    return encode_utf8(js), encode_utf8(tag)

def components(models, wrap_script=True, wrap_plot_info=True, theme=FromCurdoc):
    ''' Return HTML components to embed a Bokeh plot. The data for the plot is
    stored directly in the returned HTML.

    An example can be found in examples/embed/embed_multiple.py

    The returned components assume that BokehJS resources are **already loaded**.
    The html template in which they will be embedded needs to include the following
    scripts tags. The widgets and tables resources are only necessary if the components
    make use of widgets and tables.

    .. code-block:: html

        <script src="http://cdn.pydata.org/bokeh/release/bokeh-x.y.z.min.js"></script>
        <script src="http://cdn.pydata.org/bokeh/release/bokeh-widgets-x.y.z.min.js"></script>
        <script src="http://cdn.pydata.org/bokeh/release/bokeh-tables-x.y.z.min.js"></script>

    Note that in Jupyter Notebooks, it is not possible to use components and show in
    the same notebook cell.

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

    models = _check_models_or_docs(models)

    # now convert dict to list, saving keys in the same order
    model_keys = None
    dict_type = None
    if isinstance(models, dict):
        model_keys = models.keys()
        dict_type = models.__class__
        values = []
        # don't just use .values() to ensure we are in the same order as key list
        for k in model_keys:
            values.append(models[k])
        models = values

    # 2) Append models to one document. Either pre-existing or new and render
    with OutputDocumentFor(models, apply_theme=theme):
        (docs_json, [render_item]) = standalone_docs_json_and_render_items(models)

    script  = bundle_all_models() or ""
    script += script_for_render_items(docs_json, [render_item])
    if wrap_script:
        script = wrap_in_script_tag(script)
    script = encode_utf8(script)

    def div_for_root(root):
        return ROOT_DIV.render(root=root, macros=MACROS)

    if wrap_plot_info:
        results = list(div_for_root(root) for root in render_item.roots)
    else:
        results = render_item.roots

    # 3) convert back to the input shape

    if was_single_object:
        result = results[0]
    elif model_keys is not None:
        result = dict_type(zip(model_keys, results))
    else:
        result = tuple(results)

    return script, result

def file_html(models,
              resources,
              title=None,
              template=FILE,
              template_variables={},
              theme=FromCurdoc,
              suppress_callback_warning=False,
              _always_new=False):
    ''' Return an HTML document that embeds Bokeh Model or Document objects.

    The data for the plot is stored directly in the returned HTML, with
    support for customizing the JS/CSS resources independently and
    customizing the jinja2 template.

    Args:
        models (Model or Document or seq[Model]) : Bokeh object or objects to render
            typically a Model or Document

        resources (Resources or tuple(JSResources or None, CSSResources or None)) :
            A resource configuration for Bokeh JS & CSS assets.

        title (str, optional) :
            A title for the HTML document ``<title>`` tags or None. (default: None)

            If None, attempt to automatically find the Document title from the given
            plot objects.

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

        suppress_callback_warning (bool, optional) :
            Normally generating standalone HTML from a Bokeh Document that has
            Python callbacks will result in a warning stating that the callbacks
            cannot function. However, this warning can be suppressed by setting
            this value to True (default: False)

    Returns:
        UTF-8 encoded HTML

    '''
    if isinstance(models, Model):
        models = [models]

    if isinstance(models, Document):
        models = models.roots

    with OutputDocumentFor(models, apply_theme=theme, always_new=_always_new) as doc:
        (docs_json, render_items) = standalone_docs_json_and_render_items(models, suppress_callback_warning=suppress_callback_warning)
        title = _title_from_models(models, title)
        bundle = bundle_for_objs_and_resources([doc], resources)
        return html_page_for_render_items(bundle, docs_json, render_items, title=title,
                                          template=template, template_variables=template_variables)

def json_item(model, target=None, theme=FromCurdoc):
    ''' Return a JSON block that can be used to embed standalone Bokeh content.

    Args:
        model (Model) :
            The Bokeh object to embed

        target (string, optional)
            A div id to embed the model into. If None, the target id must
            be supplied in the JavaScript call.

        theme (Theme, optional) :
            Defaults to the ``Theme`` instance in the current document.
            Setting this to ``None`` uses the default theme or the theme
            already specified in the document. Any other value must be an
            instance of the ``Theme`` class.

    Returns:
        JSON-like

    This function returns a JSON block that can be consumed by the BokehJS
    function ``Bokeh.embed.embed_item``. As an example, a Flask endpoint for
    ``/plot`` might return the following content to embed a Bokeh plot into
    a div with id *"myplot"*:

    .. code-block:: python

        @app.route('/plot')
        def plot():
            p = make_plot('petal_width', 'petal_length')
            return json.dumps(json_item(p, "myplot"))

    Then a web page can retrieve this JSON and embed the plot by calling
    ``Bokeh.embed.embed_item``:

    .. code-block:: html

        <script>
        fetch('/plot')
            .then(function(response) { return response.json(); })
            .then(function(item) { Bokeh.embed.embed_item(item); })
        </script>

    Alternatively, if is more convenient to supply the target div id directly
    in the page source, that is also possible. If `target_id` is omitted in the
    call to this function:

    .. code-block:: python

        return json.dumps(json_item(p))

    Then the value passed to ``embed_item`` is used:

    .. code-block:: javascript

        Bokeh.embed.embed_item(item, "myplot");

    '''
    with OutputDocumentFor([model], apply_theme=theme) as doc:
        doc.title = ""
        docs_json = standalone_docs_json([model])

    doc = list(docs_json.values())[0]
    root_id = doc['roots']['root_ids'][0]

    return {
        'target_id' : target,
        'root_id'   : root_id,
        'doc'       : doc,
    }


#-----------------------------------------------------------------------------
# Dev API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Private API
#-----------------------------------------------------------------------------

def _check_models_or_docs(models):
    '''

    '''
    input_type_valid = False

    # Check for single item
    if isinstance(models, (Model, Document)):
        models = [models]

    # Check for sequence
    if isinstance(models, collections_abc.Sequence) and all(isinstance(x, (Model, Document)) for x in models):
        input_type_valid = True

    if isinstance(models, dict) and \
        all(isinstance(x, string_types) for x in models.keys()) and \
        all(isinstance(x, (Model, Document)) for x in models.values()):
        input_type_valid = True

    if not input_type_valid:
        raise ValueError(
            'Input must be a Model, a Document, a Sequence of Models and Document, or a dictionary from string to Model and Document'
        )

    return models

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

#-----------------------------------------------------------------------------
# Code
#-----------------------------------------------------------------------------
