from bokeh.io import output_file, show
from bokeh.layouts import widgetbox
from bokeh.models.widgets import MultiSelect

output_file("multi_select.html")

multi_select = MultiSelect(title="Option:", value=["foo", "quux"],
                           options=["foo", "bar", "baz", "quux"])

show(widgetbox(multi_select))
