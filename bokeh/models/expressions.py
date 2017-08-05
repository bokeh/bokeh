''' Represent computed array expressions to happen on the client (browser) side

'''
from __future__ import absolute_import

from ..core.has_props import abstract
from ..core.properties import Seq, String
from ..model import Model

@abstract
class Expression(Model):
    ''' Base class for ``Expression`` models that represent a computation
    to be carried out on the client-side.

    JavaScript implementations should implement the following methods:

    .. code-block: coffeescript

        v_compute: (source) ->
            # compute an array of values

    '''
    pass

class Stack(Expression):
    '''

    '''

    fields = Seq(String, help="""

    """)
