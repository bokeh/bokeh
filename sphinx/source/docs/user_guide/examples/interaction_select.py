from bokeh.io import output_file, show
from bokeh.models.widgets import Select

output_file("select.html")

select = Select(title="Option:", value="foo", options=["foo", "bar", "baz", "quux"])

show(select)
