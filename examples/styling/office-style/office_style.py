from bokeh.io import show
from bokeh.layouts import column, row
from bokeh.models import (GlobalInlineStyleSheet, InlineStyleSheet,
                          TabPanel, Tabs, widgets as w)
from bokeh.plotting import figure

url = "https://cdn.jsdelivr.net/npm/inter-font@latest/Inter-VariableFont_slnt,wght.ttf"
font_style = GlobalInlineStyleSheet(**{
  "css": f"""
      @font-face {{
        font-family: 'Inter';
        src: url({url});
      }}
  """,
})

switch_style =  InlineStyleSheet(css="""
  .bk-knob {
    left: 20%;
  }

  :host(.bk-active) .bk-knob {
    left: calc(85% - var(--switch-size));
  }

  :host(.bk-indeterminate) .bk-knob {
    left: calc(70% - var(--switch-size));
    background-color: var(--active-fg);
  }

  .bk-bar, .bk-knob {
    --bar-height: 20px;
    --switch-size: 12px;
    --bar-to-knob-vertical-pos: 40%;
    text-transform: inherit;
    border: var(--border);
  }
""")

light_dark = w.LightDark(active=True, stylesheets=[switch_style])

button_style = InlineStyleSheet(css="""
  .bk-btn {
    background-color: transparent;
    padding: 6px 12px;
    font-size: 14px;
    display: flex;
    align-items: center;
    gap: 6px;
    transition: background-color 0.2s, border-color 0.2s;
  }
""")

slider_style =  InlineStyleSheet(css="""
  .noUi-target, .noUi-handle {
    text-transform: inherit;
    border: var(--border);
    border-radius: var(--border-radius);
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
    border: var(--border);
    border-radius: var(--border-radius);
  }
""")

tabs_style = InlineStyleSheet(css="""
  :host {
    --divider: none;
    --margin: 0px;
    border: var(--border);
    border-radius: var(--border-radius);
  }

  .bk-header {
    --border-color: transparent;
    background-color: var(--primary-color);
  }

  .bk-tab {
    border: none;
    color: light-dark(var(--background-color), var(--color));

    &.bk-active {
      font-weight: normal;
    }

    &:hover {
      color: var(--color);
    }
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
p.xaxis.axis_label_text_font = "Segoe UI, Inter"
p.xaxis.axis_label_text_font_size = "22px"
p.xaxis.major_label_text_font = "Segoe UI, Inter"
p.xaxis.major_label_text_font_size = "12px"

p.yaxis.axis_label = "Y-Axis"
p.yaxis.axis_label_text_font = "Segoe UI, Inter"
p.yaxis.axis_label_text_font_size = "26px"
p.yaxis.major_label_text_font = "Segoe UI, Inter"
p.yaxis.major_label_text_font_size = "12px"

p.legend.label_text_font = "Segoe UI, Inter"
p.legend.stylesheets = [legend_style]

p1 = figure()
p1.scatter([1, 2, 3, 4, 5], [6, 7, 2, 4, 5], size=20, color="navy", alpha=0.5)
p1.xaxis.major_label_text_font = "Segoe UI, Inter"
p1.xaxis.major_label_text_font_size = "12px"
p1.xaxis.major_tick_line_color = None
p1.xaxis.minor_tick_line_color = None
p1.yaxis.major_label_text_font = "Segoe UI, Inter"
p1.yaxis.major_label_text_font_size = "12px"
p1.yaxis.major_tick_line_color = None
p1.yaxis.minor_tick_line_color = None

p2 = figure()
p2.line([1, 2, 3, 4, 5], [6, 7, 2, 4, 5], line_width=3, color="navy", alpha=0.5)
p2.xaxis.major_label_text_font = "Segoe UI, Inter"
p2.xaxis.major_label_text_font_size = "12px"
p2.xaxis.major_tick_line_color = None
p2.xaxis.minor_tick_line_color = None
p2.yaxis.major_label_text_font = "Segoe UI, Inter"
p2.yaxis.major_label_text_font_size = "12px"
p2.yaxis.major_tick_line_color = None
p2.yaxis.minor_tick_line_color = None

tab1 = TabPanel(child=p1, title="Circle")
tab2 = TabPanel(child=p2, title="Line")
tabs = Tabs(tabs=[tab1, tab2], stylesheets=[tabs_style])

w_columns = [
  column(children=[light_dark, w0, w1, w2, w3, w4, w5, w6, tabs]),
  column(children=[w7, w8, w9, w10, w11, w12, p]),
]
layout = row(children=w_columns, sizing_mode="stretch_width", stylesheets=[
  font_style,
  InlineStyleSheet(css="""
  :host {
    --bokeh-base-font: Segoe UI, Inter;
    --border-color: var(--color);
    --border-width: 1px;
    --default-border-color: var(--color);
    --bokeh-font-size: 1rem;
    --border-radius: 2px;
    transition: transform 0.1s ease;
    background-color: var(--background-color);
  }"""),
])

show(layout)
