from __future__ import print_function

from bokeh.client import push_session
from bokeh.document import Document
from bokeh.models.layouts import VBox
from bokeh.models.widgets import (
    Icon, Button, Toggle, Dropdown, CheckboxGroup, RadioGroup,
    CheckboxButtonGroup, RadioButtonGroup,
)

def button_handler():
    print("button_handler: click")

def toggle_handler(active):
    print("toggle_handler: %s" % active)

def dropdown_handler(value):
    print("dropdown_handler: %s" % value)

def split_handler(value):
    print("split_handler: %s" % value)

def checkbox_group_handler(active):
    print("checkbox_group_handler: %s" % active)

def radio_group_handler(active):
    print("radio_group_handler: %s" % active)

def checkbox_button_group_handler(active):
    print("checkbox_button_group_handler: %s" % active)

def radio_button_group_handler(active):
    print("radio_button_group_handler: %s" % active)

button = Button(label="Push button", icon=Icon(icon_name="check"), button_type="primary")
button.on_click(button_handler)

toggle = Toggle(label="Toggle button", button_type="success")
toggle.on_click(toggle_handler)

menu = [("Item 1", "item_1"), ("Item 2", "item_2"), None, ("Item 3", "item_3")]
dropdown = Dropdown(label="Dropdown button", button_type="warning", menu=menu)
dropdown.on_click(dropdown_handler)

menu = [("Item 1", "foo"), ("Item 2", "bar"), None, ("Item 3", "baz")]
split = Dropdown(label="Split button", button_type="danger", menu=menu, default_value="baz")
split.on_click(split_handler)

checkbox_group = CheckboxGroup(labels=["Option 1", "Option 2", "Option 3"], active=[0, 1])
checkbox_group.on_click(checkbox_group_handler)

radio_group = RadioGroup(labels=["Option 1", "Option 2", "Option 3"], active=0)
radio_group.on_click(radio_group_handler)

checkbox_button_group = CheckboxButtonGroup(labels=["Option 1", "Option 2", "Option 3"], active=[0, 1])
checkbox_button_group.on_click(checkbox_button_group_handler)

radio_button_group = RadioButtonGroup(labels=["Option 1", "Option 2", "Option 3"], active=0)
radio_button_group.on_click(radio_button_group_handler)

vbox = VBox(children=[button, toggle, dropdown, split, checkbox_group, radio_group, checkbox_button_group, radio_button_group])

document = Document()
document.add_root(vbox)
session = push_session(document)
session.show()

if __name__ == "__main__":
    session.loop_until_closed()
