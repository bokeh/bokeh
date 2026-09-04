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

import logging # isort:skip
log = logging.getLogger(__name__)

#-----------------------------------------------------------------------------
# Imports
#-----------------------------------------------------------------------------

# Standard library imports
from typing import (
    TYPE_CHECKING,
    Any,
    Callable,
    Sequence,
    TypeGuard,
    cast,
)

# Bokeh imports
from ..models.dom import DOMNode
from ..models.ui import UIElement
from ..util.browser import get_browser_controller
from .notebook import notebook_environment, show_doc
from .saving import save
from .util import temp_filename

if TYPE_CHECKING:
    from jinja2 import Template

    from ..application.application import Application
    from ..core.types import PathLike
    from ..model import Model
    from ..resources import Resources
    from .jupyter_app import NotebookApplication
    from .notebook import ApplicationViewHandle, DocumentViewHandle

#-----------------------------------------------------------------------------
# Globals and constants
#-----------------------------------------------------------------------------

__all__ = (
    'show',
    "Showable",
)

#-----------------------------------------------------------------------------
# General API
#-----------------------------------------------------------------------------

type OneOrMore[T] = T | Sequence[T]
type Showable = OneOrMore[UIElement | DOMNode]

def show(
    obj: Showable | NotebookApplication | Application | Callable[..., Any],
    *,
    filename: PathLike | None = None,
    resources: Resources | str | None = None,
    title: str | None = None,
    template: Template | str | None = None,
    **kwargs: Any,
) -> ApplicationViewHandle | DocumentViewHandle | None:
    '''Immediately display a Bokeh object or application.

    :func:`show` may be called multiple times in a single Jupyter notebook
    cell to display multiple objects. The objects are displayed in order.

    Args:
        obj (UIElement or UIElement[] or DOMNode or DOMNode[] or NotebookApplication) :
            A Bokeh object to display.

            Bokeh plots, widgets, layouts (i.e. rows and columns) may be
            passed to ``show`` in order to display them. Outside an interactive
            notebook kernel, the output is saved to an HTML file and opened in
            the default browser. In a notebook, Bokeh displays the output inline;
            use :func:`~bokeh.io.save` explicitly to create an external HTML file.

            In a Jupyter notebook, a managed application returned by
            :func:`~bokeh.io.serve` may be passed in any later cell. Direct
            Application and callable arguments are rejected with a
            migration message; start them explicitly with ``serve()``.

        filename (PathLike, optional) :
            HTML filename to save and open. If omitted outside notebook mode,
            a temporary ``.html`` file is used.

        resources (Resources or str, optional) :
            Select explicit BokehJS resource delivery for file or notebook
            output. Notebook assets are stored once per kernel and shared by
            subsequent outputs using the same exact configuration.

        title (str, optional) :
            HTML document title for file output.

        template (Template or str, optional) :
            HTML document template for file output.

    Additional keyword arguments are not accepted.

    Returns:
        In a Jupyter notebook, returns a connected view handle. Standalone
        objects synchronize Python property changes automatically, while a
        managed application creates an independent ASGI session. Returns None
        for file or browser output outside a notebook.

    '''
    from ..models.dom import DOMNode
    from ..models.ui import UIElement
    from .jupyter_app import NotebookApplication

    if isinstance(obj, NotebookApplication):
        if not notebook_environment():
            raise RuntimeError("show(serve(...)) requires an interactive notebook kernel")
        if filename is not None or title is not None or template is not None:
            raise ValueError("file output options are not supported when showing a managed notebook application")
        if kwargs:
            names = ", ".join(sorted(kwargs))
            raise ValueError(
                f"Unexpected show() options for a managed notebook application: {names}. "
                "Configure ASGI server options on serve(...).",
            )
        from .notebook import show_hosted_app
        return show_hosted_app(obj, resources)

    if isinstance(obj, UIElement) or isinstance(obj, DOMNode) or isinstance(obj, Sequence):
        if kwargs:
            names = ", ".join(sorted(kwargs))
            raise ValueError(f"Unexpected show() options for a standalone object: {names}")
        if notebook_environment() and filename is None:
            if title is not None or template is not None:
                raise ValueError("filename is required when passing file output options in notebook mode")
            return show_doc(cast("Model | Sequence[UIElement]", obj), resources=resources)
        _show_file(
            obj,
            filename=filename if filename is not None else temp_filename("html"),
            resources=resources,
            title=title,
            template=template,
        )
        return None

    def is_application(obj: Any) -> TypeGuard[Application]:
        return getattr(obj, '_is_a_bokeh_application_class', False)

    if is_application(obj) or callable(obj): # TODO (bev) check callable signature more thoroughly
        raise RuntimeError(
            "Bokeh 4.0 no longer starts an application from show(...). "
            "Use app = serve(...), then show(app) in an interactive notebook.",
        )

    raise ValueError(_BAD_SHOW_MSG)

#-----------------------------------------------------------------------------
# Dev API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Private API
#-----------------------------------------------------------------------------

_BAD_SHOW_MSG = """Invalid object to show. The object passed to show must be one of:

* a UIElement (e.g. a plot, figure, widget or layout)
* a DOMNode (e.g. a Div)
* a managed notebook application returned by bokeh.io.serve
"""

def _show_file(obj: Showable, *, filename: PathLike, resources: Resources | str | None,
        title: str | None, template: Template | str | None) -> None:
    '''

    '''
    controller = get_browser_controller()
    saved = save(obj, filename=filename, resources=resources, title=title, template=template)
    from pathlib import Path
    controller.open(Path(saved).as_uri(), new=2)

#-----------------------------------------------------------------------------
# Code
#-----------------------------------------------------------------------------
