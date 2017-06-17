from __future__ import print_function

from bokeh.client import push_session
from bokeh.document import Document
from bokeh.models import CustomJS
from bokeh.models.layouts import WidgetBox
from bokeh.models.widgets import (
    Button, Toggle, Dropdown, CheckboxGroup, RadioGroup,
    CheckboxButtonGroup, RadioButtonGroup,
)

button = Button(label="Button (enabled) - has click event", button_type="primary")
button.on_click(lambda: print('button: click'))
button.js_on_click(CustomJS(code="console.log('button: click', this.toString())"))

button_disabled = Button(label="Button (disabled) - no click event", button_type="primary", disabled=True)
button_disabled.on_click(lambda: print('button_disabled: click'))
button_disabled.js_on_click(CustomJS(code="console.log('button_disabled: click', this.toString())"))

toggle_inactive = Toggle(label="Toggle button (initially inactive)", button_type="success")
toggle_inactive.on_click(lambda value: print('toggle_inactive: %s' % value))
toggle_inactive.js_on_click(CustomJS(code="console.log('toggle_inactive: ' + this.active, this.toString())"))

toggle_active = Toggle(label="Toggle button (initially active)", button_type="success", active=True)
toggle_active.on_click(lambda value: print('toggle_active: %s' % value))
toggle_active.js_on_click(CustomJS(code="console.log('toggle_active: ' + this.active, this.toString())"))

menu = [("Item 1", "item_1_value"), ("Item 2", "item_2_value"), None, ("Item 3", "item_3_value")]

dropdown = Dropdown(label="Dropdown button", button_type="warning", menu=menu, default_value="item_1_value")
dropdown.on_click(lambda value: print('dropdown: %s' % value))
dropdown.js_on_click(CustomJS(code="console.log('dropdown: ' + this.value, this.toString())"))

dropdown_disabled = Dropdown(label="Dropdown button (disabled)", button_type="warning", menu=menu, default_value="item_1_value")
dropdown_disabled.on_click(lambda value: print('dropdown_disabled: %s' % value))
dropdown_disabled.js_on_click(CustomJS(code="console.log('dropdown_disabled: ' + this.value, this.toString())"))

dropdown_split = Dropdown(label="Split button", button_type="danger", menu=menu) #, default_value="default")
dropdown_split.on_click(lambda value: print('dropdown_split: %s' % value))
dropdown_split.js_on_click(CustomJS(code="console.log('dropdown_split: ' + this.value, this.toString())"))




def checkbox_group_handler(active):
    print("checkbox_group_handler: %s" % active)

def radio_group_handler(active):
    print("radio_group_handler: %s" % active)

def checkbox_button_group_handler(active):
    print("checkbox_button_group_handler: %s" % active)

def radio_button_group_handler(active):
    print("radio_button_group_handler: %s" % active)

checkbox_group = CheckboxGroup(labels=["Option 1", "Option 2", "Option 3"], active=[0, 1])
checkbox_group.on_click(checkbox_group_handler)

radio_group = RadioGroup(labels=["Option 1", "Option 2", "Option 3"], active=0)
radio_group.on_click(radio_group_handler)

checkbox_button_group = CheckboxButtonGroup(labels=["Option 1", "Option 2", "Option 3"], active=[0, 1])
checkbox_button_group.on_click(checkbox_button_group_handler)

radio_button_group = RadioButtonGroup(labels=["Option 1", "Option 2", "Option 3"], active=0)
radio_button_group.on_click(radio_button_group_handler)

widgetBox = WidgetBox(children=[
    button, button_disabled,
    toggle_inactive, toggle_active,
    dropdown, dropdown_disabled, dropdown_split,
    checkbox_group, radio_group,
    checkbox_button_group, radio_button_group,
])

document = Document()
document.add_root(widgetBox)
session = push_session(document)
session.show()

if __name__ == "__main__":
    document.validate()
    session.loop_until_closed()
