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
#-----------------------------------------------------------------------------
from __future__ import absolute_import, division, print_function, unicode_literals

import logging
log = logging.getLogger(__name__)

from bokeh.util.api import general, dev ; general, dev

#-----------------------------------------------------------------------------
# Imports
#-----------------------------------------------------------------------------

# Standard library imports
from contextlib import contextmanager
import re

# External imports

# Bokeh imports
from ..core.templates import AUTOLOAD_JS, AUTOLOAD_TAG, FILE
from ..document.document import DEFAULT_TITLE, Document
from ..model import Model
from ..settings import settings
from ..util.compiler import bundle_all_models
from ..util.string import encode_utf8
from .bundle import bundle_for_objs_and_resources
from .util import FromCurdoc
from .util import (check_models_or_docs, check_one_model_or_doc, div_for_render_item, find_existing_docs, html_page_for_render_items,
                   script_for_render_items, standalone_docs_json_and_render_items, wrap_in_onload, wrap_in_script_tag)

#-----------------------------------------------------------------------------
# Globals and constants
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# General API
#-----------------------------------------------------------------------------

@general((1,0,0))
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

    model = check_one_model_or_doc(model)

    with _ModelInDocument([model]):
        (docs_json, render_items) = standalone_docs_json_and_render_items([model])

    bundle = bundle_all_models()
    script = script_for_render_items(docs_json, render_items)
    item = render_items[0]

    js = wrap_in_onload(AUTOLOAD_JS.render(
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

@general((1,0,0))
def components(models, wrap_script=True, wrap_plot_info=True, theme=FromCurdoc):
    ''' Return HTML components to embed a Bokeh plot. The data for the plot is
    stored directly in the returned HTML.

    An example can be found in examples/embed/embed_multiple.py

    The returned components assume that BokehJS resources are **already loaded**.
    The html template in which they will be embedded needs to include the following
    links and scripts tags. The widgets and tables resources are only necessary if
    the components make use of widgets and tables.

    .. code-block:: html

        <link
            href="http://cdn.pydata.org/bokeh/release/bokeh-x.y.z.min.css"
            rel="stylesheet" type="text/css">
        <link
            href="http://cdn.pydata.org/bokeh/release/bokeh-widgets-x.y.z.min.css"
            rel="stylesheet" type="text/css">
        <link
            href="http://cdn.pydata.org/bokeh/release/bokeh-tables-x.y.z.min.css"
            rel="stylesheet" type="text/css">

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
    # converts single to list
    models = check_models_or_docs(models, allow_dict=True)
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
        (docs_json, render_items) = standalone_docs_json_and_render_items(models)

    script  = bundle_all_models()
    script += script_for_render_items(docs_json, render_items)
    if wrap_script:
        script = wrap_in_script_tag(script)
    script = encode_utf8(script)

    if wrap_plot_info:
        results = list(div_for_render_item(item) for item in render_items)
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

@general((1,0,0))
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

        resources (Resources or tuple(JSResources or None, CSSResources or None)) : i
            A resource configuration for Bokeh JS & CSS assets.

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
    models = check_models_or_docs(models)

    with _ModelInDocument(models, apply_theme=theme):
        (docs_json, render_items) = standalone_docs_json_and_render_items(models)
        title = _title_from_models(models, title)
        bundle = bundle_for_objs_and_resources(models, resources)
        return html_page_for_render_items(bundle, docs_json, render_items, title=title,
                                           template=template, template_variables=template_variables)

#-----------------------------------------------------------------------------
# Dev API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Private API
#-----------------------------------------------------------------------------

@contextmanager
def _ModelInDocument(models, apply_theme=None):
    doc = find_existing_docs(models)
    old_theme = doc.theme

    if apply_theme is FromCurdoc:
        from ..io import curdoc; curdoc
        doc.theme = curdoc().theme
    elif apply_theme is not None:
        doc.theme = apply_theme

    models_to_dedoc = _add_doc_to_models(doc, models)

    if settings.perform_document_validation():
        doc.validate()

    yield doc

    for model in models_to_dedoc:
        doc.remove_root(model, apply_theme)
    doc.theme = old_theme

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
