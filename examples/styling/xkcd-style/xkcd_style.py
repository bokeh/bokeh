from bokeh.io import show
from bokeh.layouts import column, row
from bokeh.models import GlobalInlineStyleSheet, InlineStyleSheet, widgets as w
from bokeh.plotting import figure

url = "https://cdn.rawgit.com/ipython/xkcd-font/master/xkcd-script/font/xkcd-script.ttf"
font_style = GlobalInlineStyleSheet(
  css=f"""
      @font-face {{
        font-family: 'XKCD';
        src: url({url});
      }}
  """,
)

switch_style =  InlineStyleSheet(css="""
  .bk-bar, .bk-knob {
    --border-radius: 20px 5px 20px 5px/5px 20px 5px 20px;
    text-transform: inherit;
    border: var(--border);
    border-radius: var(--border-radius);
    cursor: pointer;
  }
""")

light_dark = w.LightDark(active=True, stylesheets=[switch_style])

button_style = InlineStyleSheet(css="""
  .bk-btn {
    text-transform: inherit;
  }
""")

slider_style =  InlineStyleSheet(css="""
  .noUi-target, .noUi-handle {
    --border-radius: 20px 5px 20px 5px/5px 20px 5px 20px;
    text-transform: inherit;
    border: var(--border);
    border-radius: var(--border-radius);
    cursor: pointer;
  }
""")

input_style =  InlineStyleSheet(css="""
  .bk-input {
    text-transform: inherit;
  }
""")

choices_style = InlineStyleSheet(css="""
""")

legend_style = InlineStyleSheet(css="""
  :host {
    --border-radius: 20px 5px 20px 5px/5px 20px 5px 20px;
    border: var(--border);
    border-radius: var(--border-radius);
    cursor: pointer;
  }
""")

w0 = w.Button(label="Button", stylesheets=[button_style])
w1 = w.Toggle(label="Toggle", stylesheets=[button_style])
w2 = w.Dropdown(label="Dropdown", stylesheets=[button_style])
w3 = w.CheckboxGroup(labels=["Option 1", "Option 2", "Option 3"], active=[0, 1])
w4 = w.RadioGroup(labels=["Option 1", "Option 2", "Option 3"], active=0)
w5 = w.CheckboxButtonGroup(labels=["Option 1", "Option 2", "Option 3"], active=[0, 1], stylesheets=[button_style])
w6 = w.RadioButtonGroup(labels=["Option 1", "Option 2", "Option 3"], active=0, stylesheets=[button_style])
w7 = w.TextInput(title="Initial temperature:", placeholder="Enter temperature ...", prefix="T", suffix="\u2103", stylesheets=[input_style])
w8 = w.PasswordInput(value="foo", stylesheets=[input_style])
w9 = w.AutocompleteInput(
  placeholder="Enter value ...",
  completions=["aaa", "aab", "aac", "baa", "caa"],
  stylesheets=[input_style],
)
w10 = w.MultiChoice(options=["Option 1", "Option 2", "Option 3"], stylesheets=[choices_style])
w11 = w.Select(options=["Option 1", "Option 2", "Option 3"], value="Option 1", stylesheets=[input_style])
w12 = w.Slider(value=10, start=0, end=100, step=0.5, stylesheets=[slider_style])

p = figure()

p.line([2, 3, 4], [2, 4, 3], color="orange", legend_label="orange", line_width=4)
p.line([2, 3, 4], [4, 5, 4], color="red", legend_label="red", line_width=4)
p.line([4, 3, 2], [4, 3, 2], color="blue", legend_label="blue", line_width=4)

p.xaxis.axis_label = "X-Axis"
p.xaxis.axis_label_text_font = "XKCD"
p.xaxis.axis_label_text_font_size = "22px"
p.xaxis.major_label_text_font = "XKCD"
p.xaxis.major_label_text_font_size = "12px"

p.yaxis.axis_label = "Y-Axis"
p.yaxis.axis_label_text_font = "XKCD"
p.yaxis.axis_label_text_font_size = "26px"
p.yaxis.major_label_text_font = "XKCD"
p.yaxis.major_label_text_font_size = "12px"

p.legend.label_text_font = "XKCD"
p.legend.stylesheets = [legend_style]

w_columns = [
  column(children=[light_dark, w0, w1, w2, w3, w4, w5, w6]),
  column(children=[w7, w8, w9, w10, w11, w12, p]),
]
layout = row(children=w_columns, sizing_mode="stretch_width", stylesheets=[
  font_style,
  InlineStyleSheet(css="""
  :host {
    --bokeh-base-font: XKCD;
    --border-color: var(--color);
    --border-width: 2px;
    --default-border-color: var(--color);
    --bokeh-font-size: 1rem;
    --border-radius: 20px 5px 20px 5px/5px 20px 5px 20px;
    --border-top-left-radius: 20px 5px;
    --border-top-right-radius: 5px 20px;
    --border-bottom-left-radius: 5px 20px;
    --border-bottom-right-radius: 20px 5px;
    --font-weight: bold;
    text-transform: uppercase;
    cursor: pointer;
    background-color: var(--background-color);
  }"""),
])

show(layout)
