#-----------------------------------------------------------------------------
# Copyright (c) 2012 - 2023, Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------
''' Represent array expressions to be computed on the client (browser) side
by BokehJS.

Expression models are useful as ``DataSpec`` values when it is desired that
the array values be computed in the browser:

.. code-block:: python

    p.circle(x={'expr': some_expression}, ...)

or using the ``expr`` convenience function:

.. code-block:: python

    from bokeh.core.properties import expr

    p.circle(x=expr(some_expression), ...)

In this case, the values of the ``x`` coordinates will be computed in the
browser by the JavaScript implementation of ``some_expression`` using a
``ColumnDataSource`` as input.

'''

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
from math import inf

# Bokeh imports
from ..core.enums import Direction
from ..core.has_props import abstract
from ..core.properties import (
    AngleSpec,
    AnyRef,
    Bool,
    Dict,
    Enum,
    Float,
    Instance,
    Nullable,
    NumberSpec,
    Required,
    Seq,
    String,
    field,
)
from ..model import Model

#-----------------------------------------------------------------------------
# Globals and constants
#-----------------------------------------------------------------------------

__all__ = (
    'CumSum',
    'CustomJSExpr',
    'Expression',
    'PolarTransform',
    'Stack',
)

#-----------------------------------------------------------------------------
# General API
#-----------------------------------------------------------------------------

@abstract
class Expression(Model):
    ''' Base class for ``Expression`` models that represent a computation
    to be carried out on the client-side.

    JavaScript implementations should implement the following methods:

    .. code-block

        v_compute(source: ColumnarDataSource): Arrayable {
            # compute and return array of values
        }

    .. note::
        If you wish for results to be cached per source and updated only if
        the source changes, implement ``_v_compute: (source)`` instead.

    '''

    # explicit __init__ to support Init signatures
    def __init__(self, *args, **kwargs) -> None:
        super().__init__(*args, **kwargs)


class CustomJSExpr(Expression):
    ''' Evaluate a JavaScript function/generator.

    .. warning::
        The explicit purpose of this Bokeh Model is to embed *raw JavaScript
        code* for a browser to execute. If any part of the code is derived
        from untrusted user inputs, then you must take appropriate care to
        sanitize the user input prior to passing to Bokeh.

    '''

    # explicit __init__ to support Init signatures
    def __init__(self, *args, **kwargs) -> None:
        super().__init__(*args, **kwargs)

    args = Dict(String, AnyRef, help="""
    A mapping of names to Python objects. In particular those can be bokeh's models.
    These objects are made available to the callback's code snippet as the values of
    named parameters to the callback. There is no need to manually include the data
    source of the associated glyph renderer, as it is available within the scope of
    the code via `this` keyword (e.g. `this.data` will give access to raw data).
    """)

    code = String(default="", help="""
    A snippet of JavaScript code to execute in the browser. The code is made into
    the body of a generator function, and all of of the named objects in ``args``
    are available as parameters that the code can use. One can either return an
    array-like object (array, typed array, nd-array), an iterable (which will
    be converted to an array) or a scalar value (which will be converted into
    an array of an appropriate length), or alternatively yield values that will
    be collected into an array.
    """)


class CumSum(Expression):
    ''' An expression for generating arrays by cumulatively summing a single
    column from a ``ColumnDataSource``.

    '''

    # explicit __init__ to support Init signatures
    def __init__(self, *args, **kwargs) -> None:
        super().__init__(*args, **kwargs)

    field = Required(String, help="""
    The name of a ``ColumnDataSource`` column to cumulatively sum for new values.
    """)

    include_zero = Bool(default=False, help="""
    Whether to include zero at the start of the result. Note that the length
    of the result is always the same as the input column. Therefore if this
    property is True, then the last value of the column will not be included
    in the sum.

    .. code-block:: python

        source = ColumnDataSource(data=dict(foo=[1, 2, 3, 4]))

        CumSum(field='foo')
        # -> [1, 3, 6, 10]

        CumSum(field='foo', include_zero=True)
        # -> [0, 1, 3, 6]

    """)


class Stack(Expression):
    ''' An expression for generating arrays by summing different columns from
    a ``ColumnDataSource``.

    This expression is useful for implementing stacked bar charts at a low
    level.

    '''

    # explicit __init__ to support Init signatures
    def __init__(self, *args, **kwargs) -> None:
        super().__init__(*args, **kwargs)

    fields = Seq(String, default=[], help="""
    A sequence of fields from a ``ColumnDataSource`` to sum (elementwise). For
    example:

    .. code-block:: python

        Stack(fields=['sales', 'marketing'])

    Will compute an array of values (in the browser) by adding the elements
    of the ``'sales'`` and ``'marketing'`` columns of a data source.
    """)


@abstract
class ScalarExpression(Model):
    """ Base class for for scalar expressions. """

    # explicit __init__ to support Init signatures
    def __init__(self, *args, **kwargs) -> None:
        super().__init__(*args, **kwargs)


class Minimum(ScalarExpression):
    """ Computes minimum value of a data source's column. """

    # explicit __init__ to support Init signatures
    def __init__(self, *args, **kwargs) -> None:
        super().__init__(*args, **kwargs)

    field = Required(String)
    initial = Nullable(Float, default=inf)


class Maximum(ScalarExpression):
    """ Computes maximum value of a data source's column. """

    # explicit __init__ to support Init signatures
    def __init__(self, *args, **kwargs) -> None:
        super().__init__(*args, **kwargs)

    field = Required(String)
    initial = Nullable(Float, default=-inf)


@abstract
class CoordinateTransform(Expression):
    """ Base class for coordinate transforms. """

    # explicit __init__ to support Init signatures
    def __init__(self, *args, **kwargs) -> None:
        super().__init__(*args, **kwargs)

    @property
    def x(self):
        return XComponent(transform=self)

    @property
    def y(self):
        return YComponent(transform=self)


class PolarTransform(CoordinateTransform):
    """ Transform from polar to cartesian coordinates. """

    # explicit __init__ to support Init signatures
    def __init__(self, *args, **kwargs) -> None:
        super().__init__(*args, **kwargs)

    radius = NumberSpec(default=field("radius"), help="""
    The radial coordinate (i.e. the distance from the origin).

    Negative radius is allowed, which is equivalent to using positive radius
    and changing ``direction`` to the opposite value.
    """)

    angle = AngleSpec(default=field("angle"), help="""
    The angular coordinate (i.e. the angle from the reference axis).
    """)

    direction = Enum(Direction, default=Direction.anticlock, help="""
    Whether ``angle`` measures clockwise or anti-clockwise from the reference axis.
    """)


@abstract
class XYComponent(Expression):
    """ Base class for bi-variate expressions. """

    # explicit __init__ to support Init signatures
    def __init__(self, *args, **kwargs) -> None:
        super().__init__(*args, **kwargs)

    transform = Instance(CoordinateTransform)


class XComponent(XYComponent):
    """ X-component of a coordinate system transform to cartesian coordinates. """

    # explicit __init__ to support Init signatures
    def __init__(self, *args, **kwargs) -> None:
        super().__init__(*args, **kwargs)


class YComponent(XYComponent):
    """ Y-component of a coordinate system transform to cartesian coordinates. """

    # explicit __init__ to support Init signatures
    def __init__(self, *args, **kwargs) -> None:
        super().__init__(*args, **kwargs)


#-----------------------------------------------------------------------------
# Dev API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Private API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Code
#-----------------------------------------------------------------------------
