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

  const light_dark = LightDark.create({active: true})
  const w0 = Button.create({label: "Button"})
  const w1 = Toggle.create({label: "Toggle"})
  const w2 = Dropdown.create({label: "Dropdown"})
  const w3 = CheckboxGroup.create({labels: ["Option 1", "Option 2", "Option 3"], active: [0, 1]})
  const w4 = RadioGroup.create({labels: ["Option 1", "Option 2", "Option 3"], active: 0})
  const w5 = CheckboxButtonGroup.create({labels: ["Option 1", "Option 2", "Option 3"], active: [0, 1]})
  const w6 = RadioButtonGroup.create({labels: ["Option 1", "Option 2", "Option 3"], active: 0})
  const w7 = TextInput.create({title: "Initial temperature:", placeholder: "Enter temperature ...", prefix: "T", suffix: "\u2103"})
  const w8 = PasswordInput.create({value: "foo"})
  const w9 = AutocompleteInput.create({
    placeholder: "Enter value ...",
    completions: ["aaa", "aab", "aac", "baa", "caa"],
  })
  const w10 = MultiChoice.create({options: ["Option 1", "Option 2", "Option 3"]})
  const w11 = Select.create({options: ["Option 1", "Option 2", "Option 3"], value: "Option 1"})
  const w12 = Slider.create({value: 10, start: 0, end: 100, step: 0.5})
  const w_columns = [
    Column.create({children: [light_dark, w0, w1, w2, w3, w4, w5, w6]}),
    Column.create({children: [w5, w6, w7, w8, w9, w10, w11, w12]}),
  ]
  const layout = Row.create({children: w_columns})

  const doc = new Bokeh.Document()
  doc.add_root(layout)

  const div = document.getElementById("dashboard")!
  void Bokeh.embed.add_document_standalone(doc, div)
}
