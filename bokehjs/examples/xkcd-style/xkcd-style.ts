import Bokeh from "/static/js/bokeh.esm.js"
import "/static/js/bokeh-widgets.esm.js"
import "/static/js/bokeh-api.esm.js"

export namespace Xkcd {
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

  const url = "https://cdn.rawgit.com/ipython/xkcd-font/master/xkcd-script/font/xkcd-script.ttf"
  const font_style = new Bokeh.GlobalInlineStyleSheet({
    css: `
        @font-face {
          font-family: 'XKCD';
          src: url(${url});
        }
    `,
  })

  const switch_style = `
    .bk-bar, .bk-knob {
      --border-radius: 20px 5px 20px 5px/5px 20px 5px 20px;
      text-transform: inherit;
      border: var(--border);
      border-radius: var(--border-radius);
      cursor: pointer;
    }
  `

  const light_dark = new LightDark({active: true, stylesheets: [switch_style]})

  const button_style = `
    .bk-btn {
      text-transform: inherit;
    }
  `

  const slider_style = `
    .noUi-target, .noUi-handle {
      --border-radius: 20px 5px 20px 5px/5px 20px 5px 20px;
      text-transform: inherit;
      border: var(--border);
      border-radius: var(--border-radius);
      cursor: pointer;
    }
  `

  const input_style = `
    .bk-input {
      text-transform: inherit;
      font-weight: var(--font-weight);
    }
  `

  const choices_style = `
  `

  const legend_style = `
    :host {
      --border-radius: 20px 5px 20px 5px/5px 20px 5px 20px;
      border: var(--border);
      border-radius: var(--border-radius);
      cursor: pointer;
    }
  `

  const w0 = new Button({label: "Button", stylesheets: [button_style]})
  const w1 = new Toggle({label: "Toggle", stylesheets: [button_style]})
  const w2 = new Dropdown({label: "Dropdown", stylesheets: [button_style]})
  const w3 = new CheckboxGroup({labels: ["Option 1", "Option 2", "Option 3"], active: [0, 1]})
  const w4 = new RadioGroup({labels: ["Option 1", "Option 2", "Option 3"], active: 0})
  const w5 = new CheckboxButtonGroup({labels: ["Option 1", "Option 2", "Option 3"], active: [0, 1], stylesheets: [button_style]})
  const w6 = new RadioButtonGroup({labels: ["Option 1", "Option 2", "Option 3"], active: 0, stylesheets: [button_style]})
  const w7 = new TextInput({title: "Initial temperature:", placeholder: "Enter temperature ...", prefix: "T", suffix: "\u2103", stylesheets: [input_style]})
  const w8 = new PasswordInput({value: "foo", stylesheets: [input_style]})
  const w9 = new AutocompleteInput({
    placeholder: "Enter value ...",
    completions: ["aaa", "aab", "aac", "baa", "caa"],
    stylesheets: [input_style],
  })
  const w10 = new MultiChoice({options: ["Option 1", "Option 2", "Option 3"], stylesheets: [choices_style]})
  const w11 = new Select({options: ["Option 1", "Option 2", "Option 3"], value: "Option 1", stylesheets: [input_style]})
  const w12 = new Slider({value: 10, start: 0, end: 100, step: 0.5, stylesheets: [slider_style]})

  const p = plt.figure()

  p.spline([2, 3, 4], [2, 4, 3], {color: "orange", legend_label: "orange", line_width: 4})
  p.spline([2, 3, 4], [4, 5, 4], {color: "red", legend_label: "red", line_width: 4})
  p.spline([4, 3, 2], [4, 3, 2], {color: "blue", legend_label: "blue", line_width: 4})

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

  const w_columns = [
    new Column({children: [light_dark, w0, w1, w2, w3, w4, w5, w6]}),
    new Column({children: [w7, w8, w9, w10, w11, w12, p]}),
  ]
  const layout = new Row({children: w_columns, sizing_mode: "stretch_both", stylesheets: [
    font_style,
    `
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
    }`,
  ]})

  const doc = new Bokeh.Document()
  doc.add_root(layout)

  const div = document.getElementById("dashboard")!
  void Bokeh.embed.add_document_standalone(doc, div)
}
