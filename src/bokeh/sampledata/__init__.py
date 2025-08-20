#-----------------------------------------------------------------------------
# Copyright (c) Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------
'''
The ``bokeh.sampledata`` module exposes datasets that are used in examples and
documentation. Some datasets require separate installation. To install those
using ``pip``, execute the command:

.. code-block:: sh

    pip install bokeh_sampledata

'''

#-----------------------------------------------------------------------------
# Boilerplate
#-----------------------------------------------------------------------------
from __future__ import annotations

import logging # isort:skip
log = logging.getLogger(__name__)

from ..util.warnings import BokehUserWarning, warn

#-----------------------------------------------------------------------------
# Import
#-----------------------------------------------------------------------------

from typing import Any

from packaging.version import Version

#-----------------------------------------------------------------------------
# Globals and constants
#-----------------------------------------------------------------------------

__all__ = ()

SAMPLEDATA_MIN_VERSION = "2025.0"

#-----------------------------------------------------------------------------
# General API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Dev API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Private API
#-----------------------------------------------------------------------------

def _create_sampledata_shim(mod_name: str) -> tuple[Any, Any, Any]:
    from importlib import import_module
    mod = import_module(f"bokeh_sampledata.{mod_name.split('.')[-1]}")
    def __getattr__(name: str) -> Any:
        return getattr(mod, name)
    def __dir__() -> list[str]:
        return dir(mod)
    return __getattr__, __dir__, mod.__doc__

#-----------------------------------------------------------------------------
# Code
#-----------------------------------------------------------------------------

try:
    import bokeh_sampledata as _mod
except ImportError:
    raise RuntimeError(
        "The separate bokeh_sampledata is needed in order to use the "
        "sampledata module. Install with 'pip install bokeh_sampledata'.",
    )

if Version(_mod.__version__) < Version(SAMPLEDATA_MIN_VERSION):
    warn(
        f"The installed bokeh_sampledata version ({_mod.__version__}) is too "
        f"old. At least version {SAMPLEDATA_MIN_VERSION} is needed to run all "
        "examples properly. Update with 'pip install -U bokeh_sampledata'.",
        BokehUserWarning,
    )
