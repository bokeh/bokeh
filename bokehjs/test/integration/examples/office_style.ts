import {display} from "#framework/layouts"

import {figure} from "@bokehjs/api/plotting"
import {Column, Row, GlobalInlineStyleSheet, TabPanel, Tabs} from "@bokehjs/models"
import {
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
} from "@bokehjs/models/widgets"

describe("Examples", () => {
  it("should support custom styles to follow Office like styling", async () => {
    const url = "/assets/fonts/inter/inter.ttf"
    const font_style = new GlobalInlineStyleSheet({
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
        cursor: pointer;
      }
    `

    const light_dark = new LightDark({active: true, stylesheets: [switch_style]})

    const button_style = `
      .bk-btn {
        background-color: transparent;
        padding: 6px 12px;
        font-size: 14px;
        cursor: pointer;
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
        cursor: pointer;
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
        cursor: pointer;
      }
    `

    const tabs_style = `
      :host {
        --divider: none;
        --margin: 0px;
        border: var(--border);
        border-radius: var(--border-radius);
        cursor: pointer;
      }

      .bk-header {
        --border-color: transparent;
        background-color: var(--primary-color);
      }

      .bk-tab {
        color: var(--background-color);
      }

      .bk-tab.bk-active {
        --active-border-width: 0px;
        font-weight: normal;
      }

      .bk-tab:hover {
        color: var(--color);
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

    const p = figure()

    p.spline([2, 3, 4], [2, 4, 3], {color: "orange", legend_label: "orange", line_width: 4})
    p.spline([2, 3, 4], [4, 5, 4], {color: "red", legend_label: "red", line_width: 4})
    p.spline([4, 3, 2], [4, 3, 2], {color: "blue", legend_label: "blue", line_width: 4})

    p.xaxis.axis_label = "X-Axis"
    p.xaxis.axis_label_text_font = "Inter"
    p.xaxis.axis_label_text_font_size = "22px"
    p.xaxis.major_label_text_font = "Inter"
    p.xaxis.major_label_text_font_size = "12px"

    p.yaxis.axis_label = "Y-Axis"
    p.yaxis.axis_label_text_font = "Inter"
    p.yaxis.axis_label_text_font_size = "26px"
    p.yaxis.major_label_text_font = "Inter"
    p.yaxis.major_label_text_font_size = "12px"

    p.legend.label_text_font = "Inter"
    p.legend.stylesheets = [legend_style]

    const p1 = figure()
    p1.scatter([1, 2, 3, 4, 5], [6, 7, 2, 4, 5], {size: 20, color: "navy", alpha: 0.5})
    p1.xaxis.major_label_text_font = "Segoe UI, Inter"
    p1.xaxis.major_label_text_font_size = "12px"
    p1.xaxis.major_tick_line_color = "transparent"
    p1.xaxis.minor_tick_line_color = "transparent"
    p1.yaxis.major_label_text_font = "Segoe UI, Inter"
    p1.yaxis.major_label_text_font_size = "12px"
    p1.yaxis.major_tick_line_color = "transparent"
    p1.yaxis.minor_tick_line_color = "transparent"

    const p2 = figure()
    p2.line([1, 2, 3, 4, 5], [6, 7, 2, 4, 5], {line_width: 3, color: "navy", alpha: 0.5})
    p2.xaxis.major_label_text_font = "Segoe UI, Inter"
    p2.xaxis.major_label_text_font_size = "12px"
    p2.xaxis.major_tick_line_color = "transparent"
    p2.xaxis.minor_tick_line_color = "transparent"
    p2.yaxis.major_label_text_font = "Segoe UI, Inter"
    p2.yaxis.major_label_text_font_size = "12px"
    p2.yaxis.major_tick_line_color = "transparent"
    p2.yaxis.minor_tick_line_color = "transparent"

    const tab1 = new TabPanel({child: p1, title: "Circle"})
    const tab2 = new TabPanel({child: p2, title: "Line"})
    const tabs = new Tabs({tabs: [tab1, tab2], stylesheets: [tabs_style]})

    const w_columns = [
      new Column({children: [light_dark, w0, w1, w2, w3, w4, w5, w6, tabs]}),
      new Column({children: [w7, w8, w9, w10, w11, w12, p]}),
    ]
    const layout = new Row({children: w_columns, sizing_mode: "stretch_both", stylesheets: [
      font_style,
      `
      :host {
        --bokeh-base-font: Segoe UI, Inter;
        --border-color: var(--color);
        --border-width: 1px;
        --default-border-color: var(--color);
        --bokeh-font-size: 1rem;
        --border-radius: 2px;
        cursor: pointer;
        transition: transform 0.1s ease;
        background-color: var(--background-color);
      }`,
    ]})

    await display(layout, [920, 920])
  })
})
