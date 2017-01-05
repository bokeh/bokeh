'''

'''
from __future__ import absolute_import

from ..core.enums import StepMode, JitterRandomDistribution
from ..core.properties import abstract
from ..core.properties import Either, Enum, Float, Instance, Seq, String, Bool
from ..model import Model
from .sources import ColumnarDataSource

@abstract
class Transform(Model):
    ''' Base class for ``Transform`` models that represent a computation
    to be carried out on the client-side.

    JavaScript implementations should implement the following methods:

    .. code-block: coffeescript

        compute: (x) ->
            # compute the transform of a single value

        v_compute: (xs) ->
            # compute the transform of an array of values

    '''
    pass


class Jitter(Transform):
    ''' Apply either a uniform or normally sampled random jitter to data.

    '''


    mean = Float(default=0, help="""
    The central value for the random sample
    """)

    width = Float(default=1, help="""
    The width (absolute for uniform distribution and sigma for the normal distribution) of the random sample.
    """)

    distribution = Enum(JitterRandomDistribution, default='uniform', help="""
    The random distribution upon which to pull the random scatter
    """)

@abstract
class Interpolator(Transform):
    ''' Base class for interpolator transforms.

    Interpolators return the value of a function which has been evaluated
    between specified (x, y) pairs of data.  As an example, if two control
    point pairs were provided to the interpolator, a linear interpolaction
    at a specific value of 'x' would result in the value of 'y' which existed
    on the line conneting the two control points.

    The control point pairs for the interpolators can be specified through either

    * A literal sequence of values:

    .. code-block: python

        interp = Interpolator(x=[1, 2, 3, 4, 5], y=[2, 5, 10, 12, 16])

    * or a pair of columns defined in a `ColumnDataSource` object:

    .. code-block: python

        interp = Interpolator(x="year", y="earnings", data=jewlery_prices))


    This is the base class and is not intended to end use.  Please see the
    documentation for the final derived classes (Jitter, LineraInterpolator,
    StepInterpolator) for mor information on their specific methods of
    interpolation.
    '''
    x = Either(String, Seq(Float), help="""
    Independant coordiante denoting the location of a point.
    """)

    y = Either(String, Seq(Float), help="""
    Dependant coordinate denoting the value of a point at a location.
    """)

    data = Instance(ColumnarDataSource, help="""
    Data which defines the source for the named columns if a string is passed to either the ``x`` or ``y`` parameters.
    """)

    clip = Bool(True, help="""
    Determine if the interpolation should clip the result to include only values inside its predefined range.
    If this is set to False, it will return the most value of the closest point.
    """)

    # Define an initialization routine to do some cross checking of input values
    def __init__(self, **kwargs):
        super(Interpolator, self).__init__(**kwargs)


class LinearInterpolator(Interpolator):
    ''' Compute a linear interpolation between the control points provided throught the ``x``, ``y``, and ``data`` parameters.

    '''
    pass


class StepInterpolator(Interpolator):
    ''' Compute a step-wise interpolation between the points provided throught the ``x``, ``y``, and ``data`` parameters.

    '''

    mode = Enum(StepMode, default="after", help="""
    Adjust the behavior of the returned value in relation to the control points.  The parameter can assume one of three values:

    * ``after`` (default): Assume the y-value associated with the nearest x-value which is less than or equal to the point to transform.
    * ``before``: Assume the y-value associated with the nearest x-value which is greater than the point to transform.
    * ``center``: Assume the y-value associated with the nearest x-value to the point to transform.
    """)
