#-----------------------------------------------------------------------------
# Copyright (c) 2012 - 2018, Anaconda, Inc. All rights reserved.
#
# Powered by the Bokeh Development Team.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------
''' Provide the Auto property.

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
from .enum import Enum

#-----------------------------------------------------------------------------
# Globals and constants
#-----------------------------------------------------------------------------

__all__ = (
    'Auto',
)

#-----------------------------------------------------------------------------
# General API
#-----------------------------------------------------------------------------

class Auto(Enum):
    ''' Accepts only the string "auto".

    Useful for properties that can be configured to behave "automatically".

    Example:

        This property is often most useful in conjunction with the
        :class:`~bokeh.core.properties.Either` property.

        .. code-block:: python

            >>> class AutoModel(HasProps):
            ...     prop = Either(Float, Auto)
            ...

            >>> m = AutoModel()

            >>> m.prop = 10.2

            >>> m.prop = "auto"

            >>> m.prop = "foo"      # ValueError !!

            >>> m.prop = [1, 2, 3]  # ValueError !!

    '''
    def __init__(self):
        super(Auto, self).__init__("auto")

    def __str__(self):
        return self.__class__.__name__

    def _sphinx_type(self):
        return self._sphinx_prop_link()

#-----------------------------------------------------------------------------
# Dev API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Private API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Code
#-----------------------------------------------------------------------------
