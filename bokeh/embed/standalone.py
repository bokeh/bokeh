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
from typing import Any, Dict, Optional, Sequence, Tuple, Type, Union, cast

# External imports
from jinja2 import Template

# Bokeh imports
from ..core.templates import AUTOLOAD_JS, AUTOLOAD_TAG, FILE, MACROS, ROOT_DIV
from ..document.document import DEFAULT_TITLE, Document
from ..model import Model
from ..resources import CSSResources, JSResources, Resources
from ..themes import Theme
from .bundle import Script, bundle_for_objs_and_resources
from .elements import html_page_for_render_items, script_for_render_items
from .util import (
    FromCurdoc,
    OutputDocumentFor,
    RenderRoot,
    standalone_docs_json,
    standalone_docs_json_and_render_items,
)
from .wrappers import wrap_in_onload

#-----------------------------------------------------------------------------
# Globals and constants
#-----------------------------------------------------------------------------

__all__ = (
    'autoload_static',
    'components',
    'file_html',
    'json_item',
)

ModelLike = Union[Model, Document]
ModelLikeCollection = Union[Sequence[ModelLike], Dict[str, ModelLike]]

#-----------------------------------------------------------------------------
# General API
#-----------------------------------------------------------------------------

ThemeLike = Union[None, Theme, Type[FromCurdoc]]

def autoload_static(model: Union[Model, Document], resources: Resources, script_path: str) -> Tuple[str, str]:
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

    bundle = bundle_for_objs_and_resources(None, resources)
    bundle.add(Script(script_for_render_items(docs_json, [render_item])))

    (_, elementid) = list(render_item.roots.to_json().items())[0]

    js = wrap_in_onload(AUTOLOAD_JS.render(bundle=bundle, elementid=elementid))

    tag = AUTOLOAD_TAG.render(
        src_path = script_path,
        elementid = elementid,
    )

    return js, tag

def components(models: Union[ModelLike, ModelLikeCollection], wrap_script: bool = True,
               wrap_plot_info: bool = True, theme: ThemeLike = None) -> Tuple[str, Any]:
    ''' Return HTML components to embed a Bokeh plot. The data for the plot is
    stored directly in the returned HTML.

    An example can be found in examples/embed/embed_multiple.py

    The returned components assume that BokehJS resources are **already loaded**.
    The html template in which they will be embedded needs to include the following
    scripts tags. The widgets and tables resources are only necessary if the components
    make use of widgets and tables.

    .. code-block:: html

        <script src="https://cdn.bokeh.org/bokeh/release/bokeh-x.y.z.min.js"></script>
        <script src="https://cdn.bokeh.org/bokeh/release/bokeh-widgets-x.y.z.min.js"></script>
        <script src="https://cdn.bokeh.org/bokeh/release/bokeh-tables-x.y.z.min.js"></script>

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
            Applies the specified theme when creating the components. If None,
            or not specified, and the supplied models constitute the full set of
            roots of a document, applies the theme of that document to the components.
            Otherwise applies the default theme.

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
    dict_type: Type[Dict[Any, Any]] = dict
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

    bundle = bundle_for_objs_and_resources(None, None)
    bundle.add(Script(script_for_render_items(docs_json, [render_item])))

    script = bundle.scripts(tag=wrap_script)

    def div_for_root(root: RenderRoot) -> str:
        return ROOT_DIV.render(root=root, macros=MACROS)

    if wrap_plot_info:
        results = list(div_for_root(root) for root in render_item.roots)
    else:
        results = render_item.roots

    # 3) convert back to the input shape
    result: Any
    if was_single_object:
        result = results[0]
    elif model_keys is not None:
        result = dict_type(zip(model_keys, results))
    else:
        result = tuple(results)

    return script, result

def file_html(models: Union[Model, Document, Sequence[Model]],
              resources: Union[Resources, Tuple[JSResources, CSSResources]],
              title: Optional[str] = None,
              template: Union[Template, str] = FILE,
              template_variables: Dict[str, Any] = {},
              theme: ThemeLike = None,
              suppress_callback_warning: bool = False,
              _always_new: bool = False) -> str:
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
            Applies the specified theme to the created html. If ``None``, or
            not specified, and the function is passed a document or the full set
            of roots of a document, applies the theme of that document.  Otherwise
            applies the default theme.

        suppress_callback_warning (bool, optional) :
            Normally generating standalone HTML from a Bokeh Document that has
            Python callbacks will result in a warning stating that the callbacks
            cannot function. However, this warning can be suppressed by setting
            this value to True (default: False)

    Returns:
        UTF-8 encoded HTML

    '''

    models_seq: Sequence[Model] = []
    if isinstance(models, Model):
        models_seq = [models]
    elif isinstance(models, Document):
        models_seq = models.roots
    else:
        models_seq = models

    with OutputDocumentFor(models_seq, apply_theme=theme, always_new=_always_new) as doc:
        (docs_json, render_items) = standalone_docs_json_and_render_items(models_seq, suppress_callback_warning=suppress_callback_warning)
        title = _title_from_models(models_seq, title)
        bundle = bundle_for_objs_and_resources([doc], resources)
        return html_page_for_render_items(bundle, docs_json, render_items, title=title,
                                          template=template, template_variables=template_variables)

def json_item(model: Model, target: Optional[str] = None, theme: ThemeLike = None) -> Any: # TODO: TypedDict?
    ''' Return a JSON block that can be used to embed standalone Bokeh content.

    Args:
        model (Model) :
            The Bokeh object to embed

        target (string, optional)
            A div id to embed the model into. If None, the target id must
            be supplied in the JavaScript call.

        theme (Theme, optional) :
            Applies the specified theme to the created html. If ``None``, or
            not specified, and the function is passed a document or the full set
            of roots of a document, applies the theme of that document.  Otherwise
            applies the default theme.

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

def _check_models_or_docs(models: Union[ModelLike, ModelLikeCollection]) -> ModelLikeCollection:
    '''

    '''
    input_type_valid = False

    # Check for single item
    if isinstance(models, (Model, Document)):
        models = [models]

    # Check for sequence
    if isinstance(models, Sequence) and all(isinstance(x, (Model, Document)) for x in models):
        input_type_valid = True

    if isinstance(models, dict) and \
        all(isinstance(x, str) for x in models.keys()) and \
        all(isinstance(x, (Model, Document)) for x in models.values()):
        input_type_valid = True

    if not input_type_valid:
        raise ValueError(
            'Input must be a Model, a Document, a Sequence of Models and Document, or a dictionary from string to Model and Document'
        )

    return models

def _title_from_models(models: Sequence[Union[Model, Document]], title: Optional[str]) -> str:
    # use override title
    if title is not None:
        return title

    # use title from any listed document
    for p in models:
        if isinstance(p, Document):
            return p.title

    # use title from any model's document
    for p in cast(Sequence[Model], models):
        if p.document is not None:
            return p.document.title

    # use default title
    return DEFAULT_TITLE

#-----------------------------------------------------------------------------
# Code
#-----------------------------------------------------------------------------
