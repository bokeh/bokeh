#-----------------------------------------------------------------------------
# Copyright (c) 2012 - 2019, Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------
''' Provide properties for Python primitive types.

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
import numbers

# External imports
from six import string_types

# Bokeh imports
from .bases import PrimitiveProperty

#-----------------------------------------------------------------------------
# Globals and constants
#-----------------------------------------------------------------------------

bokeh_bool_types = (bool,)
try:
    import numpy as np
    bokeh_bool_types += (np.bool8,)
except ImportError:
    pass

bokeh_integer_types = (numbers.Integral,)

__all__ = (
    'Bool',
    'Complex',
    'Int',
    'Float',
    'String',
)

#-----------------------------------------------------------------------------
# General API
#-----------------------------------------------------------------------------

class Bool(PrimitiveProperty):
    ''' Accept boolean values.

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

            >>> class BoolModel(HasProps):
            ...     prop = Bool(default=False)
            ...

            >>> m = BoolModel()

            >>> m.prop = True

            >>> m.prop = False

            >>> m.prop = 10  # ValueError !!

    '''
    _underlying_type = bokeh_bool_types

class Complex(PrimitiveProperty):
    ''' Accept complex floating point values.

    Args:
        default (complex or None, optional) :
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

    '''
    _underlying_type = (numbers.Complex,)

class Int(PrimitiveProperty):
    ''' Accept signed integer values.

    Args:
        default (int or None, optional) :
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

            >>> class IntModel(HasProps):
            ...     prop = Int()
            ...

            >>> m = IntModel()

            >>> m.prop = 10

            >>> m.prop = -200

            >>> m.prop = 10.3  # ValueError !!

    '''
    _underlying_type = bokeh_integer_types

class Float(PrimitiveProperty):
    ''' Accept floating point values.

    Args:
        default (float or None, optional) :
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

            >>> class FloatModel(HasProps):
            ...     prop = Float()
            ...

            >>> m = FloatModel()

            >>> m.prop = 10

            >>> m.prop = 10.3

            >>> m.prop = "foo"  # ValueError !!


    '''
    _underlying_type = (numbers.Real,)

class String(PrimitiveProperty):
    ''' Accept string values.

    Args:
        default (string or None, optional) :
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

            >>> class StringModel(HasProps):
            ...     prop = String()
            ...

            >>> m = StringModel()

            >>> m.prop = "foo"

            >>> m.prop = 10.3       # ValueError !!

            >>> m.prop = [1, 2, 3]  # ValueError !!

    '''
    _underlying_type = string_types

#-----------------------------------------------------------------------------
# Dev API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Private API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Code
#-----------------------------------------------------------------------------
