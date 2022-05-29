''' An Example demonstrating the use of multiple widgets. This example uses
buttons, groups, inputs, panels, sliders, and tables, using the low-level
``bokeh.models`` API.

.. bokeh-example-metadata::
    :sampledata: autompg2, iris
    :apis: bokeh.models.AutocompleteInput, bokeh.models.Button, bokeh.models.CheckboxButtonGroup, bokeh.models.CheckboxGroup, bokeh.models.ColorPicker, bokeh.models.Column, bokeh.models.ColumnDataSource, bokeh.models.DataTable, bokeh.models.DatePicker, bokeh.models.DateRangeSlider, bokeh.models.DateSlider, bokeh.models.Div, bokeh.models.Dropdown, bokeh.models.IntEditor, bokeh.models.MultiChoice, bokeh.models.MultiSelect, bokeh.models.NumberEditor, bokeh.models.NumberFormatter, bokeh.models.Panel, bokeh.models.Paragraph, bokeh.models.PreText, bokeh.models.RadioButtonGroup, bokeh.models.RadioGroup, bokeh.models.RangeSlider, bokeh.models.Row, bokeh.models.Select, bokeh.models.SelectEditor, bokeh.models.Slider, bokeh.models.Spinner, bokeh.models.StringEditor, bokeh.models.StringFormatter, bokeh.models.TableColumn, bokeh.models.Tabs, bokeh.models.TextAreaInput, bokeh.models.TextInput, bokeh.models.Toggle # noqa: E501
    :refs: :ref:`userguide_plotting` > :ref:`userguide_plotting_scatter_markers`
    :keywords: widgets, select, button, slider, figure

'''
from datetime import date

from bokeh.document import Document
from bokeh.embed import file_html
from bokeh.models import (AutocompleteInput, Button, CheckboxButtonGroup,
                          CheckboxGroup, ColorPicker, Column, ColumnDataSource,
                          DataTable, DatePicker, DateRangeSlider, DateSlider, Div,
                          Dropdown, IntEditor, MultiChoice, MultiSelect, NumberEditor,
                          NumberFormatter, Panel, Paragraph, PreText, RadioButtonGroup,
                          RadioGroup, RangeSlider, Row, Select, SelectEditor, Slider,
                          Spinner, StringEditor, StringFormatter, Switch, TableColumn,
                          Tabs, TextAreaInput, TextInput, Toggle, Tooltip)
from bokeh.plotting import figure
from bokeh.resources import INLINE
from bokeh.sampledata.autompg2 import autompg2 as mpg
from bokeh.sampledata.iris import flowers
from bokeh.util.browser import view

click_button = Button(label="Button still has click event", button_type="success")

disabled_button = Button(label="Button (disabled) - still has click event", button_type="primary", disabled=True)

toggle = Toggle(label="Toggle button", button_type="success")

menu = [("Item 1", "item_1_value"), ("Item 2", "item_2_value"), None, ("Item 3", "item_3_value")]

dropdown = Dropdown(label="Dropdown button", button_type="warning", menu=menu)
dropdown_split = Dropdown(label="Split button", button_type="danger", menu=menu, split=True)

checkbox_group = CheckboxGroup(labels=["Option 1", "Option 2", "Option 3"], active=[0, 1])
radio_group = RadioGroup(labels=["Option 1", "Option 2", "Option 3"], active=0)

checkbox_button_group = CheckboxButtonGroup(labels=["Option 1", "Option 2", "Option 3"], active=[0, 1])
radio_button_group = RadioButtonGroup(labels=["Option 1", "Option 2", "Option 3"], active=0)

checkbox_button_group_vertical = CheckboxButtonGroup(labels=["Option 1", "Option 2", "Option 3"], active=[0, 1], orientation="vertical")
radio_button_group_vertical = RadioButtonGroup(labels=["Option 1", "Option 2", "Option 3"], active=0, orientation="vertical")

text_input = TextInput(placeholder="Enter value ...")

