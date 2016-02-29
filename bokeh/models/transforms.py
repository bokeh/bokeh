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

        interp = Interpolator(values=[2, 5, 10, 12, 16])

    Or a tuple ``(data source, column name)`` that specifies a column from
    a `ColumnDataSource` that should be used as the values to interpolate:

    .. code-block: python

        interp = Interpolator(values=(source, "earnings"))

    '''
    pass
#    values = Either(Tuple(Instance(ColumnDataSource, String)), Seq(Float), help="""
#
#    """)


class LinearInterp(Interpolator):
    ''' Compute a linear interpolation between the points given by ``values``.

    '''
    pass


class LogInterp(Interpolator):
    ''' Compute a log interpolation between the points given by ``values``.

    '''
    pass


class StepInterp(Interpolator):
    ''' Compute a step-wise interpolation between the points given
    by ``values``.

    '''

    mode = Enum(StepMode, default="after", help="""

    """)
