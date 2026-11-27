import {expect} from "#framework/assertions"
import {actions, xy} from "#framework/interactive"
import {display} from "#framework/layouts"

import {XYPlot, Range1d, Span} from "@bokehjs/models"

describe("Span", () => {
  it("should restore location when dragging was cancelled with Escape", async () => {
    const span = Span.create({location: 0.5, dimension: "height", editable: true})
    const plot = XYPlot.create({
      width: 400,
      height: 400,
      min_border: 0,
      x_range: Range1d.create({start: 0, end: 1}),
      y_range: Range1d.create({start: 0, end: 1}),
    })
    plot.add_layout(span)
    const {view: plot_view} = await display(plot)
    const ac = actions(plot_view, {units: "data"})

    const phases: string[] = []
    span.pan.connect(([phase]) => phases.push(phase))

    const events = [...ac._pan({type: "line", xy0: xy(0.5, 0.5), xy1: xy(0.8, 0.5)})]
    const pointerup = events.pop()!
    await ac.emit(events)
    expect(span.location).to.not.be.similar(0.5)

    document.dispatchEvent(new KeyboardEvent("keydown", {key: "Escape", bubbles: true, cancelable: true}))
    expect(span.location).to.be.equal(0.5)
    expect(phases.at(-1)).to.be.equal("pan:cancel")

    await ac.emit([pointerup])
    expect(span.location).to.be.equal(0.5)
  })
})
