#-----------------------------------------------------------------------------
# Copyright (c) 2012 - 2021, Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------
''' Represent transformations of data to happen on the client (browser) side.

'''

#-----------------------------------------------------------------------------
# Boilerplate
#-----------------------------------------------------------------------------
import logging # isort:skip
log = logging.getLogger(__name__)

#-----------------------------------------------------------------------------
# Imports
#-----------------------------------------------------------------------------

# Bokeh imports
from ..core.enums import JitterRandomDistribution, StepMode
from ..core.has_props import abstract
from ..core.properties import (
    AnyRef,
    Bool,
    Dict,
    Either,
    Enum,
    Float,
    Instance,
    NonNullable,
    Nullable,
    Seq,
    String,
)
from ..model import Model
from .sources import ColumnarDataSource

#-----------------------------------------------------------------------------
# Globals and constants
#-----------------------------------------------------------------------------

__all__ = (
    'CustomJSTransform',
    'Dodge',
    'Interpolator',
    'Jitter',
    'LinearInterpolator',
    'StepInterpolator',
    'Transform',
)

#-----------------------------------------------------------------------------
# General API
#-----------------------------------------------------------------------------

@abstract
class Transform(Model):
    ''' Base class for ``Transform`` models that represent a computation
    to be carried out on the client-side.

    JavaScript implementations should implement the following methods:

    .. code-block

        compute(x: number): number {
            # compute and return the transform of a single value
        }

        v_compute(xs: Arrayable<number>): Arrayable<number> {
            # compute and return the transform of an array of values
        }

    '''
    pass


class CustomJSTransform(Transform):
    ''' Apply a custom defined transform to data.

    .. warning::
        The explicit purpose of this Bokeh Model is to embed *raw JavaScript
        code* for a browser to execute. If any part of the code is derived
        from untrusted user inputs, then you must take appropriate care to
        sanitize the user input prior to passing to Bokeh.

    '''

    args = Dict(String, AnyRef, help="""
    A mapping of names to Python objects. In particular those can be bokeh's models.
    These objects are made available to the transform' code snippet as the values of
    named parameters to the callback.
    """)

    func = String(default="", help="""
    A snippet of JavaScript code to transform a single value. The variable
    ``x`` will contain the untransformed value and can be expected to be
    present in the function namespace at render time. The snippet will be
    into the body of a function and therefore requires a return statement.

    Example:

        .. code-block:: javascript

            func = '''
            return Math.floor(x) + 0.5
            '''
    """)

    v_func = String(default="", help="""
    A snippet of JavaScript code to transform an array of values. The variable
    ``xs`` will contain the untransformed array and can be expected to be
    present in the function namespace at render time. The snippet will be
    into the body of a function and therefore requires a return statement.

    Example:

        .. code-block:: javascript

            v_func = '''
            var new_xs = new Array(xs.length)
            for(var i = 0; i < xs.length; i++) {
                new_xs[i] = xs[i] + 0.5
            }
            return new_xs
            '''

    .. warning::
        The vectorized function, ``v_func``, must return an array of the
        same length as the input ``xs`` array.
    """)


class Dodge(Transform):
    ''' Apply either fixed dodge amount to data.

    '''

    value = Float(default=0, help="""
    The amount to dodge the input data.
    """)

    range = Nullable(Instance("bokeh.models.ranges.Range"), help="""
    When applying ``Dodge`` to categorical data values, the corresponding
    ``FactorRange`` must be supplied as the ``range`` property.
    """)


class Jitter(Transform):
    ''' Apply either a uniform or normally sampled random jitter to data.

    '''

    mean = Float(default=0, help="""
    The central value for the random sample
    """)

    width = Float(default=1, help="""
    The width (absolute for uniform distribution and sigma for the normal
    distribution) of the random sample.
    """)

    distribution = Enum(JitterRandomDistribution, default='uniform', help="""
    The random distribution upon which to pull the random scatter
    """)

    range = Nullable(Instance("bokeh.models.ranges.Range"), help="""
    When applying Jitter to Categorical data values, the corresponding
    ``FactorRange`` must be supplied as the ``range`` property.
    """)

@abstract
class Interpolator(Transform):
    ''' Base class for interpolator transforms.

    Interpolators return the value of a function which has been evaluated
    between specified (x, y) pairs of data.  As an example, if two control
    point pairs were provided to the interpolator, a linear interpolaction
    at a specific value of 'x' would result in the value of 'y' which existed
    on the line connecting the two control points.

    The control point pairs for the interpolators can be specified through either

    * A literal sequence of values:

    .. code-block:: python

        interp = Interpolator(x=[1, 2, 3, 4, 5], y=[2, 5, 10, 12, 16])

    * or a pair of columns defined in a ``ColumnDataSource`` object:

    .. code-block:: python

        interp = Interpolator(x="year", y="earnings", data=jewlery_prices))


    This is the base class and is not intended to end use.  Please see the
    documentation for the final derived classes (``Jitter``, ``LineraInterpolator``,
    ``StepInterpolator``) for more information on their specific methods of
    interpolation.

    '''
    x = NonNullable(Either(String, Seq(Float)), help="""
    Independent coordinate denoting the location of a point.
    """)

    y = NonNullable(Either(String, Seq(Float)), help="""
    Dependant coordinate denoting the value of a point at a location.
    """)

    data = Nullable(Instance(ColumnarDataSource), help="""
    Data which defines the source for the named columns if a string is passed to either the ``x`` or ``y`` parameters.
    """)

    clip = Bool(True, help="""
    Determine if the interpolation should clip the result to include only values inside its predefined range.
    If this is set to False, it will return the most value of the closest point.
    """)

    # Define an initialization routine to do some cross checking of input values
    def __init__(self, **kwargs):
        super().__init__(**kwargs)


class LinearInterpolator(Interpolator):
    ''' Compute a linear interpolation between the control points provided through
    the ``x``, ``y``, and ``data`` parameters.

    '''
    pass


class StepInterpolator(Interpolator):
    ''' Compute a step-wise interpolation between the points provided through
    the ``x``, ``y``, and ``data`` parameters.

    '''

    mode = Enum(StepMode, default="after", help="""
    Adjust the behavior of the returned value in relation to the control points.  The parameter can assume one of three values:

    * ``after`` (default): Assume the y-value associated with the nearest x-value which is less than or equal to the point to transform.
    * ``before``: Assume the y-value associated with the nearest x-value which is greater than the point to transform.
    * ``center``: Assume the y-value associated with the nearest x-value to the point to transform.
    """)

#-----------------------------------------------------------------------------
# Dev API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Private API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Code
#-----------------------------------------------------------------------------
