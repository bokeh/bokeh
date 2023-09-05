''' An Example demonstrating the use of multiple widgets. This example uses
buttons, groups, inputs, panels, sliders, and tables, using the low-level
``bokeh.models`` API.

.. bokeh-example-metadata::
    :sampledata: autompg2, iris
    :apis: bokeh.models.AutocompleteInput, bokeh.models.Button, bokeh.models.CheckboxButtonGroup, bokeh.models.CheckboxGroup, bokeh.models.ColorPicker, bokeh.models.Column, bokeh.models.ColumnDataSource, bokeh.models.DataTable, bokeh.models.DatePicker, bokeh.models.DateRangeSlider, bokeh.models.DateSlider, bokeh.models.Div, bokeh.models.Dropdown, bokeh.models.IntEditor, bokeh.models.MultiChoice, bokeh.models.MultiSelect, bokeh.models.NumberEditor, bokeh.models.NumberFormatter, bokeh.models.TabPanel, bokeh.models.Paragraph, bokeh.models.PreText, bokeh.models.RadioButtonGroup, bokeh.models.RadioGroup, bokeh.models.RangeSlider, bokeh.models.Row, bokeh.models.Select, bokeh.models.SelectEditor, bokeh.models.Slider, bokeh.models.Spinner, bokeh.models.StringEditor, bokeh.models.StringFormatter, bokeh.models.TableColumn, bokeh.models.Tabs, bokeh.models.TextAreaInput, bokeh.models.TextInput, bokeh.models.Toggle
    :refs: :ref:`ug_basic_scatters_markers`
    :keywords: widgets, select, button, slider, figure

''' # noqa: E501
from datetime import date, datetime, time

from bokeh.document import Document
from bokeh.embed import file_html
from bokeh.models import (AutocompleteInput, BuiltinIcon, Button, ByCSS, Checkbox,
                          CheckboxButtonGroup, CheckboxGroup, ColorMap, ColorPicker,
                          Column, ColumnDataSource, DataTable, DatePicker,
                          DateRangePicker, DateRangeSlider, DateSlider,
                          DatetimePicker, DatetimeRangePicker, Dialog, Div,
                          Dropdown, Examiner, GroupBox, HelpButton, IntEditor, Menu,
                          MultiChoice, MultipleDatePicker, MultipleDatetimePicker,
                          MultiSelect, NumberEditor, NumberFormatter, Paragraph,
                          PasswordInput, PreText, RadioButtonGroup, RadioGroup,
                          RangeSlider, Row, Select, SelectEditor, SetValue, Slider,
                          Spinner, StringEditor, StringFormatter, SVGIcon, Switch,
                          TableColumn, TablerIcon, TabPanel, Tabs, TextAreaInput,
                          TextInput, TimePicker, Toggle, Tooltip)
from bokeh.models.dom import HTML, ValueOf
from bokeh.plotting import figure
from bokeh.sampledata.autompg2 import autompg2 as mpg
from bokeh.sampledata.iris import flowers
from bokeh.util.browser import view

dialog = Dialog(content=Examiner(), visible=False)

click_button = Button(icon=TablerIcon("settings", size="1.2em"), label="Open Examiner", button_type="success")
click_button.js_on_event("button_click", SetValue(dialog, "visible", True))

disabled_button = Button(label="Button (disabled) - still has click event", button_type="primary", disabled=True)

toggle = Toggle(icon=BuiltinIcon("settings", size="1.2em", color="white"), label="Toggle button", button_type="success")

svg_icon = SVGIcon("""
<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"
        stroke-width="2" stroke="currentColor" fill="none" stroke-linecap="round" stroke-linejoin="round">
    <desc>Download more icon variants from https://tabler-icons.io/i/arrow-bear-right-2</desc>
    <path stroke="none" d="M0 0h24v24H0z" fill="none"></path>
    <path d="M15 3h5v5"></path>
    <path d="M20 3l-7.536 7.536a5 5 0 0 0 -1.464 3.534v6.93"></path>
    <path d="M4 5l4.5 4.5"></path>
</svg>
""")

menu = [("Item 1", "item_1_value"), ("Item 2", "item_2_value"), None, ("Item 3", "item_3_value")]

dropdown = Dropdown(icon=svg_icon, label="Dropdown button", button_type="warning", menu=menu)
dropdown_split = Dropdown(label="Split button", button_type="danger", menu=menu, split=True)

