from __future__ import print_function

#from datetime import date

from bokeh.document import Document
from bokeh.embed import file_html
from bokeh.resources import INLINE
from bokeh.util.browser import view
from bokeh.models.layouts import Row, WidgetBox
from bokeh.models.widgets import (
    Button, Toggle, Dropdown,
    CheckboxGroup, RadioGroup,
    CheckboxButtonGroup, RadioButtonGroup,
    TextInput, AutocompleteInput,
    Select, MultiSelect,
    Slider, RangeSlider, #DateRangeSlider,
    DatePicker,
    Paragraph, Div, PreText,
    Panel, Tabs,
)
from bokeh.plotting import figure
from bokeh.sampledata.iris import flowers

button = Button(label="Button (disabled) - still has click event", button_type="primary", disabled=True)

toggle = Toggle(label="Toggle button", button_type="success")

menu = [("Item 1", "item_1_value"), ("Item 2", "item_2_value"), ("Item 3", "item_3_value")]
dropdown = Dropdown(label="Dropdown button", button_type="warning", menu=menu, default_value="item_1_value")

split_menu = [("Item 1", "item_1_value"), ("Item 2", "item_2_value"), None, ("Item 3", "item_3_value")]
split = Dropdown(label="Split button", button_type="danger", menu=split_menu)

checkbox_group = CheckboxGroup(labels=["Option 1", "Option 2", "Option 3"], active=[0, 1])

radio_group = RadioGroup(labels=["Option 1", "Option 2", "Option 3"], active=0)

checkbox_button_group = CheckboxButtonGroup(labels=["Option 1", "Option 2", "Option 3"], active=[0, 1])

radio_button_group = RadioButtonGroup(labels=["Option 1", "Option 2", "Option 3"], active=0)

text_input = TextInput(placeholder="Enter value ...")

autocomplete_input = AutocompleteInput()

select = Select(options=["Option 1", "Option 2", "Option 3"])

multi_select = MultiSelect(options=["Option %d" % (i+1) for i in range(16)], size=6)

slider = Slider(value=10, start=0, end=100)

range_slider = RangeSlider()

#date_range_slider = DateRangeSlider(value=(date(2016, 1, 1), date(2016, 12, 31)))

date_picker = DatePicker()

paragraph = Paragraph(text="some text")

div = Div(text="some <b>text</b>")

pre_text = PreText(text="some text")

def mk_tab(color):
    plot = figure(plot_width=300, plot_height=300)
    plot.scatter(flowers["petal_length"], flowers["petal_width"], color=color, fill_alpha=0.2, size=12)
    return Panel(title="Tab 1: %s" % color.capitalize(), child=plot)

tabs = Tabs(tabs=[mk_tab("red"), mk_tab("green"), mk_tab("blue")])

widgets = Row(children=[
    WidgetBox(children=[
        button, toggle, dropdown, split,
        checkbox_group, radio_group,
        checkbox_button_group, radio_button_group,
    ]),
    WidgetBox(children=[
        text_input, autocomplete_input,
        select, multi_select,
        slider, range_slider, #date_range_slider,
        date_picker,
        paragraph, div, pre_text,
    ]),
    WidgetBox(children=[
        tabs,
    ], width=400),
])

doc = Document()
doc.add_root(widgets)

if __name__ == "__main__":
    doc.validate()
    filename = "widgets.html"
    with open(filename, "w") as f:
        f.write(file_html(doc, INLINE, "Widgets"))
    print("Wrote %s" % filename)
    view(filename)
