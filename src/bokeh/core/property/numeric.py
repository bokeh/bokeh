#-----------------------------------------------------------------------------
# Copyright (c) Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------
""" Provide the numeric properties.

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
from typing import Any, TypeVar, Union

# Bokeh imports
from ...util.deprecation import deprecated
from .bases import (
    Init,
    Property,
    SingleParameterizedProperty,
    TypeOrInst,
)
from .primitive import Float, Int
from .singletons import Intrinsic, Undefined

#-----------------------------------------------------------------------------
# Globals and constants
#-----------------------------------------------------------------------------

__all__ = (
    'Angle',
    'Byte',
    'Interval',
    'NonNegative',
    'NonNegativeInt',
    'Percent',
    'Positive',
    'PositiveInt',
    'Size',
)

T = TypeVar("T", bound=Union[int, float])

#-----------------------------------------------------------------------------
# General API
#-----------------------------------------------------------------------------

class NonNegative(SingleParameterizedProperty[T]):
    """ A property accepting a value of some other type while having undefined default. """

    def __init__(self, type_param: TypeOrInst[Property[T]], *, default: Init[T] = Intrinsic, help: str | None = None) -> None:
        super().__init__(type_param, default=default, help=help)

    def validate(self, value: Any, detail: bool = True) -> None:
        super().validate(value, detail)

        if not (0 <= value):
            raise ValueError(f"expected a non-negative number, got {value!r}")

class Positive(SingleParameterizedProperty[T]):
    """ A property accepting a value of some other type while having undefined default. """

    def __init__(self, type_param: TypeOrInst[Property[T]], *, default: Init[T] = Intrinsic, help: str | None = None) -> None:
        super().__init__(type_param, default=default, help=help)

    def validate(self, value: Any, detail: bool = True) -> None:
        super().validate(value, detail)

        if not (0 < value):
            raise ValueError(f"expected a positive number, got {value!r}")

class NonNegativeInt(Int):
    """
    Accept non-negative integers.

    .. deprecated:: 3.0.0

        Use ``NonNegative(Int)`` instead.
    """

    def __init__(self, default: Init[int] = Intrinsic, *, help: str | None = None) -> None:
        deprecated((3, 0, 0), "NonNegativeInt", "NonNegative(Int)")
        super().__init__(default=default, help=help)

    def validate(self, value: Any, detail: bool = True) -> None:
        super().validate(value, detail)

        if not (0 <= value):
            raise ValueError(f"expected non-negative integer, got {value!r}")

class PositiveInt(Int):
    """
    Accept positive integers.

    .. deprecated:: 3.0.0

        Use ``Positive(Int)`` instead.
    """

    def __init__(self, default: Init[int] = Intrinsic, *, help: str | None = None) -> None:
        deprecated((3, 0, 0), "Positive", "Positive(Int)")
        super().__init__(default=default, help=help)

    def validate(self, value: Any, detail: bool = True) -> None:
        super().validate(value, detail)

        if not (0 < value):
            raise ValueError(f"expected positive integer, got {value!r}")

class Interval(SingleParameterizedProperty[T]):
    """ Accept numeric values that are contained within a given interval.

    Args:
        interval_type (numeric property):
            numeric types for the range, e.g. ``Int``, ``Float``

        start (number) :
            A minimum allowable value for the range. Values less than
            ``start`` will result in validation errors.

        end (number) :
            A maximum allowable value for the range. Values greater than
            ``end`` will result in validation errors.

    Example:

        .. code-block:: python

            >>> class RangeModel(HasProps):
            ...     prop = Range(Float, 10, 20)
            ...

            >>> m = RangeModel()

            >>> m.prop = 10

            >>> m.prop = 20

            >>> m.prop = 15

            >>> m.prop = 2     # ValueError !!

            >>> m.prop = 22    # ValueError !!

            >>> m.prop = "foo" # ValueError !!

    """
    def __init__(self, type_param: TypeOrInst[Property[T]], start: T, end: T, *,
            default: Init[T] = Undefined, help: str | None = None) -> None:
        super().__init__(type_param, default=default, help=help)
        self.type_param.validate(start)
        self.type_param.validate(end)
        self.start = start
        self.end = end

    def __str__(self) -> str:
        class_name = self.__class__.__name__
        return f"{class_name}({self.type_param}, {self.start!r}, {self.end!r})"

    def validate(self, value: Any, detail: bool = True) -> None:
        super().validate(value, detail)

        if not (self.type_param.is_valid(value) and value >= self.start and value <= self.end):
            msg = "" if not detail else f"expected a value of type {self.type_param} in range [{self.start}, {self.end}], got {value!r}"
            raise ValueError(msg)

class Byte(Interval[int]):
    """ Accept integral byte values (0-255).

    Example:

        .. code-block:: python

            >>> class ByteModel(HasProps):
            ...     prop = Byte(default=0)
            ...

            >>> m = ByteModel()

            >>> m.prop = 255

            >>> m.prop = 256  # ValueError !!

            >>> m.prop = 10.3 # ValueError !!

    """

    def __init__(self, default: Init[int] = 0, help: str | None = None) -> None:
        super().__init__(Int, 0, 255, default=default, help=help)

class Size(Float):
    """ Accept non-negative numeric values.

    Args:
        default (float, optional) :
            A default value for attributes created from this property to have.

        help (str or None, optional) :
            A documentation string for this property. It will be automatically
            used by the :ref:`bokeh.sphinxext.bokeh_prop` extension when
            generating Spinx documentation. (default: None)

    Example:

        .. code-block:: python

            >>> class SizeModel(HasProps):
            ...     prop = Size()
            ...

            >>> m = SizeModel()

            >>> m.prop = 0

            >>> m.prop = 10e6

            >>> m.prop = -10   # ValueError !!

            >>> m.prop = "foo" # ValueError !!

    """
    def validate(self, value: Any, detail: bool = True) -> None:
        super().validate(value, detail)

        if value < 0:
            msg = "" if not detail else f"expected a non-negative number, got {value!r}"
            raise ValueError(msg)

class Percent(Float):
    """ Accept floating point percentage values.

    ``Percent`` can be useful and semantically meaningful for specifying
    things like alpha values and extents.

    Args:
        default (float, optional) :
            A default value for attributes created from this property to have.

        help (str or None, optional) :
            A documentation string for this property. It will be automatically
            used by the :ref:`bokeh.sphinxext.bokeh_prop` extension when
            generating Spinx documentation. (default: None)

    Example:

        .. code-block:: python

            >>> class PercentModel(HasProps):
            ...     prop = Percent()
            ...

            >>> m = PercentModel()

            >>> m.prop = 0.0

            >>> m.prop = 0.2

            >>> m.prop = 1.0

            >>> m.prop = -2  # ValueError !!

            >>> m.prop = 5   # ValueError !!

    """

    def validate(self, value: Any, detail: bool = True) -> None:
        super().validate(value, detail)

        if 0.0 <= value <= 1.0:
            return

        msg = "" if not detail else f"expected a value in range [0, 1], got {value!r}"
        raise ValueError(msg)

class Angle(Float):
    """ Accept floating point angle values.

    ``Angle`` is equivalent to :class:`~bokeh.core.properties.Float` but is
    provided for cases when it is more semantically meaningful.

    Args:
        default (float, optional) :
            A default value for attributes created from this property to have.

        help (str or None, optional) :
            A documentation string for this property. It will be automatically
            used by the :ref:`bokeh.sphinxext.bokeh_prop` extension when
            generating Spinx documentation. (default: None)

    """

#-----------------------------------------------------------------------------
# Dev API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Private API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Code
#-----------------------------------------------------------------------------
