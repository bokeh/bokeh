import {ColumnDataSource, ModelResolver, MountError, Plotting, Range1d, index, register_models, register_standard_models} from "@bokeh/bokehjs"
import type {BokehMount, MountOptions} from "@bokeh/bokehjs"
import {DocumentMountController, MountController} from "@bokeh/framework"
import type {BokehModel, BokehRootModel} from "@bokeh/framework"

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
  updateMountOptions?(mountOptions: MountOptions): Promise<BokehMount>
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
  update?(request: FrameworkRenderRequest): void
  unmount(): void | Promise<void>
}

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new Error(message)
  }
}

function child_count(element: Element): number {
  return element.childElementCount
}

function model_document(model: BokehRootModel) {
  return model.document
}

async function wait_until(predicate: () => boolean, message: string): Promise<void> {
  const deadline = Date.now() + 5000
  while (!predicate()) {
    if (Date.now() > deadline) {
      throw new Error(message)
    }
    await new Promise((resolve) => setTimeout(resolve, 0))
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
  const abort_target = document.createElement("div")
  document.body.append(first_target, second_target, abort_target)
  const first = controller.start(model, first_target)
  let explicitly_disposed = 0
  const second = controller.start(model, second_target, {
    onDisposed: () => explicitly_disposed += 1,
  })

  assert(await first == null, "a superseded mount unexpectedly completed")
  const mounted = await second
  assert(mounted != null, "the replacement mount didn't complete")
  assert(active_mount() == mounted, "the controller didn't expose the active mount")
  controller.dispose()
  controller.dispose()
  assert(explicitly_disposed == 1, "explicit controller disposal wasn't reported exactly once")

  const preaborted_signal = new AbortController()
  preaborted_signal.abort()
  const preaborted = await controller.start(model, abort_target, {
    mountOptions: {signal: preaborted_signal.signal},
  })
  assert(preaborted == null, "a pre-aborted request created a mount")
  assert(active_mount() == null, "a pre-aborted request remained publicly active")
  assert(model.document == null, "a pre-aborted request retained temporary document ownership")

  const external_abort = new AbortController()
  let disposed = 0
  const aborted = await controller.start(model, abort_target, {
    mountOptions: {signal: external_abort.signal},
    onDisposed: () => disposed += 1,
  })
  assert(aborted != null, "the externally abortable mount didn't complete")
  external_abort.abort()
  assert(active_mount() == null, "an externally aborted mount remained publicly active")
  assert(disposed == 1, "external abort didn't report disposal exactly once")

  let mount_error: unknown = null
  const failed = await controller.start(model, document.createElement("div"), {
    onError: (error) => mount_error = error,
  })
  assert(failed == null, "a mount with a disconnected target unexpectedly completed")
  assert(mount_error instanceof MountError && mount_error.kind == "target",
    "the controller didn't surface a structured target error")
  assert(model.document == null, "a failed controller mount retained temporary document ownership")

  let callback_error: unknown = null
  const callback_failed = await controller.start(model, first_target, {
    onMounted: () => { throw new Error("application mount callback failed") },
    onError: (error) => callback_error = error,
  })
  assert(callback_failed == null && callback_error instanceof Error,
    "the controller didn't report a mount callback failure")
  assert(model_document(model) == null && child_count(first_target) == 0,
    "a mount callback failure retained temporary lifecycle state")
  controller.dispose()
  first_target.remove()
  second_target.remove()
  abort_target.remove()
}

async function validate_document_controller(): Promise<void> {
  const source = ColumnDataSource.create({data: {x: [0, 1], first: [1, 2], second: [2, 1]}})
  const x_range = Range1d.create({start: -0.5, end: 1.5})
  const first = Plotting.figure({width: 180, height: 120, x_range, tools: [], toolbar_location: null})
  first.line({field: "x"}, {field: "first"}, {source})
  const second = Plotting.figure({width: 180, height: 120, x_range, tools: [], toolbar_location: null})
  second.line({field: "x"}, {field: "second"}, {source})
  const duplicate = Plotting.figure({width: 180, height: 120, tools: [], toolbar_location: null})
  Object.defineProperty(duplicate, "id", {value: first.id})
  const duplicate_controller = new DocumentMountController()
  let duplicate_rejected = false
  try {
    duplicate_controller.update([first, duplicate])
  } catch {
    duplicate_rejected = true
  }
  assert(duplicate_rejected, "document controller accepted distinct roots with duplicate model IDs")
  const first_target = document.createElement("div")
  const second_target = document.createElement("div")
  const unrelated_content = document.createElement("p")
  unrelated_content.textContent = "framework content between Bokeh roots"
  document.body.append(first_target, unrelated_content, second_target)

  let resolve_mounted!: (mounted: BokehMount) => void
  let reject_mounted!: (error: unknown) => void
  const mounting = new Promise<BokehMount>((resolve, reject) => {
    resolve_mounted = resolve
    reject_mounted = reject
  })
  const controller = new DocumentMountController()
  controller.update([first, second], {onMounted: resolve_mounted, onError: reject_mounted})
  const detach_first = controller.attach(first, first_target)
  const detach_second = controller.attach(second, second_target)
  let mounted = await mounting

  assert(mounted.views.length == 2, "document controller didn't build both root views")
  assert(child_count(first_target) > 0 && child_count(second_target) > 0,
    "document controller didn't render into independent targets")
  assert(unrelated_content.isConnected, "document controller disturbed intervening framework content")
  assert(first.document == mounted.document && second.document == mounted.document && source.document == mounted.document,
    "distributed roots didn't retain one shared document")
  assert(index.get(first) != null && index.get(second) != null, "distributed roots weren't globally indexed")

  let resolve_remounted!: (mounted: BokehMount) => void
  let reject_remounted!: (error: unknown) => void
  const remounting = new Promise<BokehMount>((resolve, reject) => {
    resolve_remounted = resolve
    reject_remounted = reject
  })
  controller.update([first, second], {
    mountOptions: {use_for_title: false},
    onMounted: resolve_remounted,
    onError: reject_remounted,
  })
  const previous_mount = mounted
  mounted = await remounting
  assert(previous_mount.disposed, "changing a document mount option didn't dispose the previous mount")
  assert(mounted != previous_mount, "changing a document mount option reused the previous mount")
  assert(first.document == mounted.document && second.document == mounted.document,
    "changing a document mount option didn't transfer roots to the replacement document")

  detach_first()
  await wait_until(() => child_count(first_target) == 0,
    "detaching one document slot retained its Bokeh DOM")
  assert(!mounted.disposed, "detaching one document slot disposed the shared mount")
  assert(child_count(first_target) == 0, "detaching one document slot retained its Bokeh DOM")
  assert(child_count(second_target) > 0, "detaching one document slot removed a sibling root")
  assert(index.get(first) == null && index.get(second) != null,
    "selective document detachment removed the wrong globally indexed views")
  assert([first, second, source].every((model) => model.document == mounted.document),
    "selective document detachment released shared document ownership")

  const reattach_first = controller.attach(first, first_target)
  await wait_until(() => index.get(first) != null, "reattaching a document slot didn't rebuild its root view")
  assert(child_count(first_target) > 0 && child_count(second_target) > 0,
    "reattaching a document slot disturbed sibling framework content")

  let replacement_error: unknown = null
  const failed_target = document.createElement("div")
  reattach_first()
  const detach_failed_target = controller.attach(first, failed_target)
  controller.update([first, second], {
    mountOptions: {use_for_title: false},
    onError: (error) => replacement_error = error,
  })
  await wait_until(() => replacement_error != null, "failed target replacement wasn't reported")
  assert(child_count(first_target) > 0, "failed target replacement detached the working target")
  document.body.append(failed_target)
  controller.update([first, second], {mountOptions: {use_for_title: false}})
  await wait_until(() => child_count(failed_target) > 0, "target replacement wasn't retried after failure")
  assert(child_count(first_target) == 0, "successful target replacement retained the previous DOM")
  assert(controller.mounted == mounted, "target replacement recreated the shared mount")

  detach_failed_target()
  detach_second()
  await wait_until(() => child_count(first_target) == 0 && child_count(second_target) == 0,
    "selective document detachment retained Bokeh DOM")
  assert(!mounted.disposed, "detaching every document slot disposed the provider-owned mount")
  assert(child_count(first_target) == 0 && child_count(second_target) == 0,
    "selective document detachment retained Bokeh DOM")
  assert([first, second, source].every((model) => model.document == mounted.document),
    "detaching every document slot released provider-owned document state")
  controller.dispose()
  assert(mounted.disposed, "disposing the document provider didn't dispose its shared mount")
  assert([first, second, source].every((model) => model.document == null),
    "document provider disposal retained temporary document ownership")
  first_target.remove()
  failed_target.remove()
  unrelated_content.remove()
  second_target.remove()
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

async function validate_mount_options_update(framework: string, adapter: Adapter,
    model: ReturnType<typeof Plotting.figure>): Promise<void> {
  const mounted = await adapter.mount(model, {use_for_title: false})
  if (mounted.updateMountOptions == null) {
    await mounted.unmount()
    assert(framework != "react" && framework != "vue", `${framework} test adapter can't update mountOptions`)
    return
  }

  const replacement = await mounted.updateMountOptions({use_for_title: true})
  assert(mounted.handle.disposed, `${framework} retained its previous mount after mountOptions changed`)
  assert(replacement != mounted.handle, `${framework} reused its previous mount after mountOptions changed`)
  assert(!replacement.disposed && model.document == replacement.document,
    `${framework} didn't publish the replacement mount after mountOptions changed`)
  await mounted.unmount()
  assert(replacement.disposed, `${framework} unmount didn't dispose the replacement mount`)
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
  await validate_document_controller()
  await validate_multi_root_mount(adapter)
  await validate_mount_options_update(framework, adapter, plot)

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
      const updateMountOptions = rendered.update == null ? undefined : (mountOptions: MountOptions) => {
        let onMounted!: (mounted: BokehMount) => void
        let onError!: (error: unknown) => void
        const remounting = new Promise<BokehMount>((resolve, reject) => {
          onMounted = resolve
          onError = reject
        })
        rendered.update?.({model, mountOptions, onMounted, onError})
        return remounting
      }
      return {handle, target, updateMountOptions, unmount: rendered.unmount}
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
