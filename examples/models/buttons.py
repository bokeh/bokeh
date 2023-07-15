''' A rendering of all button widgets.

This example demonstrates the types of button widgets available
along with radio buttons and checkboxes.

The types include button with click event enabled and disabled,
a toggle button with default active or inactive status, checkboxes,
radio buttons, dropdown menu, checkbox and radio with groups.

.. bokeh-example-metadata::
    :apis: bokeh.models.widgets.buttons.Button, bokeh.models.widgets.buttons.Dropdown, bokeh.models.widgets.buttons.Toggle, bokeh.models.widgets.groups.CheckBoxButtonGroup, bokeh.models.widgets.groups.CheckboxGroup, bokeh.models.widgets.groups.RadioButtonGroup, bokeh.models.widgets.groups.RadioGroup
    :refs: :ref:`ug_basic_layouts_gridplot`, :ref:`ug_interaction_widgets`
    :keywords: buttons, radio button, checkboxes, toggle button, dropdown

''' # noqa: E501
from bokeh.document import Document
from bokeh.embed import file_html
from bokeh.models import (Button, CheckboxButtonGroup, CheckboxGroup, Column,
                          CustomJS, Dropdown, RadioButtonGroup, RadioGroup, Toggle)
from bokeh.util.browser import view

button = Button(label="Button (enabled) - has click event", button_type="primary")
button.js_on_event("button_click", CustomJS(code="console.log('button: click ', this.toString())"))
button.js_on_event("button_click", CustomJS(code="console.log('button: click ', this.toString())"))

button_disabled = Button(label="Button (disabled) - no click event", button_type="primary", disabled=True)
button_disabled.js_on_event("button_click", CustomJS(code="console.log('button(disabled): click ', this.toString())"))

toggle_inactive = Toggle(label="Toggle button (initially inactive)", button_type="success")
toggle_inactive.js_on_event('button_click', CustomJS(code="console.log('toggle(inactive): active=' + this.origin.active, this.toString())"))

toggle_active = Toggle(label="Toggle button (initially active)", button_type="success", active=True)
toggle_active.js_on_event('button_click', CustomJS(code="console.log('toggle(active): active=' + this.origin.active, this.toString())"))

menu = [("Item 1", "item_1_value"), ("Item 2", "item_2_value"), None, ("Item 3", "item_3_value")]

dropdown = Dropdown(label="Dropdown button", button_type="warning", menu=menu)
dropdown.js_on_event("button_click", CustomJS(code="console.log('dropdown: click ' + this.toString())"))
dropdown.js_on_event("menu_item_click", CustomJS(code="console.log('dropdown: ' + this.item, this.toString())"))

dropdown_disabled = Dropdown(label="Dropdown button (disabled)", button_type="warning", disabled=True, menu=menu)
dropdown_disabled.js_on_event("button_click", CustomJS(code="console.log('dropdown(disabled): click ' + this.toString())"))
dropdown_disabled.js_on_event("menu_item_click", CustomJS(code="console.log('dropdown(disabled): ' + this.item, this.toString())"))

dropdown_split = Dropdown(label="Split button", split=True, button_type="danger", menu=menu)
dropdown_split.js_on_event("button_click", CustomJS(code="console.log('dropdown(split): click ' + this.toString())"))
dropdown_split.js_on_event("menu_item_click", CustomJS(code="console.log('dropdown(split): ' + this.item, this.toString())"))

checkbox_group = CheckboxGroup(labels=["Option 1", "Option 2", "Option 3"], active=[0, 1])
checkbox_group.js_on_change('active', CustomJS(code="console.log('checkbox_group: active=' + this.active, this.toString())"))

radio_group = RadioGroup(labels=["Option 1", "Option 2", "Option 3"], active=0)
radio_group.js_on_change('active', CustomJS(code="console.log('radio_group: active=' + this.active, this.toString())"))

checkbox_button_group = CheckboxButtonGroup(labels=["Option 1", "Option 2", "Option 3"], active=[0, 1])
checkbox_button_group.js_on_event("button_click", CustomJS(code="console.log('checkbox_button_group: active=' + this.origin.active, this.toString())"))

radio_button_group = RadioButtonGroup(labels=["Option 1", "Option 2", "Option 3"], active=0)
radio_button_group.js_on_event("button_click", CustomJS(code="console.log('radio_button_group: active=' + this.origin.active, this.toString())"))

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
        f.write(file_html(doc, title="Button widgets"))
    print(f"Wrote {filename}")
    view(filename)
