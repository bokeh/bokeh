import Bokeh from "/static/js/bokeh.esm.js"
import "/static/js/bokeh-widgets.esm.js"
import "/static/js/bokeh-api.esm.js"

export namespace Anscombe {
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

  const light_dark = new LightDark({active: true})
  const w0 = new Button({label: "Button"})
  const w1 = new Toggle({label: "Toggle"})
  const w2 = new Dropdown({label: "Dropdown"})
  const w3 = new CheckboxGroup({labels: ["Option 1", "Option 2", "Option 3"], active: [0, 1]})
  const w4 = new RadioGroup({labels: ["Option 1", "Option 2", "Option 3"], active: 0})
  const w5 = new CheckboxButtonGroup({labels: ["Option 1", "Option 2", "Option 3"], active: [0, 1]})
  const w6 = new RadioButtonGroup({labels: ["Option 1", "Option 2", "Option 3"], active: 0})
  const w7 = new TextInput({title: "Initial temperature:", placeholder: "Enter temperature ...", prefix: "T", suffix: "\u2103"})
  const w8 = new PasswordInput({value: "foo"})
  const w9 = new AutocompleteInput({
    placeholder: "Enter value ...",
    completions: ["aaa", "aab", "aac", "baa", "caa"],
  })
  const w10 = new MultiChoice({options: ["Option 1", "Option 2", "Option 3"]})
  const w11 = new Select({options: ["Option 1", "Option 2", "Option 3"], value: "Option 1"})
  const w12 = new Slider({value: 10, start: 0, end: 100, step: 0.5})
  const w_columns = [
    new Column({children: [light_dark, w0, w1, w2, w3, w4, w5, w6]}),
    new Column({children: [w5, w6, w7, w8, w9, w10, w11, w12]}),
  ]
  const layout = new Row({children: w_columns})

  const doc = new Bokeh.Document()
  doc.add_root(layout)

  const div = document.getElementById("dashboard")!
  void Bokeh.embed.add_document_standalone(doc, div)
}
