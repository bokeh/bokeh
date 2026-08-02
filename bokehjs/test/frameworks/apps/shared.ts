import {ColumnDataSource, ModelResolver, Plotting, Range1d, index, register_models, register_standard_models} from "@bokeh/bokehjs"
import type {BokehMount, MountOptions} from "@bokeh/bokehjs"
import {MountController} from "@bokeh/framework"
import type {BokehModel} from "@bokeh/framework"

declare global {
  interface Window {
    __bokeh_framework_test__?: Promise<FrameworkTestResult>
    __bokeh_hmr__: "disabled" | "waiting" | "received"
  }
}

export type FrameworkTestResult = {
  framework: string
  mounts: number
  streams: number
}

export type AdapterMount = {
  handle: BokehMount
  target: HTMLElement
  unmount(): void | Promise<void>
}

export type Adapter = {
  mount(model: BokehModel, mountOptions?: MountOptions): Promise<AdapterMount>
}

export type FrameworkRenderRequest = {
  model: BokehModel
  mountOptions?: MountOptions
  onMounted(mounted: BokehMount): void
  onError(error: unknown): void
}

export type FrameworkRender = (request: FrameworkRenderRequest) => {
  target(): HTMLElement | null
  unmount(): void | Promise<void>
}

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new Error(message)
  }
}

function create_plot() {
  const source = ColumnDataSource.create({data: {x: [0, 1, 2], y: [1, 3, 2]}})
  const plot = Plotting.figure({width: 260, height: 180, tools: [], toolbar_location: null})
  plot.line({field: "x"}, {field: "y"}, {source, line_width: 3})
  return {plot, source}
}

function validate_registration(): void {
  interface FrameworkRange extends Range1d.Attrs {}
  class FrameworkRange extends Range1d {}

  const resolver = new ModelResolver(null)
  register_models({FrameworkRange}, resolver)
  assert(resolver.get("FrameworkRange") == FrameworkRange, "custom model wasn't registered in the isolated resolver")

  register_standard_models(resolver)
  assert(resolver.get("Range1d") == Range1d, "standard models weren't registered in the isolated resolver")
}

async function validate_mount(model: ReturnType<typeof Plotting.figure>, mounted: AdapterMount): Promise<void> {
  assert(!mounted.handle.disposed, "adapter returned a disposed mount")
  assert(mounted.handle.views.length == 1, "adapter didn't create exactly one root view")
  assert(mounted.target.childElementCount > 0, "adapter didn't attach Bokeh DOM")
  assert(index.get(model) != null, "mounted view wasn't added to Bokeh's global view index")
}

async function validate_unmount(model: ReturnType<typeof Plotting.figure>, mounted: AdapterMount): Promise<void> {
  await mounted.unmount()
  assert(mounted.handle.disposed, "framework unmount didn't dispose the Bokeh mount")
  assert(mounted.target.childElementCount == 0, "framework unmount retained Bokeh DOM")
  assert(index.get(model) == null, "framework unmount retained a view in Bokeh's global index")
}

async function validate_controller(model: ReturnType<typeof Plotting.figure>): Promise<void> {
  const controller = new MountController()
  const active_mount = () => controller.mounted
  const first_target = document.createElement("div")
  const second_target = document.createElement("div")
  const first = controller.start(model, first_target)
  const second = controller.start(model, second_target)

  assert(await first == null, "a superseded mount unexpectedly completed")
  const mounted = await second
  assert(mounted != null, "the replacement mount didn't complete")
  assert(active_mount() == mounted, "the controller didn't expose the active mount")
  controller.dispose()

  const external_abort = new AbortController()
  let disposed = 0
  const aborted = await controller.start(model, document.createElement("div"), {
    mountOptions: {signal: external_abort.signal},
    onDisposed: () => disposed += 1,
  })
  assert(aborted != null, "the externally abortable mount didn't complete")
  external_abort.abort()
  assert(active_mount() == null, "an externally aborted mount remained publicly active")
  assert(disposed == 1, "external abort didn't report disposal exactly once")
}

