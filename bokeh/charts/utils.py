''' This is the utils module that collects convenience functions and code that are
useful for charts ecosystem.

'''
from __future__ import absolute_import, division, print_function

from collections import OrderedDict, defaultdict
from copy import copy
import itertools
import json
from math import cos, sin

from colorsys import hsv_to_rgb
import pandas as pd
from pandas.io.json import json_normalize
import numpy as np
from six import iteritems

from bokeh.models.glyphs import (
    Asterisk, Circle, CircleCross, CircleX, Cross, Diamond, DiamondCross,
    InvertedTriangle, Square, SquareCross, SquareX, Triangle, X
)
from bokeh.plotting.helpers import DEFAULT_PALETTE
from bokeh.models.sources import ColumnDataSource

DEFAULT_COLUMN_NAMES = 'abcdefghijklmnopqrstuvwxyz'


# map between distinct set of marker names and marker classes
marker_types = OrderedDict(
    [
        ("circle", Circle),
        ("square", Square),
        ("triangle", Triangle),
        ("diamond", Diamond),
        ("inverted_triangle", InvertedTriangle),
        ("asterisk", Asterisk),
        ("cross", Cross),
        ("x", X),
        ("circle_cross", CircleCross),
        ("circle_x", CircleX),
        ("square_x", SquareX),
        ("square_cross", SquareCross),
        ("diamond_cross", DiamondCross),
    ]
)


def take(n, iterable):
    """Return first n items of the iterable as a list."""
    return itertools.islice(iterable, n)


def cycle_colors(chunk, palette=DEFAULT_PALETTE):
    """ Build a color list just cycling through a given palette.

    Args:
        chuck (seq): the chunk of elements to generate the color list
        palette (seq[color]) : a palette of colors to cycle through

    Returns:
        colors

    """
    colors = []

    g = itertools.cycle(palette)
    for i in range(len(chunk)):
        colors.append(next(g))

    return colors


def polar_to_cartesian(r, start_angles, end_angles):
    """Translate polar coordinates to cartesian.

    Args:
    r (float): radial coordinate
    start_angles (list(float)): list of start angles
    end_angles (list(float)): list of end_angles angles

    Returns:
        x, y points
    """
    cartesian = lambda r, alpha: (r*cos(alpha), r*sin(alpha))
    points = []

    for r, start, end in zip(r, start_angles, end_angles):
        points.append(cartesian(r, (end + start)/2))

    return zip(*points)

def ordered_set(iterable):
    """Creates an ordered list from strings, tuples or other hashable items.

    Returns:
        list of unique and ordered values
    """

    mmap = {}
    ord_set = []

    for item in iterable:
        # Save unique items in input order
        if item not in mmap:
            mmap[item] = 1
            ord_set.append(item)
    return ord_set


def collect_attribute_columns(**specs):
    """Collect list of unique and ordered columns across attribute specifications.

    Args:
        specs (dict): attribute name, :class:`AttrSpec` mapping

    Returns:
        list of columns in order as they appear in attr spec and without duplicates
    """

    # filter down to only the specs with columns assigned to them
    selected_specs = {spec_name: spec for spec_name, spec in iteritems(specs)
                      if spec.columns}

    # all columns used in selections of attribute specifications
    spec_cols = list(itertools.chain.from_iterable([spec.columns
                                                    for spec in selected_specs.values()]))

    # return a list of unique columns in order as they appear
    return ordered_set(spec_cols)


def df_from_json(data, rename=True, **kwargs):
    """Attempt to produce :class:`pandas.DataFrame` from hierarchical json-like data.

    This utility wraps the :func:`pandas.io.json.json_normalize` function and by
    default will try to rename the columns produced by it.

    Args:
        data (str or list(dict) or dict(list(dict))): a path to json data or loaded json
            data. This function will look into the data and try to parse it correctly
            based on common structures of json data.
        rename (bool, optional: try to rename column hierarchy to the base name. So
            medals.bronze would end up being bronze. This will only rename to the base
            column name if the name is unique, and only if the pandas json parser
            produced columns that have a '.' in the column name.
        **kwargs: any kwarg supported by :func:`pandas.io.json.json_normalize`

    Returns:
        a parsed pandas dataframe from the json data, unless the path does not exist,
            the input data is nether a list or dict. In that case, it will return `None`.
    """
    parsed = None
    if isinstance(data, str):
        with open(data) as data_file:
            data = json.load(data_file)

    if isinstance(data, list):
        parsed = json_normalize(data)

    elif isinstance(data, dict):
        for k, v in iteritems(data):
            if isinstance(v, list):
                parsed = json_normalize(v)

    # try to rename the columns if configured to
    if rename and parsed is not None:
        parsed = denormalize_column_names(parsed)

    return parsed


