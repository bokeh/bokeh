from bokeh.models.widgets import Select
from bokeh.io import output_file, show, vform

output_file("select.html")

select = Select(title="Option:", value="foo", options=["foo", "bar", "baz", "quux"])

show(vform(select))
