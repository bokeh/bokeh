from bokeh.io import output_file, show
from bokeh.models import MultiSelect

output_file("multi_select.html")

multi_select = MultiSelect(title="Option:", value=["foo", "quux"],
                           options=[("foo", "Foo"), ("bar", "BAR"), ("baz", "bAz"), ("quux", "quux")])

show(multi_select)
