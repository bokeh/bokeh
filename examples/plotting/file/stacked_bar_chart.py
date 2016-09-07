import pandas as pd

from bokeh.io import show
from bokeh.layouts import gridplot
from bokeh.layouts import column
from bokeh.models import ColumnDataSource, FactorRange
from bokeh.plotting import figure
from bokeh.sampledata.degrees import data

data = data.set_index('Year')
categories = data.columns.tolist()
categories.reverse()

# Make a small multiples gridplot of degrees by gender


plot_opts = dict(y_range=FactorRange(factors=categories), x_range=(0, 100), tools='',)

def make_source(year):
    # Get data out of dataframe for a given year
    year_df = pd.DataFrame(data.loc[year]).reset_index()
    year_df = year_df.rename(columns={year: 'percent_female', 'index': 'category'})
    source = ColumnDataSource(year_df)
    return source

def make_chart_for_year(year):
    p = figure(title=str(year), **plot_opts)
    source = make_source(year)
    p.hbar(left=0, right='percent_female', y='category', source=source, height=0.8, color='goldenrod', legend='Female')
    p.hbar(left='percent_female', right=100, y='category', source=source, height=0.8, color='darkolivegreen', legend='Male')
    return p

plots = [make_chart_for_year(year) for year in [1970, 2010]]
show(gridplot(plots, ncols=1, plot_height=400, toolbar_location=None))
