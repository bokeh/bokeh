from __future__ import absolute_import

from ..core.properties import Bool, Either, Int, Seq, String
from ..model import Model

class Filter(Model):
    ''' A Filter model represents a filtering operation that returns a row-wise subset of
    data when applied to a ColumnDataSource.
    '''

    filter = Either(Seq(Int), Seq(Bool), default=[])

class IndexFilter(Filter):
    ''' An IndexFilter filters data by returning the subset of data at a given set of indices.
    '''

    indices = Seq(Int, default=[])

class BooleanFilter(Filter):
    ''' A BooleanFilter filters data by returning the subset of data corresponding to indices
    where the values of the booleans array is True.
    '''

    booleans = Seq(Bool, default=[])

class GroupFilter(Filter):
    ''' A GroupFilter represents the rows of a ColumnDataSource where the values of the categorical
    column column_name match the group variable.
    '''

    column_name = String()

    group = String()
