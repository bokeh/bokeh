from bokeh.io import output_file, show
from bokeh.models.widgets import ColorPicker

output_file("color_picker.html")

color_picker = ColorPicker(color="#ff4466", title="Choose color:", width=200)

show(color_picker)