async function validate_multi_root_mount(adapter: Adapter): Promise<void> {
  const source = ColumnDataSource.create({data: {x: [0, 1, 2], y: [1, 3, 2], z: [2, 1, 4]}})
  const x_range = Range1d.create({start: -0.5, end: 2.5})
  const first = Plotting.figure({width: 220, height: 160, x_range, tools: [], toolbar_location: null})
  first.line({field: "x"}, {field: "y"}, {source})
  const second = Plotting.figure({width: 220, height: 160, x_range, tools: [], toolbar_location: null})
  second.scatter({field: "x"}, {field: "z"}, {source})

  const mounted = await adapter.mount([first, second])
  assert(!mounted.handle.disposed, "multi-root adapter mount was already disposed")
  assert(mounted.handle.views.length == 2, "adapter didn't create both root views")
  assert(mounted.handle.models.length == 2, "multi-root mount didn't retain both roots")
  assert(first.document == mounted.handle.document, "first root wasn't attached to the shared document")
  assert(second.document == mounted.handle.document, "second root wasn't attached to the shared document")
  assert(source.document == mounted.handle.document, "shared source wasn't attached to the roots' document")
  assert(first.x_range == second.x_range && x_range.document == mounted.handle.document,
    "shared range wasn't retained in the roots' document")
  assert(index.get(first) != null && index.get(second) != null, "multi-root views weren't globally indexed")
  source.stream({x: [3], y: [4], z: [3]})
  assert(source.get_length() == 4, "shared source didn't remain live after a multi-root mount")

  await mounted.unmount()
  assert(mounted.handle.disposed, "multi-root framework unmount didn't dispose the Bokeh mount")
  assert(mounted.target.childElementCount == 0, "multi-root framework unmount retained Bokeh DOM")
  assert(index.get(first) == null && index.get(second) == null, "multi-root unmount retained globally indexed views")
  assert([first, second, source, x_range].every((model) => model.document == null),
    "multi-root unmount retained temporary document ownership")
}

export async function run_framework_test(framework: string, adapter: Adapter): Promise<FrameworkTestResult> {
  validate_registration()
  const {plot, source} = create_plot()
  let streams = 0
  const stream_count = () => streams
  source.streaming.connect(() => streams += 1)

  const first = await adapter.mount(plot)
  await validate_mount(plot, first)
  source.stream({x: [3], y: [4]})
  assert(stream_count() == 1, "streaming callback didn't run exactly once after the first mount")
  await validate_unmount(plot, first)

  const second = await adapter.mount(plot)
  await validate_mount(plot, second)
  source.stream({x: [4], y: [3]})
  assert(stream_count() == 2, "streaming callback was lost or duplicated after remount")
  await validate_unmount(plot, second)

  const controller = new AbortController()
  const third = await adapter.mount(plot, {signal: controller.signal})
  await validate_mount(plot, third)
  source.stream({x: [5], y: [2]})
  assert(stream_count() == 3, "streaming callback was lost or duplicated before abort")
  controller.abort()
  assert(third.handle.disposed, "aborting mountOptions.signal didn't dispose the Bokeh mount")
  assert(third.target.childElementCount == 0, "aborting mountOptions.signal retained Bokeh DOM")
  assert(index.get(plot) == null, "aborting mountOptions.signal retained a view in Bokeh's global index")
  await third.unmount()

  await validate_controller(plot)
  await validate_multi_root_mount(adapter)

  return {framework, mounts: 4, streams}
}

export function install_framework_test(framework: string, render: FrameworkRender): void {
  window.__bokeh_framework_test__ = run_framework_test(framework, {
    async mount(model, mountOptions) {
      let onMounted!: (mounted: BokehMount) => void
      let onError!: (error: unknown) => void
      const mounting = new Promise<BokehMount>((resolve, reject) => {
        onMounted = resolve
        onError = reject
      })
      const rendered = render({model, mountOptions, onMounted, onError})
      const handle = await mounting
      const target = rendered.target()
      assert(target != null, "framework render didn't create a Bokeh target")
      return {handle, target, unmount: rendered.unmount}
    },
  })
}

export function configure_hmr(hot: ImportMeta["hot"]): void {
  if (hot == null) {
    window.__bokeh_hmr__ = "disabled"
    return
  }

  window.__bokeh_hmr__ = "waiting"
}

export function mark_hmr_received(): void {
  window.__bokeh_hmr__ = "received"
}
