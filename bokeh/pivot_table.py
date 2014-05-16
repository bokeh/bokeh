from pandas import Series, DataFrame
from pandas.core.index import MultiIndex
from pandas.tools.merge import concat
from pandas.tools.util import cartesian_product
from pandas.compat import range, lrange, zip
from pandas import compat
import numpy as np
from six import string_types, iteritems

_aggregates = {
    "count": len,
    "counta": np.count_nonzero,
    "countunique": lambda arr: len(np.unique(arr)),
    "average": np.average,
    "max": np.max,
    "min": np.min,
    "median": np.median,
    "sum": np.sum,
    "product": np.product,
    "stdev": np.std,
    "var": np.var,
}

def pivot_table(data, values=[], rows=[], cols=[], aggfunc=None, fill_value=0):
    """
    Create a spreadsheet-style pivot table as a DataFrame. The levels in the
    pivot table will be stored in MultiIndex objects (hierarchical indexes) on
    the index and columns of the result DataFrame

    Parameters
    ----------
    data : DataFrame
    values : column to aggregate, optional
    rows : list of column names or arrays to group on
        Keys to group on the x-axis of the pivot table
    cols : list of column names or arrays to group on
        Keys to group on the y-axis of the pivot table
    aggfunc : function, default numpy.mean, or list of functions
        If list of functions passed, the resulting pivot table will have
        hierarchical columns whose top level are the function names (inferred
        from the function objects themselves)
    fill_value : scalar, default None
        Value to replace missing values with
    margins : boolean, default False
        Add all row / columns (e.g. for subtotal / grand totals)

    Examples
    --------
    >>> df
       A   B   C      D
    0  foo one small  1
    1  foo one large  2
    2  foo one large  2
    3  foo two small  3
    4  foo two small  3
    5  bar one large  4
    6  bar one small  5
    7  bar two small  6
    8  bar two large  7

    >>> table = pivot_table(df, values='D', rows=['A', 'B'],
    ...                     cols=['C'], aggfunc=np.sum)
    >>> table
              small  large
    foo  one  1      4
         two  6      NaN
    bar  one  5      4
         two  6      7

    Returns
    -------
    table : DataFrame
    """
    assert len(values) <= 1

    rows = _convert_by(rows)
    cols = _convert_by(cols)
    keys = rows + cols

    if aggfunc is None:
        aggfunc = len
    elif isinstance(aggfunc, string_types):
        aggfunc = _aggregates[aggfunc]

    to_filter = []

    for x in keys + values:
        try:
            if x in data:
                to_filter.append(x)
        except TypeError:
            pass

    if len(to_filter) < len(data.columns):
        data = data[to_filter]

    grouped = data.groupby(keys)
    agged = grouped.agg(aggfunc)

    if agged.index.nlevels > 1:
        to_unstack = [ agged.index.names[i] for i in range(len(rows), len(keys)) ]
        table = agged.unstack(to_unstack)
    else:
        table = agged

    if isinstance(table, DataFrame):
        if isinstance(table.columns, MultiIndex):
            table = table.sortlevel(axis=1)
        else:
            table = table.sort_index(axis=1)

    if fill_value is not None:
        table = table.fillna(value=fill_value, downcast='infer')

    table = _add_margins(table, data, values, rows=rows, cols=cols, aggfunc=aggfunc)

    if rows and cols:
        pass
    elif rows:
        pass
    elif cols:
        pass
    else:
        pass

    if len(rows) == 0 and len(cols) > 0:
        table = table.T

    return table

