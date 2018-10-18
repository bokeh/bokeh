'''

'''
from __future__ import absolute_import

from ..core.has_props import abstract
from ..core.properties import String
from .transforms import Transform

@abstract
class Scale(Transform):
    ''' Base class for ``Scale`` models that represent an invertible
    computation to be carried out on the client-side.

    JavaScript implementations should implement the following methods:

    .. code-block: coffeescript

        compute: (x) ->
            # compute the transform of a single value

        v_compute: (xs) ->
            # compute the transform of an array of values

        invert: (xprime) ->
            # compute the inverse transform of a single value

        v_invert: (xprimes) ->
            # compute the inverse transform of an array of values

    '''
    pass

class LinearScale(Scale):
    '''

    '''
    pass

class LogScale(Scale):
    '''

    '''

    log_type = String(help="""
    An optional value specifying the type of log. Value values are:

        log (default value)
        log1p

    """)
    def __init__(self, *arg, **kw):
        print(" in LogScale __init__:", kw)
        super(LogScale, self).__init__(*arg, **kw)
        if "log_type" in kw:
            self.log_type = kw['log_type']
        else:
            self.log_type = 'log'

class CategoricalScale(LinearScale):
    '''

    '''
    pass
