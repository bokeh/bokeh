#-----------------------------------------------------------------------------
# Copyright (c) 2012 - 2021, Anaconda, Inc. All rights reserved.
#
# Powered by the Bokeh Development Team.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------
""" Provide the Struct property.

"""

#-----------------------------------------------------------------------------
# Boilerplate
#-----------------------------------------------------------------------------
import logging # isort:skip
log = logging.getLogger(__name__)

#-----------------------------------------------------------------------------
# Imports
#-----------------------------------------------------------------------------

# Bokeh imports
from .bases import ParameterizedProperty

#-----------------------------------------------------------------------------
# Globals and constants
#-----------------------------------------------------------------------------

__all__ = (
    'Struct',
)

#-----------------------------------------------------------------------------
# General API
#-----------------------------------------------------------------------------

class Struct(ParameterizedProperty):
    """ Accept values that are structures.


    """
    def __init__(self, **fields):
        default = fields.pop("default", None)
        help = fields.pop("help", None)

        self._fields = {}
        for name, type in fields.items():
            self._fields[name] = self._validate_type_param(type)

        super().__init__(default=default, help=help)

    @property
    def type_params(self):
        return list(self._fields.values())

    def validate(self, value, detail=True):
        super().validate(value, detail)

        if isinstance(value, dict) and len(value) <= len(self._fields):
            # note use of for-else loop here
            for name, type in self._fields.items():
                if not type.is_valid(value.get(name, None)):
                    break
            else:
                return

        msg = "" if not detail else f"expected an element of {self}, got {value!r}"
        raise ValueError(msg)

    def __str__(self):
        class_name = self.__class__.__name__
        fields = ", ".join(f"{name}={typ}" for name, typ in self._fields.items())
        return f"{class_name}({fields})"

#-----------------------------------------------------------------------------
# Dev API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Private API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Code
#-----------------------------------------------------------------------------
