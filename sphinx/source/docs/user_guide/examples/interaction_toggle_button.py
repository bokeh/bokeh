from bokeh.io import output_file, show
from bokeh.layouts import widgetbox
from bokeh.models.widgets import Toggle

output_file("toggle.html")

toggle = Toggle(label="Foo", button_type="success")

show(widgetbox(toggle))
