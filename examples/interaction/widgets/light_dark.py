from bokeh.io import show
from bokeh.layouts import column, row
from bokeh.models import (AutocompleteInput, Button, CheckboxButtonGroup,
                          CheckboxGroup, CustomJS, Dropdown, LightDark,
                          MultiChoice, PasswordInput, RadioButtonGroup,
                          RadioGroup, Select, Slider, TextInput, Toggle)

light_dark = LightDark()
text_scheme = TextInput(
    title="Current color scheme:",
    value="auto",
    disabled=True,
)
light_dark.js_on_change(
    "active",
    CustomJS(
        args=dict(text_scheme=text_scheme),
        code="""
    text_scheme.value = cb_obj.document.config.color_scheme
""",
    ),
)

w0 = Button(label="Button")
w1 = Toggle(label="Toggle")
w2 = Dropdown(label="Dropdown")
w3 = CheckboxGroup(labels=["Option 1", "Option 2", "Option 3"], active=[0, 1])
w4 = RadioGroup(labels=["Option 1", "Option 2", "Option 3"], active=0)
w5 = CheckboxButtonGroup(
    labels=["Option 1", "Option 2", "Option 3"],
    active=[0, 1],
)
w6 = RadioButtonGroup(labels=["Option 1", "Option 2", "Option 3"], active=0)
w7 = TextInput(
    title="Initial temperature:",
    placeholder="Enter temperature ...",
    prefix="T",
    suffix="\u2103",
)
w8 = PasswordInput(value="foo")
w9 = AutocompleteInput(
    placeholder="Enter value ...",
    completions=["aaa", "aab", "aac", "baa", "caa"],
)
w10 = MultiChoice(options=["Option 1", "Option 2", "Option 3"])
w11 = Select(options=["Option 1", "Option 2", "Option 3"], value="Option 1")
w12 = Slider(value=10, start=0, end=100, step=0.5)

w_columns = [
    column([light_dark, text_scheme, w0, w1, w2, w3, w4]),
    column([w5, w6, w7, w8, w9, w10, w11, w12]),
]

show(
    row(
        w_columns,
        stylesheets=[
            ":host { background-color: var(--background-color); color: var(--color);}",
        ],
    ),
)
