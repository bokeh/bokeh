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
from .notebook import show_doc
from .saving import save
from .state import curstate

if TYPE_CHECKING:
    from ..application.application import Application
    from ..embed.resources import ResourcePolicy
    from ..model import Model
    from ..resources import Resources
    from ..util.browser import BrowserLike
    from .jupyter_app import NotebookApplication
    from .notebook import ApplicationViewHandle, DocumentViewHandle

    type _ShowDocable = Model | Sequence[UIElement]
    from .state import State

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
    resources: ResourcePolicy | Resources | None = None,
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

        resources (Resources or ResourcePolicy, optional) :
            Select explicit BokehJS resource delivery for notebook output,
            including inline/offline, CDN, server, host-owned, and CSP-aware
            policies. Resolved assets are stored once per kernel and shared by
            subsequent outputs using the same exact configuration.

    Additional keyword arguments are not accepted.

    Returns:
        In a Jupyter notebook, returns a connected view handle. Standalone
        objects synchronize Python property changes automatically, while a
        managed application creates an independent ASGI session. Returns None
        for file or browser output outside a notebook.

    '''
    from ..models.dom import DOMNode
    from ..models.ui import UIElement

    state = curstate()

    from .jupyter_app import NotebookApplication
    from .notebook import notebook_environment

    if isinstance(obj, NotebookApplication):
        if not notebook_environment():
            raise RuntimeError("show(serve(...)) requires an interactive notebook kernel")
        if kwargs:
            names = ", ".join(sorted(kwargs))
            raise ValueError(
                f"Unexpected show() options for a managed notebook application: {names}. "
                "Configure ASGI server options on serve(...).",
            )
        from .notebook import show_hosted_app
        return show_hosted_app(obj, state, resources)

    if isinstance(obj, UIElement) or isinstance(obj, DOMNode) or isinstance(obj, Sequence):
        if kwargs:
            names = ", ".join(sorted(kwargs))
            raise ValueError(f"Unexpected show() options for a standalone object: {names}")
        notebook_options: dict[str, Any] = {}
        if resources is not None:
            notebook_options["resources"] = resources
        return _show_with_state(obj, state, **notebook_options)

    def is_application(obj: Any) -> TypeGuard[Application]:
        return getattr(obj, '_is_a_bokeh_application_class', False)

    if is_application(obj) or callable(obj): # TODO (bev) check callable signature more thoroughly
        raise RuntimeError(
            "Bokeh 4.0 no longer starts an application from show(...). "
            "Use app = serve(..., notebook_url=...), then show(app) in an interactive notebook.",
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

def _show_file_with_state(obj: Showable, state: State, controller: BrowserLike) -> None:
    '''

    '''
    filename = save(obj, state=state)
    controller.open("file://" + filename, new=2)

def _show_with_state(obj: Showable, state: State,
        resources: ResourcePolicy | Resources | None = None) -> DocumentViewHandle | None:
    '''

    '''
    from .notebook import notebook_environment

    if notebook_environment():
        notebook_options: dict[str, Any] = {}
        if resources is not None:
            notebook_options["resources"] = resources
        return show_doc(cast("_ShowDocable", obj), state, **notebook_options)

    controller = get_browser_controller()
    _show_file_with_state(obj, state, controller)
    return None

#-----------------------------------------------------------------------------
# Code
#-----------------------------------------------------------------------------
