import {display, fig} from "../_util"

import {
  ColorBar, LinearAxis,
  ColorMapper, LinearColorMapper, LogColorMapper, EqHistColorMapper, CategoricalColorMapper,
} from "@bokehjs/models"

import {Random} from "@bokehjs/core/util/random"
import {range} from "@bokehjs/core/util/array"
import {Side} from "@bokehjs/core/enums"
import {Spectral11} from "@bokehjs/api/palettes"

describe("ColorBar annotation", () => {
  it(`should support various combinations of locations and orientations`, async () => {
    const random = new Random(1)

    const p = fig([600, 600], {border_fill_color: "lightgray"})
    p.add_layout(new LinearAxis(), "above")
    p.add_layout(new LinearAxis(), "right")

    const x = range(0, 10)
    const y0 = random.floats(10)
    const y1 = random.floats(10)
    const y2 = random.floats(10)

    p.circle(x, y0, {fill_color: "red"})

    p.circle(x, y1, {fill_color: "blue"})
    p.line(x, y1, {line_color: "orange"})

    p.circle(x, y2, {fill_color: "green"})

    const color_bar = (attrs: Partial<ColorBar.Attrs>) => {
      const color_mapper = new LinearColorMapper({palette: Spectral11, low: -2, high: 5})
      return new ColorBar({
        color_mapper,
        title: "Unspecified title",
        border_line_color: "black", background_fill_color: "white", background_fill_alpha: 0.9,
        ...attrs,
      })
    }

    p.add_layout(color_bar({orientation: "horizontal"}), "above")
    p.add_layout(color_bar({orientation: "horizontal", width: 150}), "above")

    p.add_layout(color_bar({orientation: "horizontal"}), "below")
    p.add_layout(color_bar({orientation: "horizontal", width: 150}), "below")

    p.add_layout(color_bar({orientation: "vertical"}), "left")
    p.add_layout(color_bar({orientation: "vertical", height: 150}), "left")

    p.add_layout(color_bar({orientation: "vertical"}), "right")
    p.add_layout(color_bar({orientation: "vertical", height: 150}), "right")

    await display(p)
  })

  it(`should support horizontal orientation and positioning within the center panel`, async () => {
    const random = new Random(1)

    const color_mapper = new LinearColorMapper({palette: Spectral11})
    function color_bar(attrs: Partial<ColorBar.Attrs>) {
      return new ColorBar({
        color_mapper,
        orientation: "horizontal",
        width: 120,
        margin: 15,
        padding: 10,
        border_line_color: "gray",
        ...attrs,
      })
    }

    const p = fig([600, 600], {border_fill_color: "lightgray"})

    const N = 100
    const x = range(0, N)
    const y = random.floats(N)

    p.circle(x, y, {fill_color: {field: "y", transform: color_mapper}, size: 10})

    p.add_layout(color_bar({location: "bottom_left", title: "Bottom left"}), "center")
    p.add_layout(color_bar({location: "bottom_center", title: "Bottom center"}), "center")
    p.add_layout(color_bar({location: "bottom_right", title: "Bottom right"}), "center")
    p.add_layout(color_bar({location: "top_left", title: "Top left"}), "center")
    p.add_layout(color_bar({location: "top_center", title: "Top center"}), "center")
    p.add_layout(color_bar({location: "top_right", title: "Top right"}), "center")
    p.add_layout(color_bar({location: "center_left", title: "Center left"}), "center")
    p.add_layout(color_bar({location: "center", title: "Center center"}), "center")
    p.add_layout(color_bar({location: "center_right", title: "Center right"}), "center")
    p.add_layout(color_bar({location: [75, 125], title: "x=75, y=125"}), "center")
    p.add_layout(color_bar({location: [75, 350], title: "x=75, y=350, width=auto", width: "auto"}), "center")

    await display(p)
  })

  it(`should support vertical orientation and positioning within the center panel`, async () => {
    const random = new Random(1)

    const color_mapper = new LinearColorMapper({palette: Spectral11})
    function color_bar(attrs: Partial<ColorBar.Attrs>) {
      return new ColorBar({
        color_mapper,
        orientation: "vertical",
        height: 120,
        margin: 15,
        padding: 10,
        border_line_color: "gray",
        ...attrs,
      })
    }

    const p = fig([600, 600], {border_fill_color: "lightgray"})

    const N = 100
    const x = range(0, N)
    const y = random.floats(N)

    p.circle(x, y, {fill_color: {field: "y", transform: color_mapper}, size: 10})

    p.add_layout(color_bar({location: "bottom_left", title: "Bottom left"}), "center")
    p.add_layout(color_bar({location: "bottom_center", title: "Bottom center"}), "center")
    p.add_layout(color_bar({location: "bottom_right", title: "Bottom right"}), "center")
    p.add_layout(color_bar({location: "top_left", title: "Top left"}), "center")
    p.add_layout(color_bar({location: "top_center", title: "Top center"}), "center")
    p.add_layout(color_bar({location: "top_right", title: "Top right"}), "center")
    p.add_layout(color_bar({location: "center_left", title: "Center left"}), "center")
    p.add_layout(color_bar({location: "center", title: "Center center"}), "center")
    p.add_layout(color_bar({location: "center_right", title: "Center right"}), "center")
    p.add_layout(color_bar({location: [125, 75], title: "x=125, y=75"}), "center")
    p.add_layout(color_bar({location: [350, 75], title: "x=350, y=75, height=auto", height: "auto"}), "center")

    await display(p)
  })

  describe("should support various locations within side panels", () => {
    const random = new Random(1)

    const N = 100
    const x = range(0, N)
    const y = random.floats(N)

    function color_bar(attrs: Partial<ColorBar.Attrs>) {
      return new ColorBar({
        padding: 10,
        border_line_color: "gray",
        ...attrs,
      })
    }

    it("below the frame", async () => {
      const color_mapper = new LinearColorMapper({palette: Spectral11})
      const p = fig([300, 600], {border_fill_color: "lightgray"})
      p.circle(x, y, {fill_color: {field: "y", transform: color_mapper}, size: 10})

      p.add_layout(color_bar({color_mapper, width: 100, location: "left", title: "Left"}), "below")
      p.add_layout(color_bar({color_mapper, width: 100, location: "center", title: "Center"}), "below")
      p.add_layout(color_bar({color_mapper, width: 100, location: "right", title: "Right"}), "below")
      p.add_layout(color_bar({color_mapper, width: 100, location: [35, 0], title: "x=35, y=0"}), "below")

      await display(p)
    })

    it("above the frame", async () => {
      const color_mapper = new LinearColorMapper({palette: Spectral11})
      const p = fig([300, 600], {border_fill_color: "lightgray"})
      p.circle(x, y, {fill_color: {field: "y", transform: color_mapper}, size: 10})

      p.add_layout(color_bar({color_mapper, width: 100, location: "left", title: "Left"}), "above")
      p.add_layout(color_bar({color_mapper, width: 100, location: "center", title: "Center"}), "above")
      p.add_layout(color_bar({color_mapper, width: 100, location: "right", title: "Right"}), "above")
      p.add_layout(color_bar({color_mapper, width: 100, location: [35, 0], title: "x=35, y=0"}), "above")

      await display(p)
    })

    it("left of the frame", async () => {
      const color_mapper = new LinearColorMapper({palette: Spectral11})
      const p = fig([600, 300], {border_fill_color: "lightgray"})
      p.circle(x, y, {fill_color: {field: "y", transform: color_mapper}, size: 10})

      p.add_layout(color_bar({color_mapper, height: 100, location: "top", title: "Top"}), "left")
      p.add_layout(color_bar({color_mapper, height: 100, location: "center", title: "Center"}), "left")
      p.add_layout(color_bar({color_mapper, height: 100, location: "bottom", title: "Bottom"}), "left")
      p.add_layout(color_bar({color_mapper, height: 100, location: [0, 35], title: "x=0, y=35"}), "left")

      await display(p)
    })

    it("right of the frame", async () => {
      const color_mapper = new LinearColorMapper({palette: Spectral11})
      const p = fig([600, 300], {border_fill_color: "lightgray"})

      p.circle(x, y, {fill_color: {field: "y", transform: color_mapper}, size: 10})
      p.add_layout(color_bar({color_mapper, height: 100, location: "top", title: "Top"}), "right")
      p.add_layout(color_bar({color_mapper, height: 100, location: "center", title: "Center"}), "right")
      p.add_layout(color_bar({color_mapper, height: 100, location: "bottom", title: "Bottom"}), "right")
      p.add_layout(color_bar({color_mapper, height: 100, location: [0, 35], title: "x=0, y=35"}), "right")

      await display(p)
    })
  })

  function make_plot(color_mapper: ColorMapper, color_bar: ColorBar, side: Side) {
    const random = new Random(1)

    const horizontal = side == "above" || side == "below"
    const n = 30
    const [a, b] = horizontal ? [10, 5] : [5, 10]
    const x = random.floats(n, 0, a)
    const y = random.floats(n, 0, b)
    const r = random.floats(n, 0.1, 0.5)
    const v = random.floats(n, 0, 100)

    const [l, s] = [500, 200]
    const p = (() => {
      if (horizontal)
        return fig([l, s], {x_axis_location: side, border_fill_color: "lightgray"})
      else
        return fig([s, l], {y_axis_location: side, border_fill_color: "lightgray"})
    })()
    p.circle({x, y, radius: r, fill_color: {field: "values", transform: color_mapper}, source: {values: v}})

    color_bar.title = "Unspecified title"
    color_bar.border_line_color = "black"

    p.add_layout(color_bar, side)
    return p
  }

  it(`should allow to be placed above frame in horizontal (auto) orientation`, async () => {
    const color_mapper = new LinearColorMapper({palette: Spectral11})
    const color_bar = new ColorBar({color_mapper})
    const p = make_plot(color_mapper, color_bar, "above")
    await display(p)
  })

  it(`should allow to be placed above frame in horizontal (auto) orientation with height=50px`, async () => {
    const color_mapper = new LinearColorMapper({palette: Spectral11})
    const color_bar = new ColorBar({color_mapper, height: 50})
    const p = make_plot(color_mapper, color_bar, "above")
    await display(p)
  })

  it(`should allow to be placed above frame in vertical orientation`, async () => {
    const color_mapper = new LinearColorMapper({palette: Spectral11})
    const color_bar = new ColorBar({color_mapper, orientation: "vertical", width: 200, height: 100})
    const p = make_plot(color_mapper, color_bar, "above")
    await display(p)
  })

  it(`should allow to be placed below frame in horizontal (auto) orientation`, async () => {
    const color_mapper = new LinearColorMapper({palette: Spectral11})
    const color_bar = new ColorBar({color_mapper})
    const p = make_plot(color_mapper, color_bar, "below")
    await display(p)
  })

  it(`should allow to be placed below frame in horizontal (auto) orientation with height=50px`, async () => {
    const color_mapper = new LinearColorMapper({palette: Spectral11})
    const color_bar = new ColorBar({color_mapper, height: 50})
    const p = make_plot(color_mapper, color_bar, "below")
    await display(p)
  })

  it(`should allow to be placed below frame in vertical orientation`, async () => {
    const color_mapper = new LinearColorMapper({palette: Spectral11})
    const color_bar = new ColorBar({color_mapper, orientation: "vertical", width: 200, height: 100})
    const p = make_plot(color_mapper, color_bar, "below")
    await display(p)
  })

  it(`should allow to be placed left of frame in vertical (auto) orientation`, async () => {
    const color_mapper = new LinearColorMapper({palette: Spectral11})
    const color_bar = new ColorBar({color_mapper})
    const p = make_plot(color_mapper, color_bar, "left")
    await display(p)
  })

  it(`should allow to be placed left of frame in vertical (auto) orientation with width=50px`, async () => {
    const color_mapper = new LinearColorMapper({palette: Spectral11})
    const color_bar = new ColorBar({color_mapper, width: 50})
    const p = make_plot(color_mapper, color_bar, "left")
    await display(p)
  })

  it(`should allow to be placed left of frame in horizontal orientation`, async () => {
    const color_mapper = new LinearColorMapper({palette: Spectral11})
    const color_bar = new ColorBar({color_mapper, orientation: "horizontal", width: 100, height: 200})
    const p = make_plot(color_mapper, color_bar, "left")
    await display(p)
  })

  it(`should allow to be placed right of frame in vertical (auto) orientation`, async () => {
    const color_mapper = new LinearColorMapper({palette: Spectral11})
    const color_bar = new ColorBar({color_mapper})
    const p = make_plot(color_mapper, color_bar, "right")
    await display(p)
  })

  it(`should allow to be placed right of frame in vertical (auto) orientation with width=50px`, async () => {
    const color_mapper = new LinearColorMapper({palette: Spectral11})
    const color_bar = new ColorBar({color_mapper, width: 50})
    const p = make_plot(color_mapper, color_bar, "right")
    await display(p)
  })

  it(`should allow to be placed right of frame in horizontal orientation`, async () => {
    const color_mapper = new LinearColorMapper({palette: Spectral11})
    const color_bar = new ColorBar({color_mapper, orientation: "horizontal", width: 100, height: 200})
    const p = make_plot(color_mapper, color_bar, "right")
    await display(p)
  })

  it(`should support LinearColorMapper`, async () => {
    const random = new Random(1)

    const color_mapper = new LinearColorMapper({palette: Spectral11})
    const color_bar = new ColorBar({color_mapper, title: "Unspecified title", border_line_color: "black"})

    const n = 30
    const x = random.floats(n, 0, 10)
    const y = random.floats(n, 0, 5)
    const r = random.floats(n, 0.1, 0.5)
    const v = random.floats(n, 0, 100)

    const p = fig([500, 200], {border_fill_color: "lightgray"})
    p.circle({x, y, radius: r, fill_color: {field: "values", transform: color_mapper}, source: {values: v}})
    p.add_layout(color_bar, "below")

    await display(p)
  })

  it(`should support LogColorMapper`, async () => {
    const random = new Random(1)

    const color_mapper = new LogColorMapper({palette: Spectral11})
    const color_bar = new ColorBar({color_mapper, title: "Unspecified title", border_line_color: "black"})

    const n = 30
    const x = random.floats(n, 0, 10)
    const y = random.floats(n, 0, 5)
    const r = random.floats(n, 0.1, 0.5)
    const v = [
      ...random.floats(n/3, 7, 13),
      ...random.floats(n/3, 70, 130),
      ...random.floats(n/3, 700, 1300),
    ]

    const p = fig([500, 200], {border_fill_color: "lightgray"})
    p.circle({x, y, radius: r, fill_color: {field: "values", transform: color_mapper}, source: {values: v}})
    p.add_layout(color_bar, "below")

    await display(p)
  })

  it(`should support EqHistColorMapper`, async () => {
    const random = new Random(1)

    const color_mapper = new EqHistColorMapper({palette: Spectral11})
    const color_bar = new ColorBar({color_mapper, title: "Unspecified title", border_line_color: "black"})

    const n = 30
    const x = random.floats(n, 0, 10)
    const y = random.floats(n, 0, 5)
    const r = random.floats(n, 0.1, 0.5)
    const v = [
      ...random.floats(n/3, 7, 13),
      ...random.floats(n/3, 70, 130),
      ...random.floats(n/3, 700, 1300),
    ]

    const p = fig([500, 200], {border_fill_color: "lightgray"})
    p.circle({x, y, radius: r, fill_color: {field: "values", transform: color_mapper}, source: {values: v}})
    p.add_layout(color_bar, "below")

    await display(p)
  })

  it(`should support CategoricalColorMapper`, async () => {
    const random = new Random(1)

    const factors = ["foo", "bar", "baz", "qux", "quux", "corge", "grault", "garply", "waldo", "fred", "plugh"]
    const color_mapper = new CategoricalColorMapper({palette: Spectral11, factors})
    const color_bar = new ColorBar({color_mapper, title: "Unspecified title", border_line_color: "black"})

    const n = 30
    const x = random.floats(n, 0, 10)
    const y = random.floats(n, 0, 5)
    const r = random.floats(n, 0.1, 0.5)
    const v = random.choices(n, factors)

    const p = fig([500, 200], {border_fill_color: "lightgray"})
    p.circle({x, y, radius: r, fill_color: {field: "values", transform: color_mapper}, source: {values: v}})
    p.add_layout(color_bar, "below")

    await display(p)
  })
})
