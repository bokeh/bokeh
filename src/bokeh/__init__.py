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

def license() -> None:
    ''' Print the Bokeh license to the console.

    Returns:
        None

    '''
    from pathlib import Path
    with open(Path(__file__).parent / 'LICENSE.txt') as lic:
        print(lic.read())

def _jupyter_labextension_paths() -> list[dict[str, str]]:
    return [{"src": "jupyter/labextension", "dest": "@bokeh/bokeh-jupyter"}]

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

def _configure_warnings() -> None:
    # Configure warnings to always show nice messages, despite Python's active
    # efforts to hide them from users.
    import warnings

    from .util.warnings import BokehDeprecationWarning, BokehUserWarning

    warnings.simplefilter('always', BokehDeprecationWarning)
    warnings.simplefilter('always', BokehUserWarning)

    original_formatwarning = warnings.formatwarning
    def _formatwarning(message: Warning | str, category: type[Warning], filename: str, lineno: int, line: str | None = None) -> str:
        from .util.warnings import BokehDeprecationWarning, BokehUserWarning
        if category not in (BokehDeprecationWarning, BokehUserWarning):
            return original_formatwarning(message, category, filename, lineno, line)
        return f"{category.__name__}: {message}\n"
    warnings.formatwarning = _formatwarning

_configure_warnings()
del _configure_warnings

def _configure_marimo() -> None:
    # marimo releases predating Bokeh 4 register a formatter that imports the
    # removed output_notebook API and replaces show() with a static iframe.
    # Disable only that formatter when marimo already owns the runtime. Its
    # normal rich-display path then selects Bokeh's AnyWidget MIME bundle.
    import sys
    from importlib import import_module

    if "marimo" not in sys.modules:
        return
    try:
        formatters = import_module("marimo._output.formatters.formatters")
    except ImportError:
        return
    factories = getattr(formatters, "THIRD_PARTY_FACTORIES", {})
    if (factory := factories.get("bokeh")) is not None:
        factory.register = lambda: None

_configure_marimo()
del _configure_marimo