def denormalize_column_names(parsed_data):
    """Attempts to remove the column hierarchy if possible when parsing from json.

    Args:
        parsed_data (:class:`pandas.DataFrame`): df parsed from json data using
            :func:`pandas.io.json.json_normalize`.

    Returns:
        dataframe with updated column names
    """
    cols = parsed_data.columns.tolist()
    base_columns = defaultdict(list)
    for col in cols:
        if '.' in col:
            # get last split of '.' to get primary column name
            base_columns[col].append(col.split('.')[-1])

    rename = {}
    # only rename columns if they don't overlap another base column name
    for col, new_cols in iteritems(base_columns):
        if len(new_cols) == 1:
            rename[col] = new_cols[0]

    if len(list(rename.keys())) > 0:
        return parsed_data.rename(columns=rename)
    else:
        return parsed_data


def get_index(data):
    """A generic function to return the index from values.

    Should be used to abstract away from specific types of data.

    Args:
        data (:class:`pandas.Series`, :class:`pandas.DataFrame`): a data source to
            return or derive an index for.

    Returns:
        a pandas index
    """
    return data.index


def get_unity(data, value=1):
    """Returns a column of ones with the same length as input data.

    Useful for charts that need this special data type when no input is provided
    for one of the dimensions.

    Args:
        data (:class:`pandas.DataFrame`): the data to add constant column to.
        value (str, int, object): a valid value for a dataframe, used as constant value
            for each row.

    Returns:
        a copy of `data` with a column of '_charts_ones' added to it
    """
    data_copy = data.copy()
    data_copy['_charts_ones'] = value
    return data_copy['_charts_ones']


special_columns = {'index': get_index,
                   'unity': get_unity}


def title_from_columns(cols):
    """Creates standard string representation of columns.

    If cols is None, then None is returned.
    """
    if cols is not None:
        cols_title = copy(cols)
        if not isinstance(cols_title, list):
            cols_title = [cols_title]
        return str(', '.join(cols_title).title()).title()
    else:
        return None


def gen_column_names(n):
    """Produces list of unique column names of length n.

    Args:
        n (int): count of column names to provide

    Returns:
        list(str) of length `n`
    """
    col_names = list(DEFAULT_COLUMN_NAMES)

    # a-z
    if n < len(col_names):
        return list(take(n, col_names))
    # a-z and aa-zz (500+ columns)
    else:
        n_left = n - len(col_names)
        labels = [''.join(item) for item in
                  take(n_left, itertools.product(DEFAULT_COLUMN_NAMES,
                                                 DEFAULT_COLUMN_NAMES))]
        col_names.extend(labels)
        return col_names


def generate_patch_base(x, y, base=0.0):
    """ Adds base to the start and end of y, and extends x to match the length.

    Args:
        x (`pandas.Series`): x values for the area chart
        y (`pandas.Series`): y values for the area chart
        base (float): the flat side of the area glyph

    Returns:
        x, y: tuple containing padded x and y as `numpy.ndarray`
    """
    x = x.values
    y = y.values

    # add base of area by starting and ending at base
    y0 = np.insert(y, 0, base)
    y0 = np.append(y0, base)

    # make sure y is same length as x
    x0 = np.insert(x, 0, x[0])
    x0 = np.append(x0, x0[-1])

    return x0, y0


class ChartHelp(object):
    """Builds, formats, and displays help for the chart function"""
    def __init__(self, *builders):
        self.builders = builders

    def __repr__(self):
        help_str = ''
        for builder in self.builders:
            help_str += builder.generate_help()

        return help_str


def help(*builders):
    """Adds a ChartHelp object to the help attribute of the function."""
    def add_help(f):
        f.help = ChartHelp(*builders)
        return f

    return add_help


def derive_aggregation(dim_cols, agg_col, agg):
    """Produces consistent aggregation spec from optional column specification.

    This utility provides some consistency to the flexible inputs that can be provided
    to charts, such as not specifying dimensions to aggregate on, not specifying an
    aggregation, and/or not specifying a column to aggregate on.
    """
    if dim_cols == 'index' or agg_col == 'index' or dim_cols is None:
        agg = None
        agg_col = None
    elif agg_col is None:
        if isinstance(dim_cols, list):
            agg_col = dim_cols[0]
        else:
            agg_col = dim_cols
        agg = 'count'

    return agg_col, agg


def build_wedge_source(df, cat_cols, agg_col=None, agg='mean', level_width=0.5,
                       level_spacing=0.01):
    df = cat_to_polar(df, cat_cols, agg_col, agg, level_width)

    add_wedge_spacing(df, level_spacing)
    df['centers'] = df['outers'] - (df['outers'] - df['inners']) / 2.0

    # scale level 0 text position towards outside of wedge if center is not a donut
    if not isinstance(level_spacing, list):
        df.ix[df['level'] == 0, 'centers'] *= 1.5

    return df