def _add_margins(table, data, values, rows, cols, aggfunc):
    grand_margin = _compute_grand_margin(data, values, aggfunc)

    if not values and isinstance(table, Series):
        # If there are no values and the table is a series, then there is only
        # one column in the data. Compute grand margin and return it.
        row_key = ('All',) + ('',) * (len(rows) - 1) if len(rows) > 1 else 'All'
        return table.append(Series({row_key: grand_margin['All']}))

    if values:
        marginal_result_set = _generate_marginal_results(table, data, values, rows, cols, aggfunc, grand_margin)
        if not isinstance(marginal_result_set, tuple):
            return marginal_result_set
        result, margin_keys, row_margin = marginal_result_set
    else:
        marginal_result_set = _generate_marginal_results_without_values(table, data, rows, cols, aggfunc)
        if not isinstance(marginal_result_set, tuple):
            return marginal_result_set
        result, margin_keys, row_margin = marginal_result_set

    key = ('All',) + ('',) * (len(rows) - 1) if len(rows) > 1 else 'All'

    row_margin = row_margin.reindex(result.columns)
    # populate grand margin
    for k in margin_keys:
        if isinstance(k, compat.string_types):
            row_margin[k] = grand_margin[k]
        else:
            row_margin[k] = grand_margin[k[0]]

    margin_dummy = DataFrame(row_margin, columns=[key]).T

    row_names = result.index.names
    result = result.append(margin_dummy)
    result.index.names = row_names

    return result

def _compute_grand_margin(data, values, aggfunc):
    if values:
        grand_margin = {}
        for k, v in iteritems(data[values]):
            try:
                if isinstance(aggfunc, compat.string_types):
                    grand_margin[k] = getattr(v, aggfunc)()
                else:
                    grand_margin[k] = aggfunc(v)
            except TypeError:
                pass
        return grand_margin
    else:
        return {'All': aggfunc(data.index)}

def _generate_marginal_results(table, data, values, rows, cols, aggfunc, grand_margin):
    if len(cols) > 0:
        # need to "interleave" the margins
        table_pieces = []
        margin_keys = []

        def _all_key(key):
            return (key, 'All') + ('',) * (len(cols) - 1)

        if len(rows) > 0:
            margin = data[rows + values].groupby(rows).agg(aggfunc)
            cat_axis = 1
            for key, piece in table.groupby(level=0, axis=cat_axis):
                all_key = _all_key(key)
                piece[all_key] = margin[key]
                table_pieces.append(piece)
                margin_keys.append(all_key)
        else:
            margin = grand_margin
            cat_axis = 0
            for key, piece in table.groupby(level=0, axis=cat_axis):
                all_key = _all_key(key)
                table_pieces.append(piece)
                table_pieces.append(Series(margin[key], index=[all_key]))
                margin_keys.append(all_key)

        result = concat(table_pieces, axis=cat_axis)

        if len(rows) == 0:
            return result
    else:
        result = table
        margin_keys = table.columns

    if len(cols) > 0:
        row_margin = data[cols + values].groupby(cols).agg(aggfunc)
        row_margin = row_margin.stack()

        # slight hack
        new_order = [len(cols)] + lrange(len(cols))
        row_margin.index = row_margin.index.reorder_levels(new_order)
    else:
        row_margin = Series(np.nan, index=result.columns)

    return result, margin_keys, row_margin

def _generate_marginal_results_without_values(table, data, rows, cols, aggfunc):
    if len(cols) > 0:
        # need to "interleave" the margins
        margin_keys = []

        def _all_key():
            if len(cols) == 1:
                return 'All'
            return ('All', ) + ('', ) * (len(cols) - 1)

        if len(rows) > 0:
            margin = data[rows].groupby(rows).apply(aggfunc)
            all_key = _all_key()
            table[all_key] = margin
            result = table
            margin_keys.append(all_key)

        else:
            margin = data.groupby(level=0, axis=0).apply(aggfunc)
            all_key = _all_key()
            table[all_key] = margin
            result = table
            margin_keys.append(all_key)
            return result
    else:
        result = table
        margin_keys = table.columns

    if len(cols):
        row_margin = data[cols].groupby(cols).apply(aggfunc)
    else:
        row_margin = Series(np.nan, index=result.columns)

    return result, margin_keys, row_margin

def _convert_by(by):
    if by is None:
        by = []
    elif (np.isscalar(by) or isinstance(by, (np.ndarray, Series))
          or hasattr(by, '__call__')):
        by = [by]
    else:
        by = list(by)
    return by
