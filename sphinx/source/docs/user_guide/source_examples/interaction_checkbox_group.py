from bokeh.models.widgets import CheckboxGroup
from bokeh.io import output_file, show, vform

output_file("checkbox_group.html")

checkbox_group = CheckboxGroup(
        labels=["Option 1", "Option 2", "Option 3"], active=[0, 1])

show(vform(checkbox_group))
