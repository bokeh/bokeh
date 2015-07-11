from bokeh.models.widgets import Toggle
from bokeh.io import output_file, show, vform

output_file("toggle.html")

toggle = Toggle(label="Foo", type="success")

show(vform(toggle))
