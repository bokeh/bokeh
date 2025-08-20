#-----------------------------------------------------------------------------
# Copyright (c) Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------
""" Provide properties for Python primitive types.

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
import numbers

# External imports
import numpy as np

# Bokeh imports
from ._sphinx import property_link, register_type_link
from .bases import Init, PrimitiveProperty

#-----------------------------------------------------------------------------
# Globals and constants
#-----------------------------------------------------------------------------

bokeh_bool_types = (bool, np.bool_)
bokeh_integer_types = (numbers.Integral,)

__all__ = (
    'Bool',
    'Bytes',
    'Complex',
    'Float',
    'Int',
    'Null',
    'String',
)

#-----------------------------------------------------------------------------
# General API
#-----------------------------------------------------------------------------

class Null(PrimitiveProperty[None]):
    """ Accept only ``None`` value.

        Use this in conjunction with ``Either(Null, Type)`` or as ``Nullable(Type)``.
    """

    _underlying_type = (type(None),)

    def __init__(self, default: Init[None] = None, *, help: str | None = None) -> None:
        super().__init__(default=default, help=help)

class Bool(PrimitiveProperty[bool]):
    """ Accept boolean values.

    Args:
        default (obj, optional) :
            A default value for attributes created from this property to have.

        help (str or None, optional) :
            A documentation string for this property. (default: None)

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

    def __init__(self, default: Init[bool] = False, *, help: str | None = None) -> None:
        super().__init__(default=default, help=help)

class Complex(PrimitiveProperty[complex]):
    """ Accept complex floating point values.

    Args:
        default (complex, optional) :
            A default value for attributes created from this property to have.

        help (str or None, optional) :
            A documentation string for this property. (default: None)

    """

    _underlying_type = (numbers.Complex,)
    _not_underlying_type = bokeh_bool_types

    def __init__(self, default: Init[complex] = 0j, *, help: str | None = None) -> None:
        super().__init__(default=default, help=help)

class Int(PrimitiveProperty[int]):
    """ Accept signed integer values.

    Args:
        default (int, optional) :
            A default value for attributes created from this property to have.

        help (str or None, optional) :
            A documentation string for this property. (default: None)

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
    _not_underlying_type = bokeh_bool_types

    def __init__(self, default: Init[int] = 0, *, help: str | None = None) -> None:
        super().__init__(default=default, help=help)

class Float(PrimitiveProperty[float]):
    """ Accept floating point values.

    Args:
        default (float, optional) :
            A default value for attributes created from this property to have.

        help (str or None, optional) :
            A documentation string for this property. (default: None)

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
    _not_underlying_type = bokeh_bool_types

    def __init__(self, default: Init[float] = 0.0, *, help: str | None = None) -> None:
        super().__init__(default=default, help=help)

class Bytes(PrimitiveProperty[bytes]):
    """ Accept bytes values.

    """

    _underlying_type = (bytes,)

    def __init__(self, default: Init[bytes] = b"", *, help: str | None = None) -> None:
        super().__init__(default=default, help=help)

class String(PrimitiveProperty[str]):
    """ Accept string values.

    Args:
        default (string, optional) :
            A default value for attributes created from this property to have.

        help (str or None, optional) :
            A documentation string for this property. (default: None)

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

    def __init__(self, default: Init[str] = "", *, help: str | None = None) -> None:
        super().__init__(default=default, help=help)

#-----------------------------------------------------------------------------
# Dev API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Private API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Code
#-----------------------------------------------------------------------------

@register_type_link(Null)
def _sphinx_type(obj: Null) -> str:
    return f"{property_link(obj)}"
