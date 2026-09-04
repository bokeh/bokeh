#-----------------------------------------------------------------------------
# Copyright (c) Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------
'''

'''

#-----------------------------------------------------------------------------
# Boilerplate
#-----------------------------------------------------------------------------
from __future__ import annotations

# pyright: reportArgumentType=false, reportOverlappingOverload=false

import logging # isort:skip
log = logging.getLogger(__name__)

#-----------------------------------------------------------------------------
# Imports
#-----------------------------------------------------------------------------

# Standard library imports
from typing import (
    TYPE_CHECKING,
    Any,
    Literal,
    Sequence,
    cast,
)

# Bokeh imports
from ..core.templates import FILE
from ..document.document import Document
from ..model import Model
from ..resources import Resources
from .util import ThemeSource

if TYPE_CHECKING:
    from jinja2 import Template

#-----------------------------------------------------------------------------
# Globals and constants
#-----------------------------------------------------------------------------

__all__ = (
    'EmbedMigrationError',
    'autoload_static',
    'components',
    'file_html',
)

#-----------------------------------------------------------------------------
# General API
#-----------------------------------------------------------------------------

class EmbedMigrationError(RuntimeError):
    """An actionable Bokeh 4.0 migration error for a removed embed contract."""

def autoload_static(model: Model | Document, resources: Resources | str, script_path: str) -> tuple[str, str]:
    """Raise with the Bokeh 4.0 external-artifact migration route."""
    raise EmbedMigrationError(
        "autoload_static() was removed in Bokeh 4.0. Use embed(model).external(payload_url=script_path) "
        "and save artifact.to_json_string() as the payload instead of generating a per-embed loader program.",
    )

def components(models: Model | Document | Sequence[Model | Document] | dict[str, Model | Document],
        *, theme: ThemeSource = None) -> tuple[str, Any]:
    ''' Return HTML components to embed a Bokeh plot. The data for the plot is
    stored directly in the returned HTML.

    An example can be found in examples/embed/embed_multiple.py

    The returned components assume that BokehJS resources are **already loaded**.
    The HTML document or template in which they will be embedded needs to
    include scripts tags, either from a local URL or Bokeh's CDN (replacing
    ``x.y.z`` with the version of Bokeh you are using):

    .. code-block:: html

        <script src="https://cdn.bokeh.org/bokeh/release/bokeh-x.y.z.min.js"></script>
        <script src="https://cdn.bokeh.org/bokeh/release/bokeh-widgets-x.y.z.min.js"></script>
        <script src="https://cdn.bokeh.org/bokeh/release/bokeh-tables-x.y.z.min.js"></script>
        <script src="https://cdn.bokeh.org/bokeh/release/bokeh-gl-x.y.z.min.js"></script>
        <script src="https://cdn.bokeh.org/bokeh/release/bokeh-mathjax-x.y.z.min.js"></script>
        <script src="https://cdn.bokeh.org/bokeh/release/bokeh-api-x.y.z.min.js"></script>

    Only the Bokeh core library ``bokeh-x.y.z.min.js`` is always required. The
    other scripts are optional and only need to be included if you want to use
    corresponding features:

    * The ``"bokeh-widgets"`` files are only necessary if you are using any of the
      :ref:`Bokeh widgets <ug_interaction_widgets>`.
    * The ``"bokeh-tables"`` files are only necessary if you are using Bokeh's
      :ref:`data tables <ug_interaction_widgets_examples_datatable>`.
    * The ``"bokeh-api"`` files are required to use the
      :ref:`BokehJS API <ug_advanced_bokehjs>` and must be loaded *after* the
      core BokehJS library.
    * The ``"bokeh-gl"`` files are required to enable
      :ref:`WebGL support <ug_output_webgl>`.
    * the ``"bokeh-mathjax"`` files are required to enable
      :ref:`MathJax support <ug_styling_mathtext>`.

    Args:
        models (Model|list|dict|tuple) :
            A single Model, a list/tuple of Models, or a dictionary of keys
            and Models.

        theme (Theme, optional) :
            Applies the specified theme when creating the components. If None,
            or not specified, and the supplied models constitute the full set
            of roots of a document, applies the theme of that document to the
            components. Otherwise applies the default theme.

    Returns:
        UTF-8 encoded ``(script, div[s])`` using logical artifact roots.

    Examples:

        With default wrapping parameter values:

        .. code-block:: python

            components(plot)
            # => (script, plot_div)

            components((plot1, plot2))
            # => (script, (plot1_div, plot2_div))

            components({"Plot 1": plot1, "Plot 2": plot2})
            # => (script, {"Plot 1": plot1_div, "Plot 2": plot2_div})

    '''
    from .compiler import embed

    artifact = embed(models, theme=theme)
    if artifact.requires.extensions:
        raise ValueError(
            "components() cannot express custom extension resource ownership in its legacy tuple. "
            "Use embed(models).fragment(resources=...) and choose an explicit resource policy.",
        )
    fragment = artifact.fragment(resources="none")
    divs = fragment.divs
    input_shape = artifact.metadata["compiler"]["input_shape"]
    if input_shape == "single":
        result: Any = next(iter(divs.values()))
    elif input_shape == "mapping":
        assert isinstance(models, dict)
        result = cast(Any, models).__class__((key, divs[key]) for key in models)
    else:
        result = tuple(divs.values())
    return fragment.script, result

def file_html(
    models: Model | Document | Sequence[Model],
    resources: Resources | str | None = None,
    title: str | None = None,
    *,
    template: Template | str = FILE,
    template_variables: dict[str, Any] | None = None,
    theme: ThemeSource = None,
    suppress_callback_warning: bool = False,
) -> str:
    ''' Return an HTML document that embeds Bokeh Model or Document objects.

    The data for the plot is stored directly in the returned HTML, with
    support for customizing the JS/CSS resources independently and
    customizing the jinja2 template.

    Args:
        models (Model or Document or seq[Model]) : Bokeh object or objects to render
            typically a Model or Document

        resources (Resources or str) :
            A resource policy for Bokeh JS & CSS assets.

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
    from .compiler import embed

    callback_policy: Literal["suppress", "warn"] = "suppress" if suppress_callback_warning else "warn"
    artifact = embed(models, theme=theme, callback_policy=callback_policy)
    return artifact.page(
        resources=resources,
        title=title,
        template=template,
        template_variables=template_variables,
    )
