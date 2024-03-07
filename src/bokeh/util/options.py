#-----------------------------------------------------------------------------
# Copyright (c) Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------
""" Utilities for specifying, validating, and documenting configuration
options.

"""

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
from typing import Any

# Bokeh imports
from ..core.has_props import HasProps, Local

#-----------------------------------------------------------------------------
# Globals and constants
#-----------------------------------------------------------------------------

__all__ = (
    'Options',
)

#-----------------------------------------------------------------------------
# General API
#-----------------------------------------------------------------------------

class Options(HasProps, Local):
    ''' Leverage the Bokeh properties type system for specifying and
    validating configuration options.

    Subclasses of ``Options`` specify a set of configuration options
    using standard Bokeh properties:

    .. code-block:: python

        class ConnectOpts(Options):

            host = String(default="127.0.0.1", help="a host value")

            port = Int(default=5590, help="a port value")

    Then a ``ConnectOpts`` can be created by passing a dictionary
    containing keys and values corresponding to the configuration options,
    as well as any additional keys and values. The items corresponding
    to the properties on ``ConnectOpts`` will be **removed** from the
    dictionary. This can be useful for functions that accept their own
    set of config keyword arguments in addition to some set of Bokeh model
    properties.

    '''

    def __init__(self, kw: dict[str, Any]) -> None:

        # remove any items that match our declared properties
        props: dict[str, Any] = {}
        for k in self.properties():
            if k in kw:
                props[k] = kw.pop(k)

        super().__init__(**props)

#-----------------------------------------------------------------------------
# Dev API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Private API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Code
#-----------------------------------------------------------------------------
