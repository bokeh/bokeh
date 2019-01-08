#-----------------------------------------------------------------------------
# Copyright (c) 2012 - 2019, Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------
''' Provide wildcard properties.

The Any and AnyRef properties can be used to hold values without performing
any validation.

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
from .bases import Property

#-----------------------------------------------------------------------------
# Globals and constants
#-----------------------------------------------------------------------------

__all__ = (
    'Any',
    'AnyRef'
)

#-----------------------------------------------------------------------------
# General API
#-----------------------------------------------------------------------------

class Any(Property):
    ''' Accept all values.

    The ``Any`` property does not do any validation or transformation.

    Args:
        default (obj or None, optional) :
            A default value for attributes created from this property to
            have (default: None)

        help (str or None, optional) :
            A documentation string for this property. It will be automatically
            used by the :ref:`bokeh.sphinxext.bokeh_prop` extension when
            generating Spinx documentation. (default: None)

        serialized (bool, optional) :
            Whether attributes created from this property should be included
            in serialization (default: True)

        readonly (bool, optional) :
            Whether attributes created from this property are read-only.
            (default: False)

    Example:

        .. code-block:: python

            >>> class AnyModel(HasProps):
            ...     prop = Any()
            ...

            >>> m = AnyModel()

            >>> m.prop = True

            >>> m.prop = 10

            >>> m.prop = 3.14

            >>> m.prop = "foo"

            >>> m.prop = [1, 2, 3]

    '''

class AnyRef(Property):
    ''' Accept all values and force reference discovery. '''

    @property
    def has_ref(self):
        return True

#-----------------------------------------------------------------------------
# Dev API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Private API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Code
#-----------------------------------------------------------------------------
