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
    Sequence,
    TypeGuard,
)

# Bokeh imports
from ..models.dom import DOMNode
from ..models.ui import UIElement
from ..util.browser import get_browser_controller
from .notebook import DEFAULT_JUPYTER_URL, _notebook_type, run_notebook_hook
from .saving import save
from .util import temp_filename

if TYPE_CHECKING:
    from jinja2 import Template

    from ..application.application import Application
    from ..application.handlers.function import ModifyDoc
    from ..core.types import PathLike
    from ..resources import Resources
    from .notebook import CommsHandle, ProxyUrlFunc

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
    obj: Showable | Application | ModifyDoc,
    notebook_handle: bool = False,
    notebook_url: str | ProxyUrlFunc = DEFAULT_JUPYTER_URL,
    *,
    filename: PathLike | None = None,
    resources: Resources | str | None = None,
    title: str | None = None,
    template: Template | str | None = None,
    **kwargs: Any,
) -> CommsHandle | None:
    '''Immediately display a Bokeh object or application.

    :func:`show` may be called multiple times in a single Jupyter notebook
    cell to display multiple objects. The objects are displayed in order.

    Args:
        obj (UIElement or UIElement[] or DOMNode or DOMNode[] or Application or callable) :
            A Bokeh object to display.

            Bokeh plots, widgets, layouts (i.e. rows and columns) may be
            passed to ``show`` in order to display them. Outside a notebook,
            the output is saved to an HTML file and opened in a new browser
            window or tab. If no filename is supplied, a temporary file is
            used. If |output_notebook| has been called in a Jupyter notebook,
            output without an explicit filename is displayed inline.

        filename (PathLike, optional) :
            HTML filename to save and open. If omitted outside notebook mode,
            a temporary ``.html`` file is used.

        resources (Resources or str, optional) :
            Resource policy passed to :func:`~bokeh.io.save`.

        title (str, optional) :
            HTML document title passed to :func:`~bokeh.io.save`.

        template (Template or str, optional) :
            HTML document template passed to :func:`~bokeh.io.save`.

        notebook_handle (bool, optional) :
            Whether to create a notebook interaction handle (default: False)

            For notebook output, toggles whether a handle which can be used
            with ``push_notebook`` is returned. Note that notebook handles
            only apply to standalone plots, layouts, etc. They do not apply
            when showing Applications in the notebook.

        notebook_url (URL, optional) :
            Location of the Jupyter notebook page (default: "localhost:8888")

            When showing Bokeh applications, the Bokeh server must be
            explicitly configured to allow connections originating from
            different URLs. This parameter defaults to the standard notebook
            host and port. If you are running on a different location, you
            will need to supply this value for the application to display
            properly. If no protocol is supplied in the URL, e.g. if it is
            of the form "localhost:8888", then "http" will be used.

            ``notebook_url`` can also be a function that takes one int for the
            bound server port.  If the port is provided, the function needs
            to generate the full public URL to the bokeh server.  If None
            is passed, the function is to generate the origin URL.

            If the environment variable JUPYTER_BOKEH_EXTERNAL_URL is set
            to the external URL of a JupyterHub, notebook_url is overridden
            with a callable which enables Bokeh to traverse the JupyterHub
            proxy without specifying this parameter.

            In a Jupyter notebook, a Bokeh application or callable may also
            be passed to ``show``. A callable will be turned into an
            Application using a ``FunctionHandler``. The application will be
            run and displayed inline in the associated notebook output cell.

    Some parameters are only useful when certain output modes are active:

    * The ``notebook_handle`` parameter only applies when |output_notebook|
      is active, and non-Application objects are being shown. It is only
      supported in Jupyter notebook and raises an exception for other notebook
      types when it is True.

    * The ``notebook_url`` parameter only applies when showing Bokeh
      Applications in a Jupyter notebook.

    * Any additional keyword arguments are passed to :class:`~bokeh.server.Server` when
      showing a Bokeh app (added in version 1.1)

    Returns:
        When in a Jupyter notebook (with |output_notebook| enabled)
        and ``notebook_handle=True``, returns a handle that can be used by
        ``push_notebook``, None otherwise.

    '''
    from ..models.dom import DOMNode
    from ..models.ui import UIElement

    notebook_type = _notebook_type()

    if isinstance(obj, UIElement) or isinstance(obj, DOMNode) or isinstance(obj, Sequence):
        if kwargs:
            names = ", ".join(sorted(kwargs))
            raise ValueError(f"Unexpected show() options for a standalone object: {names}")
        if notebook_type is not None and filename is None:
            if resources is not None or title is not None or template is not None:
                raise ValueError("filename is required when passing file output options in notebook mode")
            return run_notebook_hook(notebook_type, 'doc', obj, notebook_handle)
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
        # This ugliness is to prevent importing bokeh.application (which would bring
        # in Tornado) just in order to show a non-server object
        if filename is not None or resources is not None or title is not None or template is not None:
            raise ValueError("file output options are not supported when showing a Bokeh application")
        if notebook_type is None:
            raise RuntimeError("Bokeh applications can only be shown after output_notebook() is called")
        return run_notebook_hook(notebook_type, 'app', obj, notebook_url, **kwargs)

    raise ValueError(_BAD_SHOW_MSG)

#-----------------------------------------------------------------------------
# Dev API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Private API
#-----------------------------------------------------------------------------

_BAD_SHOW_MSG = """Invalid object to show. The object to passed to show must be one of:

* a UIElement (e.g. a plot, figure, widget or layout)
* a DOMNode (e.g. a Div)
* a Bokeh Application
* a callable suitable to an application FunctionHandler
"""

def _show_file(obj: Showable, *, filename: PathLike, resources: Resources | str | None,
        title: str | None, template: Template | str | None) -> None:
    '''

    '''
    saved = save(obj, filename=filename, resources=resources, title=title, template=template)
    from pathlib import Path
    get_browser_controller().open(Path(saved).resolve().as_uri(), new=2)

#-----------------------------------------------------------------------------
# Code
#-----------------------------------------------------------------------------
