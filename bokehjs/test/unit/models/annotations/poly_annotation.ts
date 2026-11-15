import {expect} from "#framework/assertions"
import {actions, xy} from "#framework/interactive"
import {display} from "#framework/layouts"

import {Plot, Range1d, PolyAnnotation} from "@bokehjs/models"

describe("PolyAnnotation", () => {
  it("should restore vertices when dragging was cancelled with Escape", async () => {
    const poly = PolyAnnotation.create({xs: [0.2, 0.6, 0.4], ys: [0.2, 0.2, 0.6], editable: true})
    const plot = Plot.create({
      width: 400,
      height: 400,
      min_border: 0,
      x_range: Range1d.create({start: 0, end: 1}),
      y_range: Range1d.create({start: 0, end: 1}),
    })
    plot.add_layout(poly)
    const {view: plot_view} = await display(plot)
    const ac = actions(plot_view, {units: "data"})

    const phases: string[] = []
    poly.pan.connect(([phase]) => phases.push(phase))

    const events = [...ac._pan({type: "line", xy0: xy(0.4, 0.3), xy1: xy(0.7, 0.5)})]
    const pointerup = events.pop()!
    await ac.emit(events)
    expect([...poly.xs]).to.not.be.similar([0.2, 0.6, 0.4])

    document.dispatchEvent(new KeyboardEvent("keydown", {key: "Escape", bubbles: true, cancelable: true}))
    expect([...poly.xs]).to.be.equal([0.2, 0.6, 0.4])
    expect([...poly.ys]).to.be.equal([0.2, 0.2, 0.6])
    expect(phases.at(-1)).to.be.equal("pan:cancel")

    await ac.emit([pointerup])
    expect([...poly.xs]).to.be.equal([0.2, 0.6, 0.4])
  })
})
