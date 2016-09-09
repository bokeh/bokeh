import pandas as pd

from bokeh.io import show, curdoc
from bokeh.layouts import layout
from bokeh.models import ColumnDataSource, FactorRange
from bokeh.plotting import figure
from bokeh.sampledata.degrees import data
from bokeh.themes import Theme

data = data.set_index('Year')
categories = data.columns.tolist()
categories.reverse()

curdoc().theme = Theme(json={'attrs': {
    'Figure': {
        'toolbar_location': None,
        'outline_line_color': None,
        'min_border_right': 10,
    },
    'Axis': {
        'major_tick_in': None,
        'minor_tick_out': None,
        'minor_tick_in': None,
        'axis_line_color': '#CAC6B6',
        'major_tick_line_color': '#CAC6B6',
    },
    'Legend': {
        'background_fill_alpha': 0.8,
    }
}})


def _make_source_for_year(year):
    # Get data out of dataframe for a given year
    year_df = pd.DataFrame(data.loc[year]).reset_index()
    year_df = year_df.rename(columns={year: 'percent_female', 'index': 'category'})
    source = ColumnDataSource(year_df)
    return source


def all_for_year(year):
    source = _make_source_for_year(year)
    bar_opts = dict(y='category', height=0.5)
    p = figure(title=str(year), y_range=FactorRange(factors=categories), x_range=(0, 100), tools='')
    p.grid.grid_line_color = None
    p.hbar(left=0, right='percent_female', color='#AE9E59', legend='Female', source=source, **bar_opts)
    p.hbar(left='percent_female', right=100, color='#CAC6B6', legend='Male', source=source, **bar_opts)
    return p


def two_categories_over_time():
    bar_opts = dict(width=0.3, alpha=0.8)
    p = figure(title="Percentage of women graduating over time in two fields.", y_range=(0, 100), tools='')
    p.vbar(bottom=0, top=data['Psychology'], x=data.index - 0.2, color='#4F4478', legend='Psychology', **bar_opts)
    p.vbar(bottom=0, top=data['Engineering'], x=data.index + 0.2, color='#827F8B', legend='Engineering', **bar_opts)
    return p

l = layout([
    [all_for_year(1970), all_for_year(2010)],
    [two_categories_over_time()],
], sizing_mode='stretch_both')
show(l)
