### NOTE: The csv export will not work on Safari
import bokeh
import pandas as pd

from bokeh.plotting import ColumnDataSource
from bokeh.models import CustomJS, HBox, VBox, VBoxForm
from bokeh.models.widgets import Slider, Button, DataTable, TableColumn
from bokeh.io import curdoc, vform

# note this is fake data
df = pd.read_csv('salary_data.csv')

salary_range = Slider(title="Max Salary", start=10000, end=250000, value=150000, step=1000)
button = Button(label="Download")
button.button_type = "success"

source = ColumnDataSource(data=dict())

columns = [TableColumn(field="name", title="Employee Name"),
           TableColumn(field="salary", title="Income"),
           TableColumn(field="years_experience", title="Experience (years)")]

data_table = DataTable(source=source, columns=columns)

def update(attr, old, new):
    curr_df = df[df['salary'] <= salary_range.value].dropna()
    source.data = dict(name=curr_df['name'].tolist(),
                       salary=curr_df['salary'].tolist(),
                       years_experience=curr_df['years_experience'].tolist())


salary_range.on_change('value', update)

js_callback = """
var data = source.get('data');
var filetext = 'name,income,years_experience\\n';
for (i=0; i < data['name'].length; i++) {
    var currRow = [data['name'][i].toString(),
                   data['salary'][i].toString(),
                   data['years_experience'][i].toString().concat('\\n')];

    var joined = currRow.join();
    filetext = filetext.concat(joined);
}

var filename = 'data_result.csv';
var blob = new Blob([filetext], { type: 'text/csv;charset=utf-8;' });

//addresses IE
if (navigator.msSaveBlob) {
    navigator.msSaveBlob(blob, filename);
}

else {
    var link = document.createElement("a");
    link = document.createElement('a')
    link.href = URL.createObjectURL(blob);
    link.download = filename
    link.target = "_blank";
    link.style.visibility = 'hidden';
    link.dispatchEvent(new MouseEvent('click'))
}"""

button.callback = CustomJS(args=dict(source=source), code=js_callback)
controls = [salary_range, button]
inputs = HBox(VBoxForm(*controls), width=400)
update(None, None, None)
curdoc().add_root(HBox(inputs, data_table, width=800))
