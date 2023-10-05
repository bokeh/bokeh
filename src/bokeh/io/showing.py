#-----------------------------------------------------------------------------
# Copyright (c) 2012 - 2023, Anaconda, Inc., and Bokeh Contributors.
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
from typing import TYPE_CHECKING, Any

# Bokeh imports
from ..models.ui import UIElement
from ..util.browser import NEW_PARAM, get_browser_controller
from .notebook import DEFAULT_JUPYTER_URL, ProxyUrlFunc, run_notebook_hook
from .saving import save
from .state import curstate

if TYPE_CHECKING:
    from typing_extensions import TypeGuard

    from ..application.application import Application
    from ..application.handlers.function import ModifyDoc
    from ..util.browser import BrowserLike, BrowserTarget
    from .notebook import CommsHandle
    from .state import State

#-----------------------------------------------------------------------------
# Globals and constants
#-----------------------------------------------------------------------------

__all__ = (
    'show',
)

#-----------------------------------------------------------------------------
# General API
#-----------------------------------------------------------------------------

def show(obj: UIElement | Application | ModifyDoc, browser: str | None = None, new: BrowserTarget = "tab",
         notebook_handle: bool = False, notebook_url: str | ProxyUrlFunc = DEFAULT_JUPYTER_URL,
         **kwargs: Any) -> CommsHandle | None:
    '''Immediately display a Bokeh object or application.

    :func:`show` may be called multiple times in a single Jupyter notebook
    cell to display multiple objects. The objects are displayed in order.

    Args:
        obj (UIElement or Application or callable) :
            A Bokeh object to display.

            Bokeh plots, widgets, layouts (i.e. rows and columns) may be
            passed to ``show`` in order to display them. If |output_file|
            has been called, the output will be saved to an HTML file, which is also
            opened in a new browser window or tab. If |output_notebook|
            has been called in a Jupyter notebook, the output will be inline
            in the associated notebook output cell.

            In a Jupyter notebook, a Bokeh application or callable may also
            be passed. A callable will be turned into an Application using a
            ``FunctionHandler``. The application will be run and displayed
            inline in the associated notebook output cell.

        browser (str, optional) :
            Specify the browser to use to open output files(default: None)

            For file output, the **browser** argument allows for specifying
            which browser to display in, e.g. "safari", "firefox", "opera",
            "windows-default". Not all platforms may support this option, see
            the documentation for the standard library
            :doc:`webbrowser <python:library/webbrowser>` module for
            more information

        new (str, optional) :
            Specify the browser mode to use for output files (default: "tab")

            For file output, opens or raises the browser window showing the
            current output file.  If **new** is 'tab', then opens a new tab.
            If **new** is 'window', then opens a new window.

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

    Some parameters are only useful when certain output modes are active:

    * The ``browser`` and ``new`` parameters only apply when |output_file|
      is active.

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
    state = curstate()

    if isinstance(obj, UIElement):
        return _show_with_state(obj, state, browser, new, notebook_handle=notebook_handle)

    def is_application(obj: Any) -> TypeGuard[Application]:
        return getattr(obj, '_is_a_bokeh_application_class', False)

    if is_application(obj) or callable(obj): # TODO (bev) check callable signature more thoroughly
        # This ugliness is to prevent importing bokeh.application (which would bring
        # in Tornado) just in order to show a non-server object
        assert state.notebook_type is not None
        return run_notebook_hook(state.notebook_type, 'app', obj, state, notebook_url, **kwargs)

    raise ValueError(_BAD_SHOW_MSG)

#-----------------------------------------------------------------------------
# Dev API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Private API
#-----------------------------------------------------------------------------

_BAD_SHOW_MSG = """Invalid object to show. The object to passed to show must be one of:

* a UIElement (e.g. a plot, figure, widget or layout)
* a Bokeh Application
* a callable suitable to an application FunctionHandler
"""

def _show_file_with_state(obj: UIElement, state: State, new: BrowserTarget, controller: BrowserLike) -> None:
    '''

    '''
    filename = save(obj, state=state)
    controller.open("file://" + filename, new=NEW_PARAM[new])

def _show_with_state(obj: UIElement, state: State, browser: str | None,
        new: BrowserTarget, notebook_handle: bool = False) -> CommsHandle | None:
    '''

    '''
    controller = get_browser_controller(browser=browser)

    comms_handle = None
    shown = False

    if state.notebook:
        assert state.notebook_type is not None
        comms_handle = run_notebook_hook(state.notebook_type, 'doc', obj, state, notebook_handle)
        shown = True

    if state.file or not shown:
        _show_file_with_state(obj, state, new, controller)

    return comms_handle

#-----------------------------------------------------------------------------
# Code
#-----------------------------------------------------------------------------
