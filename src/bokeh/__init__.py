#-----------------------------------------------------------------------------
# Copyright (c) Anaconda, Inc., and Bokeh Contributors.
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

# Standard library imports
import importlib.metadata as importlib_metadata

#-----------------------------------------------------------------------------
# Globals and constants
#-----------------------------------------------------------------------------

__all__ = (
    '__version__',
    'license',
)

__version__ = importlib_metadata.version("bokeh")

#-----------------------------------------------------------------------------
# General API
#-----------------------------------------------------------------------------

# deprecated, remove at some point
def download():
    from warnings import warn

    from .util.warnings import BokehUserWarning
    warn(
        "bokeh.download() is no longer used. All sample data is available in "
        "the 'bokeh_sampledata' package. Use 'pip install bokeh_sampledata' "
        "or 'conda install bokeh_sampledata' to install it.", BokehUserWarning)

def license():
    ''' Print the Bokeh license to the console.

    Returns:
        None

    '''
    from pathlib import Path
    with open(Path(__file__).parent / 'LICENSE.txt') as lic:
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

del importlib_metadata

# configure Bokeh logger
from .util import logconfig # isort:skip
del logconfig

# Configure warnings to always show nice messages, despite Python's active
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
    return f"{category.__name__}: {message}\n"
warnings.formatwarning = _formatwarning

del _formatwarning
del BokehDeprecationWarning, BokehUserWarning
del warnings
