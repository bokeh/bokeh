import {expect, expect_instanceof} from "#framework/assertions"

import {mount, show} from "@bokehjs/api/io"
import {Document, documents} from "@bokehjs/document"
import {Plot, PlotView} from "@bokehjs/models/plots/plot"

describe("in api/plotting module", () => {
  describe("show() function", () => {
    it("must support specific view types", async () => {
      // tsc will fail with TS2740 if this doesn't produce the correct type
      const v: PlotView = await show(Plot.create())
      expect(v).to.be.instanceof(PlotView)
    })
  })

  describe("mount() function", () => {
    it("returns an idempotent disposal handle", async () => {
      const target = document.createElement("div")
      document.body.append(target)
      const documents_before = documents.length
      const plot = Plot.create()

      const mounted = await mount(plot, target)
      const [view] = mounted.views
      expect(view).to.be.instanceof(PlotView)
      expect(plot.document).to.be.equal(mounted.document)
      expect(documents.length).to.be.equal(documents_before + 1)

      mounted.dispose()
      mounted.dispose()
      expect(mounted.disposed).to.be.true
      expect(plot.document).to.be.null
      expect(documents.length).to.be.equal(documents_before)
      expect(target.contains(view.el)).to.be.false

      target.remove()
    })

    it("honors an already aborted signal", async () => {
      const target = document.createElement("div")
      const controller = new AbortController()
      controller.abort(new Error("component unmounted"))
      const documents_before = documents.length

      const promise = mount(Plot.create(), target, {signal: controller.signal})
      const error = await promise.then(() => null, (error: unknown) => error)
      expect(error).to.be.instanceof(Error)
      expect((error as Error).message).to.be.equal("component unmounted")
      expect(documents.length).to.be.equal(documents_before)
    })

    it("doesn't destroy a caller-owned document", async () => {
      const target = document.createElement("div")
      const plot = Plot.create()
      const doc = new Document({roots: [plot]})
      const mounted = await mount(doc, target)
      const [view] = mounted.views
      expect_instanceof(view, PlotView)

      mounted.dispose()
      expect(doc.is_destroyed).to.be.false
      expect(plot.document).to.be.equal(doc)
      expect(target.contains(view.el)).to.be.false

      doc.destroy()
    })
  })
})