def shift_series(s):
    """Produces a copy of the provided series shifted by one, starting with 0."""
    s0 = s.copy()
    s0 = s0.shift(1)
    s0.iloc[0] = 0.0
    return s0


def _create_start_end(levels):
    """Produces wedge start and end values from list of dataframes for each level.

    Returns:
        start, end: two series describing starting and ending angles in radians

    """
    rads = levels[0].copy()
    for level in levels[1:]:
        rads = rads * level

    rads *= (2 * np.pi)

    end = rads.cumsum()
    start = shift_series(end)

    return start, end


def cat_to_polar(df, cat_cols, agg_col=None, agg='mean', level_width=0.5):
    """Return start and end angles for each index in series.

    Returns:
        df: a `pandas.DataFrame` describing each aggregated wedge

    """

    agg_col, agg = derive_aggregation(cat_cols, agg_col, agg)

    def calc_span_proportion(data):
        """How much of the circle should be assigned."""
        return data/data.sum()

    # group by each level
    levels_cols = []
    starts = []
    ends = []
    levels = []
    agg_values = []

    for i in range(0, len(cat_cols)):
        level_cols = cat_cols[:i+1]

        if agg_col is not None and agg is not None:
            gb = getattr(getattr(df.groupby(level_cols), agg_col), agg)()
        else:
            cols = [col for col in df.columns if col != 'index']
            gb = df[cols[0]]

        # lower than top level, need to groupby next to lowest level
        group_level = i - 1
        if group_level >= 0:
            levels.append(gb.groupby(level=group_level).apply(calc_span_proportion))
        else:
            levels.append(calc_span_proportion(gb))

        start_ends = _create_start_end(levels)
        starts.append(start_ends[0])
        ends.append(start_ends[1])
        agg_values.append(gb)

        # build array of constant value representing the level
        this_level = start_ends[0].copy()
        this_level[:] = i
        levels_cols.append(this_level)

    df = pd.DataFrame({'start': pd.concat(starts),
                       'end': pd.concat(ends),
                       'level': pd.concat(levels_cols),
                       'values': pd.concat(agg_values)})

    if len(cat_cols) > 1:
        idx = df.index.copy().values

        for i, val in enumerate(df.index):
            if not isinstance(val, tuple):
                val = (val, '')
            idx[i] = val

        df.index = pd.MultiIndex.from_tuples(idx)
        df.index.names = cat_cols

        # sort the index to avoid performance warning (might alter chart)
        df.sortlevel(inplace=True)

    inners, outers = calc_wedge_bounds(df['level'], level_width)
    df['inners'] = inners
    df['outers'] = outers

    return df


def add_text_label_from_index(df):
    """Add column for text label, based on level-oriented index.

    This is used for the donut chart, where there is a hierarchy of categories,
    which are separated and encoded into the index of the data. If there are
    3 levels (columns) used, then a 3 level multi-index is used. Level 0 will
    have each of the values of the first column, then NaNs for the next two. The
    last non-empty level is used for the label of that row.
    """
    text = []
    for idx in df.index:

        row_text = ''

        if isinstance(idx, tuple):
            # the lowest, non-empty index is the label
            for lev in reversed(idx):
                if lev is not '' and row_text == '':
                    row_text = str(lev)
        else:
            row_text = str(idx)

        text.append(row_text)

    df['text'] = text

    return df


def build_wedge_text_source(df, start_col='start', end_col='end',
                            center_col='centers'):
    """Generate `ColumnDataSource` for text representation of donut levels.

    Returns a data source with 3 columns, 'text', 'x', and 'y', where 'text'
    is a derived label from the `~pandas.MultiIndex` provided in `df`.
    """
    x, y = polar_to_cartesian(df[center_col], df[start_col], df[end_col])

    # extract text from the levels in index
    df = add_text_label_from_index(df)
    df['text_angle'] = calc_text_angle(df['start'], df['end'])
    df.ix[df.level == 0, 'text_angle'] = 0.0
    text_source = ColumnDataSource(dict(text=df['text'], x=x, y=y,
                                        text_angle=df['text_angle']))
    return text_source


def calc_text_angle(start, end):
    """Produce a column of text angle values based on the bounds of the wedge."""
    text_angle = (start + end) / 2.0
    shift_angles = ((text_angle > (np.pi / 2)) & (text_angle < (3 * np.pi / 2)))
    text_angle[shift_angles] = text_angle[shift_angles] + np.pi
    return text_angle


