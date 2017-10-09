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

    Note that the result of this call will be automatically saved and re-used
    for each ``source`` that is passed in. If a ``source`` is changed, then
    the saved value for that source is discarded, and the next call will
    re-compute (and save) a new value. If you wish to prevent this caching, you
    may implement ``_v_compute: (source)`` instead.

    '''
    pass

class Stack(Expression):
    ''' An expression for generating arrays by summing different columns from
    a ``ColumnDataSource``.

    This expression is useful for implementing stacked bar charts at a low
    level.

    '''

    fields = Seq(String, default=[], help="""
    A sequence of fields from a ``ColumnDataSource`` to sum (elementwise). For
    example:

    .. code-block:: python

        Stack(fields=['sales', 'marketing'])

    Will compute an array of values (in the browser) by adding the elements
    of the ``'sales'`` and ``'marketing'`` columns of a data source.
    """)
