''' Open a menu of choices from a dropdown button.

.. bokeh-example-metadata::
    :title: Dropdown
    :keywords: dropdown
    :apis: bokeh.models.CustomJS, bokeh.models.Dropdown
    :gallery: A dropdown button with a menu of three items.
'''

from bokeh.io import show
from bokeh.models import CustomJS, Dropdown

menu = [("Item 1", "item_1"), ("Item 2", "item_2"), None, ("Item 3", "item_3")]

dropdown = Dropdown(label="Dropdown button", button_type="warning", menu=menu)
dropdown.js_on_event("menu_item_click", CustomJS(code="console.log('dropdown: ' + this.item, this.toString())"))

show(dropdown)
