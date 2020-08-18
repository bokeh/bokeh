import {display, fig, row, column} from "../utils"

import {Arrow, NormalHead, OpenHead, TeeHead, VeeHead, Range1d} from "@bokehjs/models"
import {OutputBackend} from "@bokehjs/core/enums"

describe("Arrow annotation", () => {
  const make_arrow_heads = (size: number) => [
    {start: null, end: null},

    {start: null, end: new NormalHead({size})},
    {start: null, end: new OpenHead({size})},
    {start: null, end: new TeeHead({size})},
    {start: null, end: new VeeHead({size})},

    {start: new NormalHead({size}), end: null},
    {start: new OpenHead({size}), end: null},
    {start: new TeeHead({size}), end: null},
    {start: new VeeHead({size}), end: null},

    {start: new NormalHead({size}), end: new NormalHead({size})},
    {start: new NormalHead({size}), end: new OpenHead({size})},
    {start: new NormalHead({size}), end: new TeeHead({size})},
    {start: new NormalHead({size}), end: new VeeHead({size})},

    {start: new OpenHead({size}), end: new NormalHead({size})},
    {start: new OpenHead({size}), end: new OpenHead({size})},
    {start: new OpenHead({size}), end: new TeeHead({size})},
    {start: new OpenHead({size}), end: new VeeHead({size})},

    {start: new TeeHead({size}), end: new NormalHead({size})},
    {start: new TeeHead({size}), end: new OpenHead({size})},
    {start: new TeeHead({size}), end: new TeeHead({size})},
    {start: new TeeHead({size}), end: new VeeHead({size})},

    {start: new VeeHead({size}), end: new NormalHead({size})},
    {start: new VeeHead({size}), end: new OpenHead({size})},
    {start: new VeeHead({size}), end: new TeeHead({size})},
    {start: new VeeHead({size}), end: new VeeHead({size})},
  ]

  it(`should support support horizontal arrows with all arrow heads`, async () => {
    function make_plot(output_backend: OutputBackend) {
      const arrow_heads = make_arrow_heads(12)

      const x_range = new Range1d({start: 0, end: 8})
      const y_range = new Range1d({start: 0, end: arrow_heads.length + 1})
      const p = fig([200, 600], {
        x_range, y_range,
        x_axis_type: null, y_axis_type: null,
        output_backend, title: output_backend,
      })

      const x_start = 1.3
      const x_end = 6.7
      const width = 2

      let y = 0
      for (const {start, end} of arrow_heads) {
        p.add_layout(new Arrow({x_start, y_start: ++y, x_end, y_end: y, line_width: width, start, end}))
      }

      return p
    }

    const p0 = make_plot("canvas")
    const p1 = make_plot("svg")

    await display(row([p0, p1]), [450, 650])
  })

  it(`should support support vertical arrows with all arrow heads`, async () => {
    function make_plot(output_backend: OutputBackend) {
      const arrow_heads = make_arrow_heads(12)

      const x_range = new Range1d({start: 0, end: arrow_heads.length + 1})
      const y_range = new Range1d({start: 0, end: 8})
      const p = fig([600, 200], {
        x_range, y_range,
        x_axis_type: null, y_axis_type: null,
        output_backend, title: output_backend,
      })

      const y_start = 1.3
      const y_end = 6.7
      const width = 2

      let x = 0
      for (const {start, end} of arrow_heads) {
        p.add_layout(new Arrow({y_start, x_start: ++x, y_end, x_end: x, line_width: width, start, end}))
      }

      return p
    }

    const p0 = make_plot("canvas")
    const p1 = make_plot("svg")

    await display(column([p0, p1]), [650, 450])
  })
})