checkbox_group = CheckboxGroup(labels=["Option 1", "Option 2", "Option 3"], active=[0, 1])
radio_group = RadioGroup(labels=["Option 1", "Option 2", "Option 3"], active=0)

checkbox_button_group = CheckboxButtonGroup(labels=["Option 1", "Option 2", "Option 3"], active=[0, 1])
radio_button_group = RadioButtonGroup(labels=["Option 1", "Option 2", "Option 3"], active=0)

checkbox_button_group_vertical = CheckboxButtonGroup(labels=["Option 1", "Option 2", "Option 3"], active=[0, 1], orientation="vertical")
radio_button_group_vertical = RadioButtonGroup(labels=["Option 1", "Option 2", "Option 3"], active=0, orientation="vertical")

password_input = PasswordInput(placeholder="Choose your password ...")

text_input = TextInput(placeholder="Enter value ...")

text_input_units = TextInput(title="Initial temperature:", placeholder="Enter temperature ...", prefix="T\u2092", suffix="\u2103")

completions = ["aaa", "aab", "aac", "baa", "caa"]
autocomplete_input = AutocompleteInput(min_characters=0, placeholder="Enter value (auto-complete) ...", completions=completions)

autocomplete_input_includes = AutocompleteInput(min_characters=0, placeholder="Enter value (auto-complete) ...", completions=completions, search_strategy="includes")

text_area = TextAreaInput(placeholder="Enter text ...", cols=20, rows=10, value="uuu")

select = Select(options=["Option 1", "Option 2", "Option 3"])

multi_select = MultiSelect(options=["Option %d" % (i+1) for i in range(16)], size=6)

multi_choice = MultiChoice(options=["Option %d" % (i+1) for i in range(16)], placeholder="Choose your option ...")

slider = Slider(value=10, start=0, end=100, step=0.5)

range_slider = RangeSlider(value=[10, 90], start=0, end=100, step=0.5)

date_slider = DateSlider(value=date(2016, 1, 1), start=date(2015, 1, 1), end=date(2017, 12, 31))

date_range_slider = DateRangeSlider(value=(date(2016, 1, 1), date(2016, 12, 31)), start=date(2015, 1, 1), end=date(2017, 12, 31))

spinner = Spinner(value=100)

page_step_multiplier = ValueOf(obj=spinner, attr="page_step_multiplier")

tooltip_0 = Tooltip(content=HTML(f"""\
<b>Click</b> on arrows to increment/decrement the value or
<br>
<b>press</b> page up / page down keys for quicker updates with a value multiplier
(currently <ref id="{page_step_multiplier.id}"></ref>).
""", refs=[page_step_multiplier]), position="right", target=spinner, closable=True, visible=True)

tooltip_1 = Tooltip(content=HTML("""\
Your <b>choice</b> of color.<br>See more in Bokeh's <a href="https://docs.bokeh.org/en/latest/">docs</a>.
"""), position="right")

color_picker = ColorPicker(color="red", title="Choose color:", description=tooltip_1)

from bokeh import palettes

items = [
    ("YlGn", palettes.YlGn[9]),
    ("YlGnBu", palettes.YlGnBu[9]),
    ("GnBu", palettes.GnBu[9]),
    ("BuGn", palettes.BuGn[9]),
    ("PuBuGn", palettes.PuBuGn[9]),
    ("PuBu", palettes.PuBu[9]),
    ("BuPu", palettes.BuPu[9]),
    ("RdPu", palettes.RdPu[9]),
    ("PuRd", palettes.PuRd[9]),
    ("OrRd", palettes.OrRd[9]),
    ("YlOrRd", palettes.YlOrRd[9]),
    ("YlOrBr", palettes.YlOrBr[9]),
    ("Purples", palettes.Purples[256]),
    ("Blues", palettes.Blues[256]),
    ("Greens", palettes.Greens[256]),
    ("Oranges", palettes.Oranges[256]),
    ("Reds", palettes.Reds[256]),
    ("Greys", palettes.Greys[256]),
    ("PuOr", palettes.PuOr[11]),
    ("BrBG", palettes.BrBG[11]),
    ("PRGn", palettes.PRGn[11]),
    ("PiYG", palettes.PiYG[11]),
    ("RdBu", palettes.RdBu[11]),
    ("RdGy", palettes.RdGy[11]),
    ("RdYlBu", palettes.RdYlBu[11]),
    ("Spectral", palettes.Spectral[11]),
    ("RdYlGn", palettes.RdYlGn[11]),
    ("Accent", palettes.Accent[8]),
    ("Dark2", palettes.Dark2[8]),
    ("Paired", palettes.Paired[12]),
    ("Pastel1", palettes.Pastel1[9]),
    ("Pastel2", palettes.Pastel2[8]),
    ("Set1", palettes.Set1[9]),
    ("Set2", palettes.Set2[8]),
    ("Set3", palettes.Set3[12]),
    ("Magma", palettes.Magma[256]),
    ("Inferno", palettes.Inferno[256]),
    ("Plasma", palettes.Plasma[256]),
    ("Viridis", palettes.Viridis[256]),
    ("Cividis", palettes.Cividis[256]),
    ("Turbo", palettes.Turbo[256]),
]

