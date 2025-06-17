#-----------------------------------------------------------------------------
# Copyright (c) Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------
""" Provide the JSON property.

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
from .primitive import String

#-----------------------------------------------------------------------------
# Globals and constants
#-----------------------------------------------------------------------------

__all__ = (
    'JSON',
)

#-----------------------------------------------------------------------------
# General API
#-----------------------------------------------------------------------------

class JSON(String):
    """ Accept JSON string values.

    The value is transmitted and received by BokehJS as a *string*
    containing JSON content. i.e., you must use ``JSON.parse`` to unpack
    the value into a JavaScript hash.

    Args:
        default (string, optional) :
            A default value for attributes created from this property to
            have.

        help (str or None, optional) :
            A documentation string for this property. (default: None)

    """

    def validate(self, value: Any, detail: bool = True) -> None:
        super().validate(value, detail)

        try:
            import json
            json.loads(value)
        except ValueError:
            msg = "" if not detail else f"expected JSON text, got {value!r}"
            raise ValueError(msg)

#-----------------------------------------------------------------------------
# Dev API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Private API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Code
#-----------------------------------------------------------------------------