completions = ["aaa", "aab", "aac", "baa", "caa"]
autocomplete_input = AutocompleteInput(placeholder="Enter value (auto-complete) ...", completions=completions)

text_area = TextAreaInput(placeholder="Enter text ...", cols=20, rows=10, value="uuu")

select = Select(options=["Option 1", "Option 2", "Option 3"])

multi_select = MultiSelect(options=["Option %d" % (i+1) for i in range(16)], size=6)

multi_choice = MultiChoice(options=["Option %d" % (i+1) for i in range(16)])

slider = Slider(value=10, start=0, end=100, step=0.5)

range_slider = RangeSlider(value=[10, 90], start=0, end=100, step=0.5)

date_slider = DateSlider(value=date(2016, 1, 1), start=date(2015, 1, 1), end=date(2017, 12, 31))

date_range_slider = DateRangeSlider(value=(date(2016, 1, 1), date(2016, 12, 31)), start=date(2015, 1, 1), end=date(2017, 12, 31))

spinner = Spinner(value=100)

tooltip = Tooltip(content="""\
Your <b>choice</b> of color.<br>See more in bokeh's <a href="https://docs.bokeh.org/en/latest/">docs</a>.
""", position="right")

color_picker = ColorPicker(color="red", title="Choose color:", description=tooltip)

date_picker = DatePicker(value=date(2017, 8, 1))

switch_0 = Switch(active=False)

switch_1 = Switch(active=True)

paragraph = Paragraph(text="some text")

div = Div(text="some <b>text</b>")

pre_text = PreText(text="some text")

def mk_tab(color: str):
    plot = figure(width=300, height=300)
    plot.scatter(flowers["petal_length"], flowers["petal_width"], color=color, fill_alpha=0.2, size=12)
    return Panel(title=f"Tab 1: {color.capitalize()}", child=plot, closable=True)

tabs = Tabs(tabs=[mk_tab("red"), mk_tab("green"), mk_tab("blue")])

source = ColumnDataSource(data=mpg)
columns = [
    TableColumn(field="manufacturer",
                title="Manufacturer",
                editor=SelectEditor(options=sorted(mpg["manufacturer"].unique())),
                formatter=StringFormatter(font_style="bold")),
    TableColumn(field="model",
                title="Model",
                editor=StringEditor(completions=sorted(mpg["model"].unique()))),
    TableColumn(field="displ",
                title="Displacement",
                editor=NumberEditor(step=0.1),
                formatter=NumberFormatter(format="0.0")),
    TableColumn(field="year",
                title="Year",
                editor=IntEditor()),
    TableColumn(field="cyl",
                title="Cylinders",
                editor=IntEditor()),
    TableColumn(field="trans",
                title="Transmission",
                editor=SelectEditor(options=sorted(mpg["trans"].unique()))),
    TableColumn(field="drv",
                title="Drive",
                editor=SelectEditor(options=sorted(mpg["drv"].unique()))),
    TableColumn(field="class",
                title="Class",
                editor=SelectEditor(options=sorted(mpg["class"].unique()))),
    TableColumn(field="cty",
                title="City MPG",
                editor=IntEditor()),
    TableColumn(field="hwy",
                title="Highway MPG",
                editor=IntEditor()),
]
table = DataTable(source=source, columns=columns, editable=True, width=800)

widgets = Column(children=[
    Row(children=[
        Column(children=[
            click_button, disabled_button, toggle, dropdown, dropdown_split,
            checkbox_group, radio_group,
            checkbox_button_group, radio_button_group,
            Row(children=[checkbox_button_group_vertical, radio_button_group_vertical]),
        ]),
        Column(children=[
            text_input, autocomplete_input, text_area,
            select, multi_select, multi_choice,
            slider, range_slider, date_slider, date_range_slider,
            spinner, color_picker, date_picker,
            Row(children=[switch_0, switch_1]),
            paragraph, div, pre_text,
        ]),
        tabs,
    ]),
    table,
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
