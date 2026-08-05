import Bokeh from "/static/js/bokeh.esm.js"
import "/static/js/bokeh-widgets.esm.js"
import "/static/js/bokeh-api.esm.js"

export namespace Accessible {
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

  const switch_style = `
    :host {
      border-radius: 5px;
      border: transparent solid;
    }

    :host(:focus-within) {
      outline: var(--outline);
    }

    :host(:hover) {
      text-decoration: underline;
    }

    :host(.bk-disabled) {
      cursor: default;
      cursor: not-allowed;
      outline: none;
      text-decoration: none;

      & .bk-label {
        color: var(--disabled-color);
      }

      & .bk-body {
        cursor: not-allowed;
      }

      & .bk-knob:before {
        content: "";
        width: 10px;
        height: 2px;
        background-color: var(--inverted-color);
      }

      & .bk-knob:focus-visible {
        outline: none;
      }
    }

    .bk-knob {
      display: flex;
      justify-content: center;
      align-items: center;
    }
  `

  const light_dark = new LightDark({active: true, stylesheets: [switch_style]})

  const button_style = `
    .bk-btn {
      &:hover {
        text-decoration: underline;
      }

      &:focus {
        z-index: 100;
      }
    }

    .bk-btn-default:focus,
    .bk-btn-light:focus {
      --outline: var(--outline-width) var(--outline-style) var(--default-outline-color);
    }

    .bk-btn-primary:focus {
      --outline: var(--outline-width) var(--outline-style) var(--primary-hover-color);
    }

    .bk-btn-success:focus {
      --outline: var(--outline-width) var(--outline-style) var(--success-hover-color);
    }

    .bk-btn-warning:focus {
      --outline: var(--outline-width) var(--outline-style) var(--warning-hover-color);
    }

    .bk-btn-danger:focus {
      --outline: var(--outline-width) var(--outline-style) var(--danger-hover-color);
    }

    .bk-btn-group {
      &.bk-horizontal,
      &.bk-vertical {
        --button-outline-offset: 1px;

        & > .bk-btn-default:focus,
        & > .bk-btn-primary:focus,
        & > .bk-btn-success:focus,
        & > .bk-btn-warning:focus,
        & > .bk-btn-danger:focus,
        & > .bk-btn-light:focus {
          --outline: var(--outline-width) var(--outline-style) var(--outline-color);
        }
      }
    }
  `

  const dropdown_style = `
    .bk-btn:focus {
      outline: 2px solid var(--outline-color);
      outline-offset: 0px;
      border-color: var(--default-border-color);

      & > .bk-caret {
        mask-image: var(--bokeh-icon-chevron-up);
      }
    }

    .bk-caret {
      mask-image: var(--bokeh-icon-chevron-down);
    }
  `

  const slider_style = `
  `

  const input_style = `
    .bk-input {
      &:focus {
        border-width: var(--border-width);
        border-color: var(--outline-color);
        box-shadow: none;
      }

      &:hover {
        background-color: var(--hover-color);
      }

      &:[disabled], &.bk-disabled {
        border-color: var(--disabled-background-color);
      }
    }

    .bk-input-container.bk-input[disabled]:not(:first-child,:last-child),
    .bk-input.bk-disabled:not(:first-child,:last-child) {
      border: var(--border);
    }

    select:not([multiple]), select:not([size]) {
      &.bk-input {
        background-image: var(--bokeh-icon-chevron-down);
        background-size: 16px 16px;
      }
    }

    select:open {
      &:not([multiple]), &:not([size]) {
        &.bk-input {
          height: auto;
          appearance: none;
          -webkit-appearance: none;
          background-image: var(--bokeh-icon-chevron-up);
          background-position: right 0.5em center;
          background-size: 16px 16px;
          background-repeat: no-repeat;
          padding-right: calc(var(--padding-horizontal) + 8px);
          &:hover {
            background-color: var(--background-color);
          }
        }
      }
    }

    .bk-input-group > label:focus-within{
      outline: 2px solid var(--outline-color);
      outline-offset: -1px;
      border-radius: 5px;
    }

    input[type="checkbox"], input[type="radio"] {
      accent-color: var(--primary-color);
      margin: 2px;

      &:focus {
        outline: none;
      }

      & + * {
        position: relative;
        top: -2px;
        margin-left: 3px;
      }

      &+span {
        margin-right: 3px;
      }

      &+span:hover {
        text-decoration: underline;
      }

      &[disabled]+span {
        cursor: not-allowed;
        text-decoration: none;
      }
    }

    input[type="checkbox"]:hover:not([disabled]) {
      accent-color: var(--primary-hover-color);
      outline: 2px solid var(--outline-color);
      outline-offset: -1px;
    }
  `

