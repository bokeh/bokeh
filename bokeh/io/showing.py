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

# External imports

# Bokeh imports
from ..models.layouts import LayoutDOM
from ..util.browser import get_browser_controller, NEW_PARAM
from .notebook import run_notebook_hook
from .saving import save
from .state import curstate

#-----------------------------------------------------------------------------
# Globals and constants
#-----------------------------------------------------------------------------

__all__ = (
    'show',
)

#-----------------------------------------------------------------------------
# General API
#-----------------------------------------------------------------------------

def show(obj, browser=None, new="tab", notebook_handle=False, notebook_url="localhost:8888", **kw):
    ''' Immediately display a Bokeh object or application.

        :func:`show` may be called multiple times in a single Jupyter notebook
        cell to display multiple objects. The objects are displayed in order.

    Args:
        obj (LayoutDOM or Application or callable) :
            A Bokeh object to display.

            Bokeh plots, widgets, layouts (i.e. rows and columns) may be
            passed to ``show`` in order to display them. When ``output_file``
            has been called, the output will be to an HTML file, which is also
            opened in a new browser window or tab. When ``output_notebook``
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
            the documentation for the standard library webbrowser_ module for
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

    Some parameters are only useful when certain output modes are active:

    * The ``browser`` and ``new`` parameters only apply when ``output_file``
      is active.

    * The ``notebook_handle`` parameter only applies when ``output_notebook``
      is active, and non-Application objects are being shown. It is only supported to Jupyter notebook,
      raise exception for other notebook types when it is True.

    * The ``notebook_url`` parameter only applies when showing Bokeh
      Applications in a Jupyter notebook.

    * Any additional keyword arguments are passed to :class:`~bokeh.server.Server` when
      showing a Bokeh app (added in version 1.1)

    Returns:
        When in a Jupyter notebook (with ``output_notebook`` enabled)
        and ``notebook_handle=True``, returns a handle that can be used by
        ``push_notebook``, None otherwise.

    .. _webbrowser: https://docs.python.org/2/library/webbrowser.html

    '''
    state = curstate()

    is_application = getattr(obj, '_is_a_bokeh_application_class', False)

    if not (isinstance(obj, LayoutDOM) or is_application or callable(obj)):
        raise ValueError(_BAD_SHOW_MSG)

    # TODO (bev) check callable signature more thoroughly

    # This ugliness is to prevent importing bokeh.application (which would bring
    # in Tornado) just in order to show a non-server object
    if is_application or callable(obj):
        return run_notebook_hook(state.notebook_type, 'app', obj, state, notebook_url, **kw)

    return _show_with_state(obj, state, browser, new, notebook_handle=notebook_handle)

#-----------------------------------------------------------------------------
# Dev API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Private API
#-----------------------------------------------------------------------------

_BAD_SHOW_MSG = """"Invalid object to show. The object to passed to show must be one of:

* a LayoutDOM (e.g. a Plot or Widget or Layout)
* a Bokeh Application
* a callable suitable to an application FunctionHandler
"""

def _show_file_with_state(obj, state, new, controller):
    '''

    '''
    filename = save(obj, state=state)
    controller.open("file://" + filename, new=NEW_PARAM[new])

def _show_with_state(obj, state, browser, new, notebook_handle=False):
    '''

    '''
    controller = get_browser_controller(browser=browser)

    comms_handle = None
    shown = False

    if state.notebook:
        comms_handle = run_notebook_hook(state.notebook_type, 'doc', obj, state, notebook_handle)
        shown = True

    if state.file or not shown:
        _show_file_with_state(obj, state, new, controller)

    return comms_handle

#-----------------------------------------------------------------------------
# Code
#-----------------------------------------------------------------------------
