#-----------------------------------------------------------------------------
# Copyright (c) 2012 - 2020, Anaconda, Inc., and Bokeh Contributors.
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
import logging # isort:skip
log = logging.getLogger(__name__)

#-----------------------------------------------------------------------------
# Imports
#-----------------------------------------------------------------------------

# Bokeh imports
from ..core.has_props import abstract
from ..core.properties import Bool, Seq, String
from ..model import Model

#-----------------------------------------------------------------------------
# Globals and constants
#-----------------------------------------------------------------------------

__all__ = (
    'CumSum',
    'Expression',
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
    pass

class CumSum(Expression):
    ''' An expression for generating arrays by cumulatively summing a single
    column from a ``ColumnDataSource``.

    '''

    field = String(help="""
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

    fields = Seq(String, default=[], help="""
    A sequence of fields from a ``ColumnDataSource`` to sum (elementwise). For
    example:

    .. code-block:: python

        Stack(fields=['sales', 'marketing'])

    Will compute an array of values (in the browser) by adding the elements
    of the ``'sales'`` and ``'marketing'`` columns of a data source.
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
