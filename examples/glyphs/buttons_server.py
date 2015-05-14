from __future__ import print_function

from bokeh.browserlib import view
from bokeh.document import Document
from bokeh.session import Session
from bokeh.models.widgets import (
    VBox, Icon,
    Button, Toggle, Dropdown,
    CheckboxGroup, RadioGroup,
    CheckboxButtonGroup, RadioButtonGroup,
)

document = Document()
session = Session()
session.use_doc('buttons_server')
session.load_document(document)

def button_handler():
    print("button_handler: click")
    session.store_document(document)

def toggle_handler(active):
    print("toggle_handler: %s" % active)
    session.store_document(document)

def dropdown_handler(action):
    print("dropdown_handler: %s" % action)
    session.store_document(document)

def split_handler(action):
    print("split_handler: %s" % action)
    session.store_document(document)

def checkbox_group_handler(active):
    print("checkbox_group_handler: %s" % active)
    session.store_document(document)

def radio_group_handler(active):
    print("radio_group_handler: %s" % active)
    session.store_document(document)

def checkbox_button_group_handler(active):
    print("checkbox_button_group_handler: %s" % active)
    session.store_document(document)

def radio_button_group_handler(active):
    print("radio_button_group_handler: %s" % active)
    session.store_document(document)

button = Button(label="Push button", icon=Icon(name="check"), type="primary")
button.on_click(button_handler)

toggle = Toggle(label="Toggle button", type="success")
toggle.on_click(toggle_handler)

menu = [("Item 1", "item_1"), ("Item 2", "item_2"), None, ("Item 3", "item_3")]
dropdown = Dropdown(label="Dropdown button", type="warning", menu=menu)
dropdown.on_click(dropdown_handler)

menu = [("Item 1", "foo"), ("Item 2", "bar"), None, ("Item 3", "baz")]
split = Dropdown(label="Split button", type="danger", menu=menu, default_action="baz")
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

document.add(vbox)
session.store_document(document)

if __name__ == "__main__":
    link = session.object_link(document.context)
    print("Please visit %s to see the plots" % link)
    view(link)
    print("\npress ctrl-C to exit")
    session.poll_document(document)
