'''

'''
from __future__ import absolute_import

from ..core.enums import StepMode
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
    ''' Apply uniformly sampled random jitter to data.

    '''

    interval = Float(default=0.8, help="""
    The width of the random sample interval to use for jitter.
    """)


@abstract
class Interpolator(Transform):
    ''' Base class for interpolator transforms.

    Interpolators are configured with ``values`` which can either be:

    * A literal sequence of values:

    .. code-block: python

        interp = Interpolator(y=[2, 5, 10, 12, 16])

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


class LogInterpolator(Interpolator):
    ''' Compute a log interpolation between the points given by ``values``.

    '''
    base = Float(default=10, help="""
    Base value for the logorithm.  For example, if base = 10, then that would imply log_10.
    """)
    pass


class StepInterpolator(Interpolator):
    ''' Compute a step-wise interpolation between the points given
    by ``values``.

    '''

    mode = Enum(StepMode, default="after", help="""

    """)
