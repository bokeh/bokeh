from bokeh.io import output_file, show
from bokeh.models.widgets import RadioButtonGroup

output_file("radio_button_group.html")

radio_button_group = RadioButtonGroup(
        labels=["Option 1", "Option 2", "Option 3"], active=0)

show(radio_button_group)
