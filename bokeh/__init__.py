#-----------------------------------------------------------------------------
# Copyright (c) 2012 - 2021, Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------
''' Bokeh is a Python library for creating interactive visualizations for modern
web browsers.

Bokeh helps you build beautiful graphics, ranging from simple plots to complex
dashboards with streaming datasets. With Bokeh, you can create JavaScript-powered
visualizations without writing any JavaScript yourself.

Most of the functionality of Bokeh is accessed through submodules such as
|bokeh.plotting| and |bokeh.models|.

For full documentation, please visit https://docs.bokeh.org

----

The top-level ``bokeh`` module itself contains a few useful functions and
attributes:

.. attribute:: __version__
  :annotation: = currently installed version of Bokeh

.. autofunction:: bokeh.license

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

#-----------------------------------------------------------------------------
# Globals and constants
#-----------------------------------------------------------------------------

__all__ = (
    '__version__',
    'license',
    'sampledata',
)

#-----------------------------------------------------------------------------
# General API
#-----------------------------------------------------------------------------

def license():
    ''' Print the Bokeh license to the console.

    Returns:
        None

    '''
    from os.path import join
    with open(join(__path__[0], 'LICENSE.txt')) as lic:
        print(lic.read())

#-----------------------------------------------------------------------------
# Dev API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Private API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Code
#-----------------------------------------------------------------------------

# expose Bokeh version
from .util.version import __version__; __version__

# expose sample data module
from . import sampledata; sampledata

# configure Bokeh logger
from .util import logconfig # isort:skip
del logconfig

# Configure warnings to always show nice mssages, despite Python's active
# efforts to hide them from users.
import warnings # isort:skip
from .util.warnings import BokehDeprecationWarning, BokehUserWarning # isort:skip
warnings.simplefilter('always', BokehDeprecationWarning)
warnings.simplefilter('always', BokehUserWarning)

original_formatwarning = warnings.formatwarning
def _formatwarning(message, category, filename, lineno, line=None):
    from .util.warnings import BokehDeprecationWarning, BokehUserWarning
    if category not in (BokehDeprecationWarning, BokehUserWarning):
        return original_formatwarning(message, category, filename, lineno, line)
    return "%s: %s\n" % (category.__name__, message)
warnings.formatwarning = _formatwarning

del _formatwarning
del BokehDeprecationWarning, BokehUserWarning
del warnings
