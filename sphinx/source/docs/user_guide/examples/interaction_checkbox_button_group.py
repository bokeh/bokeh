from bokeh.io import output_file, show
from bokeh.models.widgets import CheckboxButtonGroup

output_file("checkbox_button_group.html")

checkbox_button_group = CheckboxButtonGroup(
        labels=["Option 1", "Option 2", "Option 3"], active=[0, 1])

show(checkbox_button_group)
