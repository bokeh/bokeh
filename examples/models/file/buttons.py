from __future__ import print_function

from bokeh.util.browser import view
from bokeh.document import Document
from bokeh.embed import file_html
from bokeh.resources import INLINE

from bokeh.models import CustomJS, Column
from bokeh.models.widgets import (
    Button, Toggle, Dropdown, CheckboxGroup, RadioGroup, CheckboxButtonGroup, RadioButtonGroup,
)

button = Button(label="Button (enabled) - has click event", button_type="primary")
button.js_on_click(CustomJS(code="console.log('button: click ', this.toString())"))

button_disabled = Button(label="Button (disabled) - no click event", button_type="primary", disabled=True)
button_disabled.js_on_click(CustomJS(code="console.log('button(disabled): click ', this.toString())"))

toggle_inactive = Toggle(label="Toggle button (initially inactive)", button_type="success")
toggle_inactive.js_on_click(CustomJS(code="console.log('toggle(inactive): active=' + this.active, this.toString())"))

toggle_active = Toggle(label="Toggle button (initially active)", button_type="success", active=True)
toggle_active.js_on_click(CustomJS(code="console.log('toggle(active): active=' + this.active, this.toString())"))

menu = [("Item 1", "item_1_value"), ("Item 2", "item_2_value"), None, ("Item 3", "item_3_value")]

dropdown = Dropdown(label="Dropdown button", button_type="warning", menu=menu)
dropdown.js_on_click(CustomJS(code="console.log('dropdown: click ' + this.toString())"))
dropdown.js_on_event("menu_item_click", CustomJS(code="console.log('dropdown: ' + this.item, this.toString())"))

dropdown_disabled = Dropdown(label="Dropdown button (disabled)", button_type="warning", disabled=True, menu=menu)
dropdown_disabled.js_on_click(CustomJS(code="console.log('dropdown(disabled): click ' + this.toString())"))
dropdown_disabled.js_on_event("menu_item_click", CustomJS(code="console.log('dropdown(disabled): ' + this.item, this.toString())"))

dropdown_split = Dropdown(label="Split button", split=True, button_type="danger", menu=menu)
dropdown_split.js_on_click(CustomJS(code="console.log('dropdown(split): click ' + this.toString())"))
dropdown_split.js_on_event("menu_item_click", CustomJS(code="console.log('dropdown(split): ' + this.item, this.toString())"))

checkbox_group = CheckboxGroup(labels=["Option 1", "Option 2", "Option 3"], active=[0, 1])
checkbox_group.js_on_click(CustomJS(code="console.log('checkbox_group: active=' + this.active, this.toString())"))

radio_group = RadioGroup(labels=["Option 1", "Option 2", "Option 3"], active=0)
radio_group.js_on_click(CustomJS(code="console.log('radio_group: active=' + this.active, this.toString())"))

checkbox_button_group = CheckboxButtonGroup(labels=["Option 1", "Option 2", "Option 3"], active=[0, 1])
checkbox_button_group.js_on_click(CustomJS(code="console.log('checkbox_button_group: active=' + this.active, this.toString())"))

radio_button_group = RadioButtonGroup(labels=["Option 1", "Option 2", "Option 3"], active=0)
radio_button_group.js_on_click(CustomJS(code="console.log('radio_button_group: active=' + this.active, this.toString())"))

widget_box = Column(children=[
    button, button_disabled,
    toggle_inactive, toggle_active,
    dropdown, dropdown_disabled, dropdown_split,
    checkbox_group, radio_group,
    checkbox_button_group, radio_button_group,
])

doc = Document()
doc.add_root(widget_box)

if __name__ == "__main__":
    doc.validate()
    filename = "buttons.html"
    with open(filename, "w") as f:
        f.write(file_html(doc, INLINE, "Button widgets"))
    print("Wrote %s" % filename)
    view(filename)
