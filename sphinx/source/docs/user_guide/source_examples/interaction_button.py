from bokeh.models.widgets import Button
from bokeh.io import output_file, show, vform

output_file("button.html")

button = Button(label="Foo", type="success")

show(vform(button))
