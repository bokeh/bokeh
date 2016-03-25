'''

'''
from __future__ import absolute_import

from ..core.enums import StepMode, JitterRandomDistribution
from ..core.properties import abstract
from ..core.properties import Either, Enum, Float, Instance, Seq, String, Tuple
from ..model import Model
from .sources import ColumnDataSource

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

    Interpolators are configured with ``values`` which can either be:

    * A literal sequence of values:

    .. code-block: python

        interp = Interpolator(x=[1, 2, 3, 4, 5], y=[2, 5, 10, 12, 16])

    * or a pair of columns defined in a `ColumnDataSource` object:

    .. code-block: python

        interp = Interpolator(x="year", y="earnings", data=jewlery_prices))

    '''
    x = Either(String, Seq(Float), help="""
    Independant coordiante denoting the location of a point.
    """)

    y = Either(String, Seq(Float), help="""
    Dependant coordinate denoting the value of a point at a location.
    """)

    data = Instance(ColumnDataSource, help="""
    Data which defines the source for the named columns if a string is passed to either the `x` or `y` parameters.
    """)

    # Define an initialization routine to do some cross checking of input values
    def __init__(self, palette=None, **kwargs):
        super(Interpolator, self).__init__(**kwargs)


class LinearInterpolator(Interpolator):
    ''' Compute a linear interpolation between the points given by ``values``.

    '''
    pass


class StepInterpolator(Interpolator):
    ''' Compute a step-wise interpolation between the points given
    by ``values``.

    '''

    mode = Enum(StepMode, default="after", help="""

    """)
