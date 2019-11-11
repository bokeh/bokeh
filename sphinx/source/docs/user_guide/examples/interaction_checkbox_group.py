from bokeh.io import output_file, show
from bokeh.models import CheckboxGroup

output_file("checkbox_group.html")

checkbox_group = CheckboxGroup(
        labels=["Option 1", "Option 2", "Option 3"], active=[0, 1])

show(checkbox_group)
