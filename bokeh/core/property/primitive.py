#-----------------------------------------------------------------------------
# Copyright (c) 2012 - 2021, Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------
""" Provide properties for Python primitive types.

"""

#-----------------------------------------------------------------------------
# Boilerplate
#-----------------------------------------------------------------------------
import logging # isort:skip
log = logging.getLogger(__name__)

#-----------------------------------------------------------------------------
# Imports
#-----------------------------------------------------------------------------

# Standard library imports
import numbers

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
    'Null',
    'String',
)

#-----------------------------------------------------------------------------
# General API
#-----------------------------------------------------------------------------

class Null(PrimitiveProperty):
    """ Accept only ``None`` value.

        Use this in conjunction with ``Either(Null, Type)`` or as ``Nullable(Type)``.
    """

    _underlying_type = (type(None),)

    def __init__(self, default=None, *, help=None, serialized=None, readonly=False):
        super().__init__(default=default, help=help, serialized=serialized, readonly=readonly)

class Bool(PrimitiveProperty):
    """ Accept boolean values.

    Args:
        default (obj, optional) :
            A default value for attributes created from this property to have.

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

    """

    _underlying_type = bokeh_bool_types

    def __init__(self, default=False, *, help=None, serialized=None, readonly=False):
        super().__init__(default=default, help=help, serialized=serialized, readonly=readonly)

class Complex(PrimitiveProperty):
    """ Accept complex floating point values.

    Args:
        default (complex, optional) :
            A default value for attributes created from this property to have.

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

    """

    _underlying_type = (numbers.Complex,)

    def __init__(self, default=0j, *, help=None, serialized=None, readonly=False):
        super().__init__(default=default, help=help, serialized=serialized, readonly=readonly)

class Int(PrimitiveProperty):
    """ Accept signed integer values.

    Args:
        default (int, optional) :
            A default value for attributes created from this property to have.

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

    """

    _underlying_type = bokeh_integer_types

    def __init__(self, default=0, *, help=None, serialized=None, readonly=False):
        super().__init__(default=default, help=help, serialized=serialized, readonly=readonly)

class Float(PrimitiveProperty):
    """ Accept floating point values.

    Args:
        default (float, optional) :
            A default value for attributes created from this property to have.

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


    """

    _underlying_type = (numbers.Real,)

    def __init__(self, default=0.0, *, help=None, serialized=None, readonly=False):
        super().__init__(default=default, help=help, serialized=serialized, readonly=readonly)

class String(PrimitiveProperty):
    """ Accept string values.

    Args:
        default (string, optional) :
            A default value for attributes created from this property to have.

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

    """

    _underlying_type = (str,)

    def __init__(self, default="", *, help=None, serialized=None, readonly=False):
        super().__init__(default=default, help=help, serialized=serialized, readonly=readonly)

#-----------------------------------------------------------------------------
# Dev API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Private API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Code
#-----------------------------------------------------------------------------
