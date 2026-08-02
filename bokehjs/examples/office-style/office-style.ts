import Bokeh from "/static/js/bokeh.esm.js"
import "/static/js/bokeh-widgets.esm.js"
import "/static/js/bokeh-api.esm.js"

export namespace Office {
  import plt = Bokeh.Plotting
  console.log(`Bokeh ${Bokeh.version}`)
  Bokeh.set_log_level("info")

  const {Column, Row} = Bokeh
  const {
    AutocompleteInput,
    Button,
    CheckboxButtonGroup,
    CheckboxGroup,
    Dropdown,
    LightDark,
    MultiChoice,
    PasswordInput,
    RadioButtonGroup,
    RadioGroup,
    Select,
    Slider,
    TextInput,
    Toggle,
  } = Bokeh.Widgets

  const url = "https://cdn.jsdelivr.net/npm/inter-font@latest/Inter-VariableFont_slnt,wght.ttf"
  const font_style = Bokeh.GlobalInlineStyleSheet.create({
    css: `
        @font-face {
          font-family: 'Inter';
          src: url(${url});
        }
    `,
  })

  const switch_style = `
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
  `

  const light_dark = LightDark.create({active: true, stylesheets: [switch_style]})

  const button_style = `
    .bk-btn {
      background-color: transparent;
      padding: 6px 12px;
      font-size: 14px;
      display: flex;
      align-items: center;
      gap: 6px;
      transition: background-color 0.2s, border-color 0.2s;
    }
  `

  const slider_style = `
    .noUi-target, .noUi-handle {
      text-transform: inherit;
      border: var(--border);
      border-radius: var(--border-radius);
    }
  `

  const input_style = `
    .bk-input {
      text-transform: inherit;
    }
  `

  const choices_style = `
  `

  const legend_style = `
    :host {
      border: var(--border);
      border-radius: var(--border-radius);
    }
  `

  const tabs_style = `
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
    }

    .bk-tab.bk-active {
      font-weight: normal;
    }

    .bk-tab:hover {
      color: var(--color);
    }
  `

  const w0 = Button.create({label: "Button", stylesheets: [button_style]})
  const w1 = Toggle.create({label: "Toggle", stylesheets: [button_style]})
  const w2 = Dropdown.create({label: "Dropdown", stylesheets: [button_style]})
  const w3 = CheckboxGroup.create({labels: ["Option 1", "Option 2", "Option 3"], active: [0, 1]})
  const w4 = RadioGroup.create({labels: ["Option 1", "Option 2", "Option 3"], active: 0})
  const w5 = CheckboxButtonGroup.create({labels: ["Option 1", "Option 2", "Option 3"], active: [0, 1], stylesheets: [button_style]})
  const w6 = RadioButtonGroup.create({labels: ["Option 1", "Option 2", "Option 3"], active: 0, stylesheets: [button_style]})
  const w7 = TextInput.create({title: "Initial temperature:", placeholder: "Enter temperature ...", prefix: "T", suffix: "\u2103", stylesheets: [input_style]})
  const w8 = PasswordInput.create({value: "foo", stylesheets: [input_style]})
  const w9 = AutocompleteInput.create({
    placeholder: "Enter value ...",
    completions: ["aaa", "aab", "aac", "baa", "caa"],
    stylesheets: [input_style],
  })
  const w10 = MultiChoice.create({options: ["Option 1", "Option 2", "Option 3"], stylesheets: [choices_style]})
  const w11 = Select.create({options: ["Option 1", "Option 2", "Option 3"], value: "Option 1", stylesheets: [input_style]})
  const w12 = Slider.create({value: 10, start: 0, end: 100, step: 0.5, stylesheets: [slider_style]})

  const p = plt.figure()

  p.line([2, 3, 4], [2, 4, 3], {color: "orange", legend_label: "orange", line_width: 4})
  p.line([2, 3, 4], [4, 5, 4], {color: "red", legend_label: "red", line_width: 4})
  p.line([4, 3, 2], [4, 3, 2], {color: "blue", legend_label: "blue", line_width: 4})

  p.xaxis.axis_label = "X-Axis"
  p.xaxis.axis_label_text_font = "Segoe UI, Inter"
  p.xaxis.axis_label_text_font_size = "22px"
  p.xaxis.major_label_text_font = "Segoe UI, Inter"
  p.xaxis.major_label_text_font_size = "12px"
  p.xaxis.major_tick_line_color = "transparent"
  p.xaxis.minor_tick_line_color = "transparent"

  p.yaxis.axis_label = "Y-Axis"
  p.yaxis.axis_label_text_font = "Segoe UI, Inter"
  p.yaxis.axis_label_text_font_size = "26px"
  p.yaxis.major_label_text_font = "Segoe UI, Inter"
  p.yaxis.major_label_text_font_size = "12px"
  p.yaxis.major_tick_line_color = "transparent"
  p.yaxis.minor_tick_line_color = "transparent"

  p.legend.label_text_font = "Segoe UI, Inter"
  p.legend.stylesheets = [legend_style]

  const p1 = plt.figure()
  p1.scatter([1, 2, 3, 4, 5], [6, 7, 2, 4, 5], {size: 20, color: "navy", alpha: 0.5})
  p1.xaxis.major_label_text_font = "Segoe UI, Inter"
  p1.xaxis.major_label_text_font_size = "12px"
  p1.xaxis.major_tick_line_color = "transparent"
  p1.xaxis.minor_tick_line_color = "transparent"
  p1.yaxis.major_label_text_font = "Segoe UI, Inter"
  p1.yaxis.major_label_text_font_size = "12px"
  p1.yaxis.major_tick_line_color = "transparent"
  p1.yaxis.minor_tick_line_color = "transparent"

  const p2 = plt.figure()
  p2.line([1, 2, 3, 4, 5], [6, 7, 2, 4, 5], {line_width: 3, color: "navy", alpha: 0.5})
  p2.xaxis.major_label_text_font = "Segoe UI, Inter"
  p2.xaxis.major_label_text_font_size = "12px"
  p2.xaxis.major_tick_line_color = "transparent"
  p2.xaxis.minor_tick_line_color = "transparent"
  p2.yaxis.major_label_text_font = "Segoe UI, Inter"
  p2.yaxis.major_label_text_font_size = "12px"
  p2.yaxis.major_tick_line_color = "transparent"
  p2.yaxis.minor_tick_line_color = "transparent"

  const tab1 = Bokeh.TabPanel.create({child: p1, title: "Circle"})
  const tab2 = Bokeh.TabPanel.create({child: p2, title: "Line"})
  const tabs = Bokeh.Tabs.create({tabs: [tab1, tab2], stylesheets: [tabs_style]})

  const w_columns = [
    Column.create({children: [light_dark, w0, w1, w2, w3, w4, w5, w6, tabs]}),
    Column.create({children: [w7, w8, w9, w10, w11, w12, p]}),
  ]
  const layout = Row.create({children: w_columns, sizing_mode: "stretch_both", stylesheets: [
    font_style,
    `
    :host {
      --bokeh-base-font: Segoe UI, Inter;
      --border-color: var(--color);
      --border-width: 1px;
      --default-border-color: var(--color);
      --bokeh-font-size: 1rem;
      --border-radius: 2px;
      transition: transform 0.1s ease;
      background-color: var(--background-color);
    }`,
  ]})

  const doc = new Bokeh.Document()
  doc.add_root(layout)

  const div = document.getElementById("dashboard")!
  void Bokeh.embed.add_document_standalone(doc, div)
}
