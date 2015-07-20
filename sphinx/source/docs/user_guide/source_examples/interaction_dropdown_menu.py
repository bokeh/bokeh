from bokeh.models.widgets import Dropdown
from bokeh.io import output_file, show, vform

output_file("dropdown.html")

menu = [("Item 1", "item_1"), ("Item 2", "item_2"), None, ("Item 3", "item_3")]
dropdown = Dropdown(label="Dropdown button", type="warning", menu=menu)

show(vform(dropdown))
