from bokeh.models.widgets import MultiSelect
from bokeh.io import output_file, show, vform

output_file("multi_select.html")

multi_select = MultiSelect(title="Option:", value=["foo", "quux"],
                           options=["foo", "bar", "baz", "quux"])

show(vform(multi_select))
