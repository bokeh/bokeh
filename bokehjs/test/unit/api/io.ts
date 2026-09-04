import {expect, expect_instanceof} from "#framework/assertions"

import {
  BOKEH_MOUNTED_ATTRIBUTE, MountError, MountSource, mount, publish_mount_error, show, when_mounted,
} from "@bokehjs/api/io"
import {figure} from "@bokehjs/api/plotting"
import {Document, documents} from "@bokehjs/document"
import {ColumnDataSource} from "@bokehjs/models/sources/column_data_source"
import {Plot, PlotView} from "@bokehjs/models/plots/plot"
import {defer} from "@bokehjs/core/util/defer"

describe("in api/plotting module", () => {
  describe("show() function", () => {
    it("returns an owning mount with specific view types", async () => {
      const mounted = show(Plot.create())
      await mounted.ready
      // tsc will fail with TS2740 if this doesn't produce the correct type
      const [view]: PlotView[] = mounted.views
      expect(view).to.be.instanceof(PlotView)
      await mounted.dispose()
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

    it("publishes one handle to every logical-root target and clears it on disposal", async () => {
      const first_target = document.createElement("div")
      const second_target = document.createElement("div")
      document.body.append(first_target, second_target)
      const first_waiter = when_mounted(first_target)
      const second_waiter = when_mounted(second_target)

      const mounted = mount({first: Plot.create(), second: Plot.create()}, {
        targets: {first: first_target, second: second_target},
      })
      const [first_discovery, second_discovery] = await Promise.all([first_waiter, second_waiter])
      expect(first_discovery).to.be.equal(mounted)
      expect(second_discovery).to.be.equal(mounted)
      await mounted.ready
      expect(first_target.bokehMount).to.be.equal(mounted)
      expect(second_target.bokehMount).to.be.equal(mounted)
      expect(first_target.hasAttribute(BOKEH_MOUNTED_ATTRIBUTE)).to.be.true
      expect(second_target.hasAttribute(BOKEH_MOUNTED_ATTRIBUTE)).to.be.true

      await mounted.dispose()
      expect(first_target.bokehMount).to.be.undefined
      expect(second_target.bokehMount).to.be.undefined
      expect(first_target.hasAttribute(BOKEH_MOUNTED_ATTRIBUTE)).to.be.false
      expect(second_target.hasAttribute(BOKEH_MOUNTED_ATTRIBUTE)).to.be.false
      first_target.remove()
      second_target.remove()
    })

    it("supports target-local discovery before bootstrap and query-only view lookup", async () => {
      const host = document.createElement("div")
      host.id = "external-sales-plot"
      document.body.append(host)

      // This is the external script. It can run before the artifact bootstrap.
      const target = document.querySelector<HTMLElement>("#external-sales-plot")!
      const discovery = when_mounted(target)

      // This stands in for the later artifact or Sphinx bootstrap.
      const source = ColumnDataSource.create({
        name: "sales-source",
        data: {x: [1, 2], y: [3, 4]},
      })
      const plot = figure({name: "sales-plot"})
      plot.line({field: "x"}, {field: "y"}, {source})
      const mounted = mount({sales: plot}, {targets: {sales: target}})

      const discovered = await discovery
      expect(discovered).to.be.equal(mounted)
      await discovered.ready
      const root = discovered.root("sales")
      expect(root).to.be.equal(plot)
      const named = discovered.document.get_model_by_name("sales-source")
      expect(named).to.be.equal(source)
      expect(discovered.view_lookup.find_one(plot)).to.be.equal(mounted.view("sales"))

      await discovered.dispose()
      expect(target.bokehMount).to.be.undefined
      host.remove()
    })

    it("makes target-local discovery abortable", async () => {
      const target = document.createElement("div")
      const controller = new AbortController()
      const discovery = when_mounted(target, {signal: controller.signal})
      controller.abort(new Error("external script removed"))

      const error = await discovery.then(() => null, (error: unknown) => error)
      expect(error).to.be.instanceof(MountError)
      expect((error as MountError).kind).to.be.equal("abort")
      expect((error as Error).message).to.be.equal("external script removed")
    })

    it("rejects discovery with structured errors published before a handle exists", async () => {
      const target = document.createElement("div")
      const discovery = when_mounted(target)
      const published = new MountError("source", "artifact decoding failed")
      publish_mount_error(target, published)

      const error = await discovery.then(() => null, (error: unknown) => error)
      expect(error).to.be.equal(published)
      expect(target.bokehMountError).to.be.equal(published)
      expect(await when_mounted(target).then(() => null, (error: unknown) => error)).to.be.equal(published)
    })

    it("publishes readiness failures and clears them on remount", async () => {
      class FailingPlotView extends PlotView {
        override async lazy_initialize(): Promise<void> {
          await super.lazy_initialize()
          throw new Error("target-local render failure")
        }
      }

      class FailingPlot extends Plot {
        static {
          this.prototype.default_view = FailingPlotView
        }
      }

      const target = document.createElement("div")
      document.body.append(target)
      const discovery = when_mounted(target)
      const failed = mount(FailingPlot.create(), target)
      expect(await discovery).to.be.equal(failed)
      const error = await failed.ready.then(() => null, (error: unknown) => error)
      expect(error).to.be.instanceof(MountError)
      await failed.when_disposed
      expect(failed.disposed).to.be.true
      const mounted_error = error as MountError
      expect(target.bokehMount).to.be.undefined
      expect(target.bokehMountError).to.be.equal(mounted_error)
      expect(target.hasAttribute(BOKEH_MOUNTED_ATTRIBUTE)).to.be.false
      expect(await when_mounted(target).then(() => null, (error: unknown) => error)).to.be.equal(mounted_error)

      const remounted = mount(Plot.create(), target)
      expect(await when_mounted(target)).to.be.equal(remounted)
      await remounted.ready
      expect(target.bokehMountError).to.be.undefined
      await remounted.dispose()
      target.remove()
    })

    it("doesn't let a stale mount clear a newer target publication", async () => {
      const target = document.createElement("div")
      document.body.append(target)
      const first = mount(Plot.create(), target)
      await first.ready
      const second = mount(Plot.create(), target)
      await second.ready
      expect(target.bokehMount).to.be.equal(second)

      await first.dispose()
      expect(target.bokehMount).to.be.equal(second)
      expect(target.hasAttribute(BOKEH_MOUNTED_ATTRIBUTE)).to.be.true

      await second.dispose()
      expect(target.bokehMount).to.be.undefined
      expect(target.hasAttribute(BOKEH_MOUNTED_ATTRIBUTE)).to.be.false

      const discovery = when_mounted(target)
      const third = mount(Plot.create(), target)
      expect(await discovery).to.be.equal(third)
      await third.ready
      await third.dispose()
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
      await mounted.when_disposed
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

      expect(mounted.view_lookup.find_one(plot)).to.be.null
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
