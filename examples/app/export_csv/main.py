from os.path import dirname, join

import pandas as pd

from bokeh.layouts import row, widgetbox
from bokeh.models import ColumnDataSource, CustomJS
from bokeh.models.widgets import Slider, Button, DataTable, TableColumn, NumberFormatter
from bokeh.io import curdoc

df = pd.read_csv(join(dirname(__file__), 'salary_data.csv'))

source = ColumnDataSource(data=dict())

def update():
    current = df[df['salary'] <= slider.value].dropna()
    source.data = {
        'name'             : current.name,
        'salary'           : current.salary,
        'years_experience' : current.years_experience,
    }

slider = Slider(title="Max Salary", start=10000, end=250000, value=150000, step=1000)
slider.on_change('value', lambda attr, old, new: update())

button = Button(label="Download", button_type="success")
button.callback = CustomJS(args=dict(source=source),
                           code=open(join(dirname(__file__), "download.js")).read())

columns = [
    TableColumn(field="name", title="Employee Name"),
    TableColumn(field="salary", title="Income", formatter=NumberFormatter(format="$0,0.00")),
    TableColumn(field="years_experience", title="Experience (years)")
]

data_table = DataTable(source=source, columns=columns, width=800)

controls = widgetbox(slider, button)
table = widgetbox(data_table)

curdoc().add_root(row(controls, table))
curdoc().title = "Export CSV"

update()
