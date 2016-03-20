from bokeh.io import vform
from bokeh.models.layouts import HBox
from bokeh.models import ColumnDataSource, CustomJS
from bokeh.plotting import output_file, show
from bokeh.models.widgets import TextInput, DataTable, TableColumn, Button
from bokeh.models.transforms import Jitter, LinearInterpolator

# Define the sample data source that the transform is applied to and subsequently stored
source = ColumnDataSource(dict(y=[10, 11, 12, 13, 14, 15], yprime=[None]*6))

# Define a simple Jitter transform
jitter = Jitter(interval=2)

# Define a linear interpolator transform
interpdata = ColumnDataSource(dict(x=[0, 15, 30], y=[30, 5, 0]))
lininterp = LinearInterpolator(x = 'x', y = 'y', data = interpdata)

# Sepcify a data table to display the input data and the resulting transformed data
columns = [
    TableColumn(field="y", title="Untransformed Value (y)"),
    TableColumn(field="yprime", title="Transformed Values (y')")
]
tw = DataTable(source=source, columns=columns, width=1000, height=1000)

# Define text input to adjust the interval of the Jitter transform
ti = TextInput(title='Random Width', name='ti', value = '1.0', callback =
    CustomJS(args=dict(trans=jitter), code="""
        trans.set('interval', ti.get('value'))
    """)
    )
ti.callback.args['ti'] = ti

# Define a button to execute the desired transform
button = Button(label='Execute Transform', callback=
    CustomJS(args=dict(source=source, trans=lininterp, dt = tw), code="""
    var data = source.get('data')
    data['yprime'] = []
    for (i=0; i < data['y'].length; i++) {
        data['yprime'].push(trans.compute(data['y'][i]))
    }
    source.trigger('change')
    dt.trigger('change')
    """)
    )

t = vform(HBox(ti, button), tw)

output_file('computed_transforms.html', title = 'Comuputed Transform Examples')

show(t)

