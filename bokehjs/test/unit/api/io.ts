import {expect, expect_instanceof} from "#framework/assertions"

import {mount, show} from "@bokehjs/api/io"
import {Document, documents} from "@bokehjs/document"
import {Plot, PlotView} from "@bokehjs/models/plots/plot"
import {defer} from "@bokehjs/core/util/defer"

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

    it("releases model ownership synchronously when mounting is aborted", async () => {
      const plot = Plot.create()
      const first_target = document.createElement("div")
      const second_target = document.createElement("div")
      const controller = new AbortController()

      const first_mount = mount(plot, first_target, {signal: controller.signal})
      const first_error = first_mount.then(() => null, (error: unknown) => error)
      controller.abort(new Error("superseded"))

      const second_mount = await mount(plot, second_target)
      expect(await first_error).to.be.instanceof(Error)
      expect(plot.document).to.be.equal(second_mount.document)
      expect(second_mount.views.length).to.be.equal(1)

      second_mount.dispose()
    })

    it("doesn't retain a dynamically removed root whose view is still building", async () => {
      let initialization_started!: () => void
      let continue_initialization!: () => void
      const started = new Promise<void>((resolve) => initialization_started = resolve)
      const gate = new Promise<void>((resolve) => continue_initialization = resolve)

      class DelayedPlotView extends PlotView {
        override async lazy_initialize(): Promise<void> {
          await super.lazy_initialize()
          initialization_started()
          await gate
        }
      }

      class DelayedPlot extends Plot {
        static {
          this.prototype.default_view = DelayedPlotView
        }
      }

      const target = document.createElement("div")
      const doc = new Document()
      const mounted = await mount(doc, target)
      const plot = DelayedPlot.create()

      doc.add_root(plot)
      await started
      doc.remove_root(plot)
      continue_initialization()
      await defer()

      expect(mounted.view_manager.get(plot)).to.be.null
      expect(mounted.models.includes(plot)).to.be.false
      expect(mounted.views.length).to.be.equal(0)

      mounted.dispose()
      doc.destroy()
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
