#-----------------------------------------------------------------------------
# Copyright (c) 2012 - 2019, Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------
''' Provide the Enum property.

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
from ...util.string import nice_join
from .. import enums
from .primitive import String

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
    ''' Accept values from enumerations.

    The first value in enumeration is used as the default value, unless the
    ``default`` keyword argument is used.

    See :ref:`bokeh.core.enums` for more information.

    '''
    def __init__(self, enum, *values, **kwargs):
        if not (not values and isinstance(enum, enums.Enumeration)):
            enum = enums.enumeration(enum, *values)

        self._enum = enum

        default = kwargs.get("default", enum._default)
        help = kwargs.get("help")

        super(Enum, self).__init__(default=default, help=help)

    def __str__(self):
        return "%s(%s)" % (self.__class__.__name__, ", ".join(map(repr, self.allowed_values)))

    @property
    def allowed_values(self):
        return self._enum._values

    def validate(self, value, detail=True):
        super(Enum, self).validate(value, detail)

        if not (value is None or value in self._enum):
            msg = "" if not detail else "invalid value: %r; allowed values are %s" % (value, nice_join(self.allowed_values))
            raise ValueError(msg)

    def _sphinx_type(self):
        # try to return a link to a proper enum in bokeh.core.enums if possible
        if self._enum in enums.__dict__.values():
            for name, obj in enums.__dict__.items():
                if self._enum is obj:
                    val = self._sphinx_model_link("%s.%s" % (self._enum.__module__, name))
        else:
            val = str(self._enum)
        return self._sphinx_prop_link() + "( %s )" % val

#-----------------------------------------------------------------------------
# Dev API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Private API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Code
#-----------------------------------------------------------------------------
