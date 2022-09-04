from bokeh.io import show
from bokeh.layouts import row
from bokeh.models import HelpButton, RadioButtonGroup, Tooltip

LABELS = ["Option 1", "Option 2", "Option 3"]

radio_button_group = RadioButtonGroup(labels=LABELS, active=0)
tooltip = Tooltip(content=f"Select one of the following options: {', '.join(LABELS)}", position="right")
help_button = HelpButton(tooltip=tooltip)

show(row(radio_button_group, help_button))
