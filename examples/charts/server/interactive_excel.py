import xlwings as xw
import pandas as pd
from pandas.util.testing import assert_frame_equal

from bokeh.client import push_session
from bokeh.charts import Line, Bar
from bokeh.charts.operations import blend
from bokeh.io import curdoc
from bokeh.layouts import row, column
from bokeh.models import Paragraph

wb = xw.Workbook()  # Creates a connection with a new workbook
# write example data to notebook
xw.Range('A1').value = pd.DataFrame(
{
    'Italy':[3016.17,3114.73, 3128.31, 3137.38, 3089.51, 3016.32, 2942.62, 2735.05, 2813.51],
    'Japan':[4004.67, 3963.47, 4089.39, 4073.75, 4068.52, 4031.99, 3880.45, 3700.22, 3883.046557],
    'Brazil':[1084.48, 1075.76, 1092.31, 1096.13, 1140.61, 1158.39, 1186.27, 1240.22, 1297.91],
    'USA':[8056.55, 7825.18, 7838.52, 7788.32, 7875.28, 7840.53, 7691.69, 7749.23, 7481.02],
    'year':[2000, 2001, 2002, 2003, 2004, 2005, 2006, 2007, 2008],
})

# read back to make sure we have same data format..
data = xw.Range('A1').table.value
energy_per_capita = pd.DataFrame(data[1:], columns=data[0])
countries = ['Brazil', 'Italy', 'USA', 'Japan']

def create_line(data):
    """ Convenience function to create a new line chart with the right args """
    return Line(data, x='year', y=countries,
                legend=True, width=1400, height=300, ylabel='Energy use per capita',
                palette=['purple', 'green', 'blue', 'pink'])

def create_bar(data):
    op = blend(*countries, labels_name='countries', name='energy')
    return Bar(data, label='year', values=op, color='countries', group='countries',
            width=1400, height=600, ylabel='Energy use per capita',
            palette=['purple', 'green', 'blue', 'pink'],
            legend=True)

def data_changed(old):
    """ Returns a new dataframe if data has changed on the excel workbook """
    data = xw.Range('A1').table.value
    df = pd.DataFrame(data[1:], columns=data[0])

    try:
        assert_frame_equal(df, old)
        return None
    except AssertionError:
        return df

# open a session to keep our local document in sync with server
session = push_session(curdoc())

def update():
    global layout
    global energy_per_capita

    new_df = data_changed(energy_per_capita)
    if new_df is not None:
        energy_per_capita = new_df
        plots_box.children[0] = create_line(energy_per_capita)
        plots_box.children[1] = create_bar(energy_per_capita)

line = create_line(energy_per_capita)
bar = create_bar(energy_per_capita)
desc1 = Paragraph(text="""
This example shows live integration between bokeh server and Excel using
XLWings.""")
desc2 = Paragraph(text="""
*** YOU MUST HAVE EXCEL and XLWINGS INSTALLED ON YOUR MACHINE FOR IT TO WORK ***
""")
desc3 = Paragraph(text="""
It opens this plots window and an excel spreadsheet instance with the
values being plotted. When user changes the values on the excel spreadsheet
the plots will be updated accordingly. It's not required to save the spreadsheet for the plots to update.
""")
plots_box = row(line, bar)
layout = column(desc1, desc2, desc3, plots_box)
curdoc().add_root(layout)
curdoc().add_periodic_callback(update, 500)

session.show() # open the document in a browser
session.loop_until_closed() # run forever
