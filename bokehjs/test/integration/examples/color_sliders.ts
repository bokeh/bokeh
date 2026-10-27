import {display} from "#framework/layouts"

import {Column, Pane, Row} from "@bokehjs/models"
import {Slider} from "@bokehjs/models/widgets"

describe("Examples", () => {
  it("should support custom styles to implement color sliders", async () => {
    const hue_value = 0
    const alpha_value = 0.5

    const box_style = `
      :host {
        width: 200px;
        height: 200px;
        background-color: hsl(${hue_value} 100% 50% / ${alpha_value});
      }
    `

    const box = Pane.create({stylesheets: [box_style]})

    const hue_style = `
      .bk-track {
        background: linear-gradient(to right,
          hsl(0 100% 50%),
          hsl(60 100% 50%),
          hsl(120 100% 50%),
          hsl(180 100% 50%),
          hsl(240 100% 50%),
          hsl(300 100% 50%),
          hsl(360 100% 50%));
      }
      .bk-span {
        opacity: 0;
      }
      .bk-handle {
        background-color: hsl(calc(360*var(--at)) 100% 50%);
      }
    `

    const alpha_style = `
      :host {
        --hue: 0;
      }
      :host {
        --track-size: 3em;
        --handle-size: var(--track-size);
      }
      .bk-track {
        overflow: hidden;
        background:
          linear-gradient(to right, hsl(var(--hue) 100% 50% / 0), hsl(var(--hue) 100% 50% / 1)),
          repeating-conic-gradient(#808080 0% 25%, white 0% 50%) 50% / 20px 20px;
      }
      .bk-handle {
        border: 1px solid white;
        background-color: transparent;
      }
      .bk-span {
        opacity: 0;
      }
    `

    const hue = Slider.create({title: "Hue", value: hue_value, start: 0, end: 360, step: 1, stylesheets: [hue_style]})
    const alpha = Slider.create({title: "Alpha", value: alpha_value, start: 0, end: 1, step: null, stylesheets: [alpha_style]})

    hue.properties.value.change.connect(() => {
      const [base] = alpha.stylesheets
      alpha.stylesheets = [base, `:host { --hue: ${hue.value}; }`]
    })

    const change_fill = () => {
      const color = `hsl(${hue.value} 100% 50% / ${alpha.value})`
      box.styles = {/*TODO ...box.styles, */ "background-color": color}
    }
    hue.properties.value.change.connect(change_fill)
    alpha.properties.value.change.connect(change_fill)

    const sliders = Column.create({children: [hue, alpha]})
    const layout = Row.create({children: [box, sliders], spacing: 10})

    const {view} = await display(layout, [520, 200])

    hue.value = 200
    alpha.value = 0.75

    await view.ready
  })
})
