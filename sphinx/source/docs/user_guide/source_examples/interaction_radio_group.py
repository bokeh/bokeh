from bokeh.models.widgets import RadioGroup
from bokeh.io import output_file, show, vform

output_file("radio_group.html")

radio_group = RadioGroup(
        labels=["Option 1", "Option 2", "Option 3"], active=0)

show(vform(radio_group))