color_map = ColorMap(title="Choose pallete:", value="PuBu", items=items)

time_picker = TimePicker(title="Time:", seconds=True, second_increment=5)

time_picker_with_a_value = TimePicker(title="Time:", value=time(14, 53, 21), time_format="h:i:S K", seconds=True, second_increment=5)

date_picker = DatePicker(title="Single date:", date_format="F j, Y")

date_picker_with_a_value = DatePicker(title="Single date:", value=date(2022, 2, 8), min_date=date(2022, 2, 1))

date_range_picker = DateRangePicker(title="Date range:", width=400)

multiple_date_picker = MultipleDatePicker(title="Multiple dates:", width=400)

datetime_picker = DatetimePicker(title="Single date and time:", date_format="F j, Y @ H:i:S", seconds=True, second_increment=5, width=250)

datetime_picker_with_a_value = DatetimePicker(title="Single date and time:", value=datetime(2022, 2, 8, 14, 53, 21), min_date=date(2022, 2, 1), width=250)

datetime_range_picker = DatetimeRangePicker(title="Date and time range:", width=400)

multiple_datetime_picker = MultipleDatetimePicker(title="Multiple dates and times:", width=400)

checkbox_0 = Checkbox(active=False, label="Inactive checkbox")

checkbox_1 = Checkbox(active=True, label="Active checkbox")

switch_0 = Switch(active=False)

switch_1 = Switch(active=True, context_menu=Menu())

switch_help = HelpButton(tooltip=Tooltip(content=HTML("""
This is an <b>on</b> or <b>off</b> style of widget.
<br>
Right click on the widget to display the context menu.
"""), position="right"))

group_box = GroupBox(
    title="Head offset:",
    checkable=True,
    child=Column(
        children=[
            TextInput(prefix="X", suffix="mm"),
            TextInput(prefix="Y", suffix="mm"),
            TextInput(prefix="Z", suffix="mm"),
        ],
    ),
)

paragraph = Paragraph(text="some text")

div = Div(text="some <b>text</b>")

pre_text = PreText(text="some text")

def mk_tab(color: str):
    plot = figure(width=300, height=300)
    plot.scatter(flowers["petal_length"], flowers["petal_width"], color=color, fill_alpha=0.2, size=12)
    return TabPanel(title=f"Tab 1: {color.capitalize()}", child=plot, closable=True)

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
            password_input, text_input, text_input_units, autocomplete_input, autocomplete_input_includes, text_area,
            select, multi_select, multi_choice,
            slider, range_slider, date_slider, date_range_slider,
            spinner, color_picker, color_map,
            time_picker, time_picker_with_a_value,
            date_picker, date_picker_with_a_value, date_range_picker, multiple_date_picker,
            datetime_picker, datetime_picker_with_a_value, datetime_range_picker, multiple_datetime_picker,
            checkbox_0,
            checkbox_1,
            Row(children=[switch_0, switch_1, switch_help]),
            group_box,
            paragraph, div, pre_text,
        ]),
        tabs,
    ]),
    table,
])

tooltip_2 = Tooltip(content=HTML("""\
This example shows all widgets available in Bokeh.<br>To learn more about using widgets, see Bokeh's
<a href="https://docs.bokeh.org/en/latest/docs/user_guide/interaction/widgets.html">documentation</a>
regarding this topic.
"""), position="top", attachment="below", target=ByCSS("body"), closable=True, visible=True)

doc = Document()
doc.add_root(widgets)
doc.add_root(dialog)
doc.add_root(tooltip_0)
doc.add_root(tooltip_2)

if __name__ == "__main__":
    doc.validate()
    filename = "widgets.html"
    with open(filename, "w") as f:
        f.write(file_html(doc, title="Widgets"))
    print(f"Wrote {filename}")
    view(filename)
