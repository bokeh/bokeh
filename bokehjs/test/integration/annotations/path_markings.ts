import {column, display, fig, row} from "#framework/layouts"
import {ColumnDataSource, NormalHead, ScatterMarking} from "@bokehjs/models"

describe("Path markings", () => {
  function curve(title: string) {
    const p = fig([215, 145], {
      title, x_range: [-0.7, 4.7], y_range: [-1.2, 2.8], x_axis_type: null, y_axis_type: null,
    })
    const renderer = p.bezier({
      x0: 0, y0: 0, x1: 4, y1: 1, cx0: 1, cy0: 3, cx1: 3, cy1: 0,
      line_color: "navy", line_width: 3,
    })
    return {p, renderer}
  }

  function head() {
    return NormalHead.create({size: 22, fill_color: "tomato", line_color: "firebrick"})
  }

  function marker() {
    return ScatterMarking.create({marker: "diamond", size: 13, fill_color: "gold", line_color: "navy"})
  }

  it("should render named positions and distinguish endpoints from fractions", async () => {
    const named = curve("Named start, middle, end")
    for (const at of ["start", "middle", "end"] as const) {
      named.renderer.add_path_marking(head(), {at})
    }
    const inset = curve("Named start and end with inset")
    for (const at of ["start", "end"] as const) {
      inset.renderer.add_path_marking(head(), {at, inset: 24})
    }
    const endpoints = (start: "start" | 0, end: "end" | 1, title: string) => {
      const {p, renderer} = curve(title)
      renderer.add_arrowheads({at: start, head: head()})
      renderer.add_arrowheads({at: end, head: head()})
      return p
    }

    await display(column([
      row([named.p, inset.p]),
      row([endpoints("start", "end", "Named endpoints"), endpoints(0, 1, "Fractions 0 and 1")]),
    ]))
  })

  it("should render single and repeated fractional markings", async () => {
    const single = curve("Single fractions")
    single.renderer.add_arrowheads({at: 0.3, head: head()})
    single.renderer.add_path_marking(marker(), {at: 0.7})

    const repeated = curve("Repeated fractions")
    repeated.renderer.add_arrowheads({at: [0, 0.5, 1], head: head()})
    repeated.renderer.add_path_marking(marker(), {at: [0.25, 0.75]})

    await display(row([single.p, repeated.p]))
  })

  it("should redraw field-backed markings and leave empty rows unmarked", async () => {
    function panel(title: string) {
      const p = fig([250, 180], {
        title, x_range: [-0.5, 4.5], y_range: [0.5, 3.8], x_axis_type: null, y_axis_type: null,
      })
      const source = ColumnDataSource.create({data: {
        xs: [[0, 2, 4], [0, 2, 4], [0, 2, 4]],
        ys: [[1, 1.4, 1], [2, 2.4, 2], [3, 3.4, 3]],
        positions: [[0.15, 0.45, 0.75], [], [0.3, 0.6]],
      }})
      const renderer = p.multi_line({
        xs: {field: "xs"}, ys: {field: "ys"}, source, line_color: "navy", line_width: 3,
      })
      renderer.add_arrowheads({at: {field: "positions"}, head: head()})
      return {p, source}
    }

    const before = panel("Before source update")
    const after = panel("After source update")
    const {view} = await display(row([before.p, after.p]))
    after.source.data = {...after.source.data, positions: [[0.3, 0.6, 0.9], [], [0.15, 0.85]]}
    await view.ready
  })
})
