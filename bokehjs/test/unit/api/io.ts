import {expect, expect_instanceof} from "#framework/assertions"

import {MountError, MountSource, mount, show} from "@bokehjs/api/io"
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

      const mounted = mount(plot, target)
      expect(mounted.state).to.be.equal("pending")
      await mounted.ready
      const [view] = mounted.views
      expect(view).to.be.instanceof(PlotView)
      expect(plot.document).to.be.equal(mounted.document)
      expect(documents.length).to.be.equal(documents_before + 1)
      expect(mounted.state).to.be.equal("ready")
      expect(mounted.ownership).to.be.equal({document: "mount", views: "mount", targets: "caller"})

      const disposal = mounted.dispose()
      expect(mounted.dispose()).to.be.equal(disposal)
      await disposal
      expect(mounted.disposed).to.be.true
      expect(plot.document).to.be.null
      expect(documents.length).to.be.equal(documents_before)
      expect(target.contains(view.el)).to.be.false

      target.remove()
    })

    it("mounts document roots into independent targets", async () => {
      const fallback = document.createDocumentFragment()
      const first_target = document.createElement("div")
      const second_target = document.createElement("div")
      document.body.append(first_target, second_target)
      const first = Plot.create()
      const second = Plot.create()

      const mounted = mount({first, second}, fallback, {targets: {first: first_target, second: second_target}})
      await mounted.ready
      const [first_view, second_view] = mounted.views
      expect_instanceof(first_view, PlotView)
      expect_instanceof(second_view, PlotView)
      expect(first_target.contains(first_view.el)).to.be.true
      expect(second_target.contains(second_view.el)).to.be.true
      expect(fallback.contains(first_view.el)).to.be.false
      expect(fallback.contains(second_view.el)).to.be.false

      await mounted.dispose()
      expect(first_target.childElementCount).to.be.equal(0)
      expect(second_target.childElementCount).to.be.equal(0)
      expect(first.document).to.be.null
      expect(second.document).to.be.null
      first_target.remove()
      second_target.remove()
    })

    it("addresses shared-document roots by key and attaches them selectively", async () => {
      const first_target = document.createElement("div")
      const replacement_target = document.createElement("div")
      const second_target = document.createElement("div")
      document.body.append(first_target, replacement_target, second_target)
      const first = Plot.create()
      const second = Plot.create()
      const doc = new Document({roots: [first, second]})
      const source = new MountSource(doc, {summary: first, detail: second})

      const mounted = mount(source, {targets: {detail: second_target}})
      await mounted.ready
      expect(mounted.root_keys).to.be.equal(["summary", "detail"])
      expect(mounted.root("summary")).to.be.equal(first)
      expect(mounted.view("summary")).to.be.null
      expect(mounted.views.length).to.be.equal(1)
      expect(mounted.ownership.document).to.be.equal("caller")

      const first_view = await mounted.attach("summary", first_target)
      expect_instanceof(first_view, PlotView)
      expect(first_target.contains(first_view.el)).to.be.true
      expect(mounted.views.length).to.be.equal(2)

      const replaced = await mounted.replace_target("summary", replacement_target)
      expect(replaced).to.be.equal(first_view)
      expect(first_target.childElementCount).to.be.equal(0)
      expect(replacement_target.contains(first_view.el)).to.be.true

      mounted.detach("summary")
      expect(mounted.disposed).to.be.false
      expect(mounted.view("summary")).to.be.null
      expect(replacement_target.childElementCount).to.be.equal(0)
      expect(second_target.childElementCount).to.be.above(0)

      const reattached = await mounted.attach("summary", first_target)
      expect_instanceof(reattached, PlotView)
      expect(reattached).to.not.be.equal(first_view)

      await mounted.dispose()
      expect(doc.is_destroyed).to.be.false
      expect(first.document).to.be.equal(doc)
      expect(second.document).to.be.equal(doc)
      doc.destroy()
      first_target.remove()
      replacement_target.remove()
      second_target.remove()
    })

    it("doesn't become ready until root views finish lazy initialization", async () => {
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
      document.body.append(target)
      const mounted = mount(DelayedPlot.create(), target)
      await started
      expect(mounted.state).to.be.equal("pending")
      expect(mounted.views.length).to.be.equal(0)

      continue_initialization()
      await mounted.ready
      expect(mounted.state).to.be.equal("ready")
      expect(mounted.views.length).to.be.equal(1)

      await mounted.dispose()
      target.remove()
    })

    it("can be disposed before readiness without retaining models or views", async () => {
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
      document.body.append(target)
      const documents_before = documents.length
      const plot = DelayedPlot.create()
      const mounted = mount(plot, target)
      await started
      await mounted.dispose()
      expect(plot.document).to.be.null
      expect(documents.length).to.be.equal(documents_before)
      expect(mounted.state).to.be.equal("disposed")

      continue_initialization()
      const error = await mounted.ready.then(() => null, (error: unknown) => error)
      expect(error).to.be.instanceof(MountError)
      expect((error as MountError).kind).to.be.equal("disposed")
      expect(mounted.views.length).to.be.equal(0)
      expect(target.childElementCount).to.be.equal(0)
      target.remove()
    })

    it("reports target errors and rolls back mount-owned documents", async () => {
      const target = document.createElement("div")
      const documents_before = documents.length
      const plot = Plot.create()
      const errors: MountError[] = []
      const mounted = mount(plot, target, {on_error: (error) => errors.push(error)})

      const error = await mounted.ready.then(() => null, (error: unknown) => error)
      expect(error).to.be.instanceof(MountError)
      expect((error as MountError).kind).to.be.equal("target")
      expect((error as MountError).root_key).to.be.undefined
      expect(mounted.state).to.be.equal("failed")
      expect(mounted.disposed).to.be.true
      expect(errors).to.be.equal([error as MountError])
      expect(plot.document).to.be.null
      expect(documents.length).to.be.equal(documents_before)
    })

    it("rolls back all views and ownership when one root fails to render", async () => {
      class FailingPlotView extends PlotView {
        override async lazy_initialize(): Promise<void> {
          await super.lazy_initialize()
          throw new Error("intentional mount failure")
        }
      }

      class FailingPlot extends Plot {
        static {
          this.prototype.default_view = FailingPlotView
        }
      }

      const target = document.createElement("div")
      document.body.append(target)
      const documents_before = documents.length
      const first = Plot.create()
      const second = FailingPlot.create()
      const mounted = mount({first, second}, target)

      const error = await mounted.ready.then(() => null, (error: unknown) => error)
      expect(error).to.be.instanceof(MountError)
      expect((error as MountError).kind).to.be.equal("render")
      expect((error as Error).message).to.be.equal("intentional mount failure")
      expect((error as MountError).root_key).to.be.equal("second")
      expect(mounted.views.length).to.be.equal(0)
      expect(target.childElementCount).to.be.equal(0)
      expect(first.document).to.be.null
      expect(second.document).to.be.null
      expect(documents.length).to.be.equal(documents_before)
      target.remove()
    })

    it("reports the logical root key for keyed target failures", async () => {
      const target = document.createElement("div")
      const plot = Plot.create()
      const mounted = mount({summary: plot}, {targets: {summary: target}})

      const error = await mounted.ready.then(() => null, (error: unknown) => error)
      expect(error).to.be.instanceof(MountError)
      expect((error as MountError).kind).to.be.equal("target")
      expect((error as MountError).root_key).to.be.equal("summary")
      expect(plot.document).to.be.null
    })

    it("rolls back even when an error callback throws", async () => {
      const target = document.createElement("div")
      const documents_before = documents.length
      const plot = Plot.create()
      let callback_called = false
      const mounted = mount(plot, target, {
        on_error() {
          callback_called = true
          throw new Error("application error handler failed")
        },
      })

      const error = await mounted.ready.then(() => null, (error: unknown) => error)
      expect(callback_called).to.be.true
      expect(error).to.be.instanceof(MountError)
      expect((error as MountError).kind).to.be.equal("target")
      expect(mounted.disposed).to.be.true
      expect(plot.document).to.be.null
      expect(documents.length).to.be.equal(documents_before)
    })

    it("surfaces dynamic root render failures without disposing a ready caller document", async () => {
      class FailingPlotView extends PlotView {
        override async lazy_initialize(): Promise<void> {
          await super.lazy_initialize()
          throw new Error("dynamic root failed")
        }
      }

      class FailingPlot extends Plot {
        static {
          this.prototype.default_view = FailingPlotView
        }
      }

      const target = document.createElement("div")
      document.body.append(target)
      const doc = new Document()
      const errors: MountError[] = []
      const mounted = mount(doc, target, {on_error: (error) => errors.push(error)})
      await mounted.ready
      const plot = FailingPlot.create()

      doc.add_root(plot)
      await defer()
      expect(errors.length).to.be.equal(1)
      expect(errors[0].kind).to.be.equal("render")
      expect(errors[0].root_key).to.be.equal(plot.id)
      expect(mounted.state).to.be.equal("ready")
      expect(mounted.disposed).to.be.false
      expect(doc.is_destroyed).to.be.false

      await mounted.dispose()
      doc.destroy()
      target.remove()
    })

    it("honors an already aborted signal", async () => {
      const target = document.createElement("div")
      const controller = new AbortController()
      controller.abort(new Error("component unmounted"))
      const documents_before = documents.length

      const mounted = mount(Plot.create(), target, {signal: controller.signal})
      const error = await mounted.ready.then(() => null, (error: unknown) => error)
      expect(error).to.be.instanceof(MountError)
      expect((error as MountError).kind).to.be.equal("abort")
      expect((error as Error).message).to.be.equal("component unmounted")
      expect(documents.length).to.be.equal(documents_before)
    })

    it("releases model ownership synchronously when mounting is aborted", async () => {
      const plot = Plot.create()
      const first_target = document.createElement("div")
      const second_target = document.createElement("div")
      const controller = new AbortController()

      document.body.append(first_target, second_target)
      const first_mount = mount(plot, first_target, {signal: controller.signal})
      const first_error = first_mount.ready.then(() => null, (error: unknown) => error)
      controller.abort(new Error("superseded"))

      const second_mount = mount(plot, second_target)
      await second_mount.ready
      expect(await first_error).to.be.instanceof(Error)
      expect(plot.document).to.be.equal(second_mount.document)
      expect(second_mount.views.length).to.be.equal(1)

      await second_mount.dispose()
      first_target.remove()
      second_target.remove()
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
      document.body.append(target)
      const mounted = mount(doc, target)
      await mounted.ready
      const plot = DelayedPlot.create()

      doc.add_root(plot)
      await started
      doc.remove_root(plot)
      continue_initialization()
      await defer()

      expect(mounted.view_manager.get(plot)).to.be.null
      expect(mounted.models.includes(plot)).to.be.false
      expect(mounted.views.length).to.be.equal(0)

      await mounted.dispose()
      doc.destroy()
      target.remove()
    })

    it("doesn't destroy a caller-owned document", async () => {
      const target = document.createElement("div")
      const plot = Plot.create()
      const doc = new Document({roots: [plot]})
      document.body.append(target)
      const mounted = mount(doc, target)
      await mounted.ready
      const [view] = mounted.views
      expect_instanceof(view, PlotView)

      await mounted.dispose()
      expect(doc.is_destroyed).to.be.false
      expect(plot.document).to.be.equal(doc)
      expect(target.contains(view.el)).to.be.false

      doc.destroy()
      target.remove()
    })
  })
})
