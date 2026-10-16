import {display, fig, row, column} from "#framework/layouts"

import {NormalHead, OpenHead, TeeHead, VeeHead, Range1d, PathDecoration} from "@bokehjs/models"
import {ModelChangedEvent} from "@bokehjs/document/events"
import type {OutputBackend} from "@bokehjs/core/enums"

describe("Arrow annotation", () => {
  it("should render decorations added, replaced, and removed through PATCH-DOC", async () => {
    const plots = ["added", "replaced", "removed"].map(title => fig([200, 200], {
      x_range: [-0.2, 1.2], y_range: [-1, 1], title,
    }))
    const renderers = plots.map((plot, i) => plot.arrow({
      x_start: 0, y_start: 0, x_end: 1, y_end: 0, line_color: "black",
      end: i == 0 ? null : NormalHead.create({size: 20}),
    }))
    const {view} = await display(row(plots))
    const doc = view.model.document!
    const added = PathDecoration.create({node: "end", marking: NormalHead.create({size: 20})})
    const replaced = renderers[1].glyph.decorations[0]
    const patch = doc.create_json_patch([
      new ModelChangedEvent(doc, renderers[0].glyph, "decorations", [added]),
      new ModelChangedEvent(doc, replaced, "marking", VeeHead.create({size: 25})),
      new ModelChangedEvent(doc, renderers[2].glyph, "decorations", []),
    ])
    doc.apply_json_patch(patch)
    await view.ready
  })

  const make_arrow_heads = (size: number) => [
    {start: null, end: null},

    {start: null, end: NormalHead.create({size})},
    {start: null, end: OpenHead.create({size})},
    {start: null, end: TeeHead.create({size})},
    {start: null, end: VeeHead.create({size})},

    {start: NormalHead.create({size}), end: null},
    {start: OpenHead.create({size}), end: null},
    {start: TeeHead.create({size}), end: null},
    {start: VeeHead.create({size}), end: null},

    {start: NormalHead.create({size}), end: NormalHead.create({size})},
    {start: NormalHead.create({size}), end: OpenHead.create({size})},
    {start: NormalHead.create({size}), end: TeeHead.create({size})},
    {start: NormalHead.create({size}), end: VeeHead.create({size})},

    {start: OpenHead.create({size}), end: NormalHead.create({size})},
    {start: OpenHead.create({size}), end: OpenHead.create({size})},
    {start: OpenHead.create({size}), end: TeeHead.create({size})},
    {start: OpenHead.create({size}), end: VeeHead.create({size})},

    {start: TeeHead.create({size}), end: NormalHead.create({size})},
    {start: TeeHead.create({size}), end: OpenHead.create({size})},
    {start: TeeHead.create({size}), end: TeeHead.create({size})},
    {start: TeeHead.create({size}), end: VeeHead.create({size})},

    {start: VeeHead.create({size}), end: NormalHead.create({size})},
    {start: VeeHead.create({size}), end: OpenHead.create({size})},
    {start: VeeHead.create({size}), end: TeeHead.create({size})},
    {start: VeeHead.create({size}), end: VeeHead.create({size})},
  ]

  it("should support support horizontal arrows with all arrow heads", async () => {
    function make_plot(output_backend: OutputBackend) {
      const arrow_heads = make_arrow_heads(12)

      const x_range = Range1d.create({start: 0, end: 8})
      const y_range = Range1d.create({start: 0, end: arrow_heads.length + 1})
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
        p.arrow({x_start, y_start: ++y, x_end, y_end: y, line_width: width, line_color: "black", start, end})
      }

      return p
    }

    const p0 = make_plot("canvas")
    const p1 = make_plot("svg")

    await display(row([p0, p1]))
  })

  it("should support support vertical arrows with all arrow heads", async () => {
    function make_plot(output_backend: OutputBackend) {
      const arrow_heads = make_arrow_heads(12)

      const x_range = Range1d.create({start: 0, end: arrow_heads.length + 1})
      const y_range = Range1d.create({start: 0, end: 8})
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
        p.arrow({y_start, x_start: ++x, y_end, x_end: x, line_width: width, line_color: "black", start, end})
      }

      return p
    }

    const p0 = make_plot("canvas")
    const p1 = make_plot("svg")

    await display(column([p0, p1]))
  })
})
