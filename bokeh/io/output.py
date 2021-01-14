#-----------------------------------------------------------------------------
# Copyright (c) 2012 - 2021, Anaconda, Inc., and Bokeh Contributors.
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

# Bokeh imports
from .notebook import run_notebook_hook
from .state import curstate

#-----------------------------------------------------------------------------
# Globals and constants
#-----------------------------------------------------------------------------

__all__ = (
    'output_file',
    'output_notebook',
    'reset_output',
)

#-----------------------------------------------------------------------------
# General API
#-----------------------------------------------------------------------------

def output_file(filename, title="Bokeh Plot", mode=None, root_dir=None):
    '''Configure the default output state to generate output saved
    to a file when :func:`show` is called.

    Does not change the current ``Document`` from ``curdoc()``. File and notebook
    output may be active at the same time, so e.g., this does not clear the
    effects of ``output_notebook()``.

    Args:
        filename (str) : a filename for saving the HTML document

        title (str, optional) : a title for the HTML document (default: "Bokeh Plot")

        mode (str, optional) : how to include BokehJS (default: ``'cdn'``)
            One of: ``'inline'``, ``'cdn'``, ``'relative(-dev)'`` or
            ``'absolute(-dev)'``. See :class:`bokeh.resources.Resources` for more details.

        root_dir (str, optional) : root directory to use for 'absolute' resources. (default: None)
            This value is ignored for other resource types, e.g. ``INLINE`` or
            ``CDN``.

    Returns:
        None

    .. note::
        Generally, this should be called at the beginning of an interactive
        session or the top of a script.

    .. warning::
        This output file will be overwritten on every save, e.g., each time
        show() or save() is invoked.

    '''
    curstate().output_file(
        filename,
        title=title,
        mode=mode,
        root_dir=root_dir
    )

def output_notebook(resources=None, verbose=False, hide_banner=False, load_timeout=5000, notebook_type='jupyter'):
    ''' Configure the default output state to generate output in notebook cells
    when :func:`show` is called. Note that, :func:`show` may be called multiple
    times in a single cell to display multiple objects in the output cell. The
    objects will be displayed in order.

    Args:
        resources (Resource, optional) :
            How and where to load BokehJS from (default: CDN)

        verbose (bool, optional) :
            whether to display detailed BokehJS banner (default: False)

        hide_banner (bool, optional):
            whether to hide the Bokeh banner (default: False)

        load_timeout (int, optional) :
            Timeout in milliseconds when plots assume load timed out (default: 5000)

        notebook_type (string, optional):
            Notebook type (default: jupyter)

    Returns:
        None

    .. note::
        Generally, this should be called at the beginning of an interactive
        session or the top of a script.

    '''
    # verify notebook_type first in curstate().output_notebook
    curstate().output_notebook(notebook_type)
    run_notebook_hook(notebook_type, 'load', resources, verbose, hide_banner, load_timeout)

def reset_output(state=None):
    ''' Clear the default state of all output modes.

    Returns:
        None

    '''
    curstate().reset()

#-----------------------------------------------------------------------------
# Dev API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Private API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Code
#-----------------------------------------------------------------------------
