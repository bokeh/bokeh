from bokeh.models.widgets import RadioButtonGroup
from bokeh.io import output_file, show, vform

output_file("radio_button_group.html")

radio_button_group = RadioButtonGroup(
        labels=["Option 1", "Option 2", "Option 3"], active=0)

show(vform(radio_button_group))