  const choices_style = `
  `

  const legend_style = `
  `

  const w00 = new Button({label: "Default Button", stylesheets: [button_style]})
  const w01 = new Button({label: "Primary Button", button_type: "primary", stylesheets: [button_style]})
  const w02 = new Button({label: "Success Button", button_type: "success", stylesheets: [button_style]})
  const w03 = new Button({label: "Warning Button", button_type: "warning", stylesheets: [button_style]})
  const w04 = new Button({label: "Danger Button", button_type: "danger", stylesheets: [button_style]})
  const w05 = new Button({label: "Light Button", button_type: "light", stylesheets: [button_style]})
  const w1 = new Toggle({label: "Toggle", stylesheets: [button_style]})
  const w2 = new Dropdown({label: "Dropdown", menu: [["Item 1", "item_1"], ["Item 2", "item_2"], null, ["Item 3", "item_3"]], stylesheets: [button_style, dropdown_style]})
  const w3 = new CheckboxGroup({labels: ["Option 1", "Option 2", "Option 3"], active: [0, 1], stylesheets: [input_style]})
  const w4 = new RadioGroup({labels: ["Option 1", "Option 2", "Option 3"], active: 0, stylesheets: [input_style]})
  const w50 = new CheckboxButtonGroup({labels: ["Option 1", "Option 2", "Option 3"], active: [0, 1], stylesheets: [button_style]})
  const w51 = new CheckboxButtonGroup({labels: ["Option 1", "Option 2", "Option 3"], active: [0, 1], button_type: "primary", stylesheets: [button_style]})
  const w52 = new CheckboxButtonGroup({labels: ["Option 1", "Option 2", "Option 3"], active: [0, 1], button_type: "success", stylesheets: [button_style]})
  const w53 = new CheckboxButtonGroup({labels: ["Option 1", "Option 2", "Option 3"], active: [0, 1], button_type: "warning", stylesheets: [button_style]})
  const w54 = new CheckboxButtonGroup({labels: ["Option 1", "Option 2", "Option 3"], active: [0, 1], button_type: "danger", stylesheets: [button_style]})
  const w55 = new CheckboxButtonGroup({labels: ["Option 1", "Option 2", "Option 3"], active: [0, 1], button_type: "light", stylesheets: [button_style]})
  const w60 = new RadioButtonGroup({labels: ["Option 1", "Option 2", "Option 3"], active: 0, stylesheets: [button_style]})
  const w61 = new RadioButtonGroup({labels: ["Option 1", "Option 2", "Option 3"], active: 0, button_type: "primary", stylesheets: [button_style]})
  const w62 = new RadioButtonGroup({labels: ["Option 1", "Option 2", "Option 3"], active: 0, button_type: "success", stylesheets: [button_style]})
  const w63 = new RadioButtonGroup({labels: ["Option 1", "Option 2", "Option 3"], active: 0, button_type: "warning", stylesheets: [button_style]})
  const w64 = new RadioButtonGroup({labels: ["Option 1", "Option 2", "Option 3"], active: 0, button_type: "danger", stylesheets: [button_style]})
  const w65 = new RadioButtonGroup({labels: ["Option 1", "Option 2", "Option 3"], active: 0, button_type: "light", stylesheets: [button_style]})
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

  p.line([2, 3, 4], [2, 4, 3], {color: "orange", legend_label: "orange", line_width: 4})
  p.line([2, 3, 4], [4, 5, 4], {color: "red", legend_label: "red", line_width: 4})
  p.line([4, 3, 2], [4, 3, 2], {color: "blue", legend_label: "blue", line_width: 4})

  p.xaxis.axis_label = "X-Axis"
  p.yaxis.axis_label = "Y-Axis"

  p.legend.stylesheets = [legend_style]

  const w_columns = [
    new Column({children: [light_dark, w00, w01, w02, w03, w04, w05, w1, w2, w3, w4, w50, w51, w52, w53, w54, w55, w60, w61, w62, w63, w64, w65]}),
    new Column({children: [w7, w8, w9, w10, w11, w12, p]}),
  ]
  const layout = new Row({children: w_columns, sizing_mode: "stretch_both", stylesheets: [
    `
    :host {
      --border-width: 2px;
      --outline-color: #B74CA7;
      --outline-style: solid;
      --outline-width: 2px;
      --outline-offset: 2px;
      --default-outline-color: #5D5E62;
      --menu-item-hover-text-decoration: underline;
      background-color: var(--background-color);
    }`,
  ]})

  const doc = new Bokeh.Document()
  doc.add_root(layout)

  const div = document.getElementById("dashboard")!
  void Bokeh.embed.add_document_standalone(doc, div)
}
