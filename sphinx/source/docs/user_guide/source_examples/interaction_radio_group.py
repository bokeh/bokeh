from bokeh.io import output_file, show
from bokeh.layouts import widgetbox
from bokeh.models.widgets import RadioGroup

output_file("radio_group.html")

radio_group = RadioGroup(
        labels=["Option 1", "Option 2", "Option 3"], active=0)

show(widgetbox(radio_group))
