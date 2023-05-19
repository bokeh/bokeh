''' A column salary chart with minimum and maximum values.
This example shows the capability of exporting a csv file from ColumnDataSource.

'''
from os.path import dirname, join
from pathlib import Path

import pandas as pd

from bokeh.io import curdoc
from bokeh.layouts import column, row
from bokeh.models import (Button, ColumnDataSource, CustomJS, DataTable,
                          NumberFormatter, RangeSlider, TableColumn)

df = pd.read_csv(join(dirname(__file__), 'salary_data.csv'))

source = ColumnDataSource(data=dict())

def update():
    current = df[(df['salary'] >= slider.value[0]) & (df['salary'] <= slider.value[1])].dropna()
    source.data = {
        'name'             : current.name,
        'salary'           : current.salary,
        'years_experience' : current.years_experience,
    }

slider = RangeSlider(title="Max Salary", start=10000, end=110000, value=(10000, 50000), step=1000, format="0,0")
slider.on_change('value', lambda attr, old, new: update())

button = Button(label="Download", button_type="success")
button.js_on_event(
    "button_click",
    CustomJS(
        args=dict(source=source),
        code=(Path(__file__).parent / "download.js").read_text("utf8"),
    ),
)

columns = [
    TableColumn(field="name", title="Employee Name"),
    TableColumn(field="salary", title="Income", formatter=NumberFormatter(format="$0,0.00")),
    TableColumn(field="years_experience", title="Experience (years)"),
]

data_table = DataTable(source=source, columns=columns, width=800)

controls = column(slider, button)

curdoc().add_root(row(controls, data_table))
curdoc().title = "Export CSV"

update()
