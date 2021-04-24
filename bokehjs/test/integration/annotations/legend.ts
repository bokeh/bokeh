import {display, fig} from "../_util"

import {Legend, LegendItem, LinearAxis} from "@bokehjs/models"
import {Random} from "@bokehjs/core/util/random"
import {range} from "@bokehjs/core/util/array"

describe("Legend annotation", () => {
  it(`should support various combinations of locations and orientations`, async () => {
    const random = new Random(1)

    const p = fig([600, 600])
    p.add_layout(new LinearAxis(), "above")
    p.add_layout(new LinearAxis(), "right")

    const x = range(0, 10)
    const y0 = random.floats(10)
    const y1 = random.floats(10)
    const y2 = random.floats(10)

    const cr0 = p.circle(x, y0, {fill_color: "red"})

    const cr1 = p.circle(x, y1, {fill_color: "blue"})
    const lr1 = p.line(x, y1, {line_color: "orange"})

    const cr2 = p.circle(x, y2, {fill_color: "green"})

    const items = [
      new LegendItem({label: "#0", renderers: [cr0]}),
      new LegendItem({label: "#1", renderers: [cr1, lr1]}),
      new LegendItem({label: "#2", renderers: [cr2]}),
    ]

    const legend = (attrs: Partial<Legend.Attrs>) => {
      return new Legend({items, background_fill_alpha: 0.7, ...attrs})
    }

    p.add_layout(legend({location: "center_left", orientation: "vertical"}))
    p.add_layout(legend({location: "center", orientation: "vertical"}))
    p.add_layout(legend({location: "top_center", orientation: "horizontal"}))
    p.add_layout(legend({location: "top_right", orientation: "horizontal"}))
    p.add_layout(legend({location: "bottom_right", orientation: "horizontal"}))
    p.add_layout(legend({location: [0, 0], orientation: "vertical"}))

    p.add_layout(legend({location: "center", orientation: "horizontal"}), "above")
    p.add_layout(legend({location: "center", orientation: "horizontal"}), "below")
    p.add_layout(legend({location: "center", orientation: "vertical"}), "left")
    p.add_layout(legend({location: "center", orientation: "vertical"}), "right")

    await display(p)
  })

  it(`should display title correctly`, async () => {
    const p = fig([225, 125])
    p.add_layout(new LinearAxis(), "above")
    p.add_layout(new LinearAxis(), "right")

    const x = 2
    const y = 1
    const cr = p.circle(x, y, {fill_color: "red"})

    const items = [new LegendItem({label: "#0", renderers: [cr]})]

    p.add_layout(new Legend({
      items,
      background_fill_alpha: 0.7,
      location: "top_left",
      orientation: "vertical",
      title: "title",
    }))

    await display(p)
  })

  it(`should display title standoff correctly`, async () => {
    const p = fig([225, 125])
    p.add_layout(new LinearAxis(), "above")
    p.add_layout(new LinearAxis(), "right")

    const x = 2
    const y = 1
    const cr = p.circle(x, y, {fill_color: "red"})

    const items = [new LegendItem({label: "#0", renderers: [cr]})]

    p.add_layout(new Legend({
      items,
      background_fill_alpha: 0.7,
      location: "top_left",
      orientation: "vertical",
      title: "title",
      title_standoff: 20,
    }))

    await display(p)
  })

  it(`should display label standoff correctly`, async () => {
    const p = fig([225, 125])
    p.add_layout(new LinearAxis(), "above")
    p.add_layout(new LinearAxis(), "right")

    const x = 2
    const y = 1
    const cr = p.circle(x, y, {fill_color: "red"})

    const items = [new LegendItem({label: "#0", renderers: [cr]})]

    p.add_layout(new Legend({
      items,
      background_fill_alpha: 0.7,
      location: "top_left",
      orientation: "vertical",
      title: "title",
      label_standoff: 20,
    }))

    await display(p)
  })

  it(`should display glyph_height correctly`, async () => {
    const p = fig([225, 125])
    p.add_layout(new LinearAxis(), "above")
    p.add_layout(new LinearAxis(), "right")

    const x = 2
    const y = 1
    const cr = p.circle(x, y, {fill_color: "red"})

    const items = [new LegendItem({label: "#0", renderers: [cr]})]

    p.add_layout(new Legend({
      items,
      background_fill_alpha: 0.7,
      location: "top_left",
      orientation: "vertical",
      title: "title",
      glyph_height: 50,
    }))

    await display(p)
  })

  it(`should display glyph_width correctly`, async () => {
    const p = fig([225, 125])
    p.add_layout(new LinearAxis(), "above")
    p.add_layout(new LinearAxis(), "right")

    const x = 2
    const y = 1
    const cr = p.circle(x, y, {fill_color: "red"})

    const items = [new LegendItem({label: "#0", renderers: [cr]})]

    p.add_layout(new Legend({
      items,
      background_fill_alpha: 0.7,
      location: "top_left",
      orientation: "vertical",
      title: "title",
      glyph_width: 50,
    }))

    await display(p)
  })

  it(`should display label_height correctly`, async () => {
    const p = fig([225, 125])
    p.add_layout(new LinearAxis(), "above")
    p.add_layout(new LinearAxis(), "right")

    const x = 2
    const y = 1
    const cr = p.circle(x, y, {fill_color: "red"})

    const items = [new LegendItem({label: "#0", renderers: [cr]})]

    p.add_layout(new Legend({
      items,
      background_fill_alpha: 0.7,
      location: "top_left",
      orientation: "vertical",
      title: "title",
      label_height: 50,
    }))

    await display(p)
  })

  it(`should display label_width correctly`, async () => {
    const p = fig([225, 125])
    p.add_layout(new LinearAxis(), "above")
    p.add_layout(new LinearAxis(), "right")

    const x = 2
    const y = 1
    const cr = p.circle(x, y, {fill_color: "red"})

    const items = [new LegendItem({label: "#0", renderers: [cr]})]

    p.add_layout(new Legend({
      items,
      background_fill_alpha: 0.7,
      location: "top_left",
      orientation: "vertical",
      title: "title",
      label_width: 50,
    }))

    await display(p)
  })

  it(`should display margin correctly`, async () => {
    const p = fig([225, 125])
    p.add_layout(new LinearAxis(), "above")
    p.add_layout(new LinearAxis(), "right")

    const x = 2
    const y = 1
    const cr = p.circle(x, y, {fill_color: "red"})

    const items = [new LegendItem({label: "#0", renderers: [cr]})]

    p.add_layout(new Legend({
      items,
      background_fill_alpha: 0.7,
      location: "top_left",
      orientation: "vertical",
      title: "title",
      margin: 0,
    }))

    await display(p)
  })

  it(`should display padding correctly`, async () => {
    const p = fig([225, 125])
    p.add_layout(new LinearAxis(), "above")
    p.add_layout(new LinearAxis(), "right")

    const x = 2
    const y = 1
    const cr = p.circle(x, y, {fill_color: "red"})

    const items = [new LegendItem({label: "#0", renderers: [cr]})]

    p.add_layout(new Legend({
      items,
      background_fill_alpha: 0.7,
      location: "top_left",
      orientation: "vertical",
      title: "title",
      padding: 5,
    }))

    await display(p)
  })

  it(`should display spacing correctly`, async () => {
    const p = fig([200, 150])
    p.add_layout(new LinearAxis(), "above")
    p.add_layout(new LinearAxis(), "right")

    const x = 2
    const y = 1
    const cr0 = p.circle(x, y, {fill_color: "red"})
    const cr1 = p.circle(x, y + 1, {fill_color: "blue"})

    const items = [
      new LegendItem({label: "#0", renderers: [cr0]}),
      new LegendItem({label: "#1", renderers: [cr1]}),
    ]

    p.add_layout(new Legend({
      items,
      background_fill_alpha: 0.7,
      location: "top_left",
      orientation: "vertical",
      spacing: 20,
    }))

    await display(p)
  })
})
