#-----------------------------------------------------------------------------
# Copyright (c) 2012 - 2021, Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------
""" Provide the Enum property.

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
from ...util.string import nice_join
from .. import enums
from .primitive import String
from .singletons import Intrinsic

#-----------------------------------------------------------------------------
# Globals and constants
#-----------------------------------------------------------------------------

__all__ = (
    'Enum',
)

#-----------------------------------------------------------------------------
# General API
#-----------------------------------------------------------------------------

class Enum(String):
    """ Accept values from enumerations.

    The first value in enumeration is used as the default value, unless the
    ``default`` keyword argument is used.

    See :ref:`bokeh.core.enums` for more information.

    """

    def __init__(self, enum, *values, default=Intrinsic, help=None, serialized=None, readonly=False):
        if not (not values and isinstance(enum, enums.Enumeration)):
            enum = enums.enumeration(enum, *values)
        self._enum = enum

        default = default if default is not Intrinsic else enum._default
        super().__init__(default=default, help=help, serialized=serialized, readonly=readonly)

    def __str__(self):
        class_name = self.__class__.__name__
        allowed_values = ", ".join(repr(x) for x in self.allowed_values)
        return f"{class_name}({allowed_values})"

    @property
    def allowed_values(self):
        return self._enum._values

    def validate(self, value, detail=True):
        super().validate(value, detail)

        if value in self._enum:
            return

        msg = "" if not detail else f"invalid value: {value!r}; allowed values are {nice_join(self.allowed_values)}"
        raise ValueError(msg)

    def _sphinx_type(self):
        # try to return a link to a proper enum in bokeh.core.enums if possible
        if self._enum in enums.__dict__.values():
            for name, obj in enums.__dict__.items():
                if self._enum is obj:
                    val = self._sphinx_model_link(f"{self._enum.__module__}.{name}")
                    return f"{self._sphinx_prop_link()}({val})"

        # otherwise just a basic str name format
        return f"{self._sphinx_prop_link()}({self._enum})"

#-----------------------------------------------------------------------------
# Dev API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Private API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Code
#-----------------------------------------------------------------------------