def calc_wedge_bounds(levels, level_width):
    """Calculate inner and outer radius bounds of the donut wedge based on levels."""

    # add columns for the inner and outer size of the wedge glyph
    inners = levels * level_width
    outers = inners + level_width

    return inners, outers


def add_wedge_spacing(df, spacing):
    """Add spacing to the `inners` column of the provided data based on level."""

    # add spacing based on input settings
    if isinstance(spacing, list):
        # add spacing for each level given in order received
        for i, space in enumerate(spacing):
            df.ix[df['level'] == i, 'inners'] += space
    else:
        df.ix[df['level'] > 0, 'inners'] += spacing


def build_hover_tooltips(hover_spec=None, chart_cols=None):
    """Produce tooltips for column dimensions used in chart configuration.

    Provides convenience for producing tooltips for data with labeled columns. If you
    had two bars in a bar chart, one for female and one for male, you may also want to
    have the tooltip say "Sex: female" and "Sex: male" when hovering.

    Args:
        hover_spec (bool, list(tuple(str, str), list(str), optional): either can be a
            valid input to the `HoverTool` tooltips kwarg, or a boolean `True` to have
            all dimensions specified in chart be added to the tooltip, or a list of
            columns that you do want to be included in the tooltips.
        chart_cols:

    Returns:
        list(tuple(str, str)): list of tooltips

    """
    if isinstance(hover_spec, bool):
        tooltips = [(col, '@' + col) for col in chart_cols]
    elif isinstance(hover_spec[0], tuple):
        tooltips = hover_spec
    else:
        tooltips = [(col, '@' + col) for col in hover_spec]

    return tooltips


def build_agg_tooltip(hover_text=None, agg_text=None, aggregated_col=None):
    """Produce a consistent tooltip based on available chart configuration.

    Args:
        hover_text (str, optional): the desired label for the value to be shown in the
            tooltip
        agg_text (str, optional): any aggregation text used for the chart
        aggregated_col (str, optional): any column name used for aggregation

    Returns:
        tuple(str, str): a single tooltip

    """
    if hover_text is None:
        if agg_text is None:
            if isinstance(aggregated_col, str):
                hover_text = aggregated_col
            else:
                hover_text = 'value'
        else:
            hover_text = agg_text
            if isinstance(aggregated_col, str):
                hover_text = '%s of %s' % (hover_text, aggregated_col)

    return hover_text.title(), "@values"


def label_from_index_dict(chart_index, include_cols=False):
    """

    Args:
        chart_index (dict(str, any) or str or None): identifier for the data group,
            representing either the value of a column (str), no grouping (None), or a dict
            where each key represents a column, and the value is the unique value.

    Returns:
        str: a derived label representing the chart index value

    """
    if isinstance(chart_index, str):
        return chart_index
    elif chart_index is None:
        return 'None'
    elif isinstance(chart_index, dict):
        if include_cols:
            label = ', '.join(['%s=%s' % (col, val) for col, val in iteritems(
                chart_index)])
        else:
            label = tuple(chart_index.values())
            if len(label) == 1:
                label = label[0]
        return label
    else:
        raise ValueError('chart_index type is not recognized, \
                          received %s' % type(chart_index))


def comp_glyphs_to_df(*comp_glyphs):
    dfs = [glyph.df for glyph in comp_glyphs]
    return pd.concat(dfs)



def color_in_equal_space(hue, saturation=0.55, value=2.3):
    """

    Args:
        hue (int or double): a numerical value that you want to assign a color

    Returns:
        str: hexadecimal color value to a given number

    """
    golden_ratio = (1 + 5 ** 0.5) / 2
    hue += golden_ratio
    hue %= 1
    return '#{:02X}{:02X}{:02X}'.format(*tuple(int(a*100) for a in hsv_to_rgb(hue, saturation, value)))


def add_tooltips_columns(renderer, tooltips, group):
    """

    Args:
        renderer (GlyphRenderer): renderer for the glyph to be modified.
        tooltips (bool, list(str), list(tuple)): valid tooltips string as
            defined in the builder class.
        group (DataGroup): group of data containing missing columns.

    Returns:
        renderer (GlyphRenderer): renderer with missing columns added

    """
    current_columns = renderer.data_source.data.keys()

    # find columns specified in tooltips
    if isinstance(tooltips[0], tuple):
        tooltips_columns = [pair[1].replace('@', '') for pair in tooltips]
    elif isinstance(tooltips[0], str):
        tooltips_columns = tooltips
    else:
        tooltips_columns = []

    for column in tooltips_columns:

        if column in current_columns:
            continue
        elif '$' in column:
            continue

        renderer.data_source.add(group.get_values(column), column)

    return renderer
