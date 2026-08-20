import type {HasProps} from "./has_props"
import type {View, ViewOf} from "./view"
import type {ViewManager} from "./view_manager"
import {difference} from "./util/array"
import {assert} from "./util/assert"

export type {IterViews, ViewOf, View, ChildView} from "./view"

export type ViewStorage<T extends HasProps> = Map<T, ViewOf<T>>
export type Options<T extends View> = {
  parent: T["parent"] | null | ((obj: HasProps) => T["parent"] | null)
  owner?: ViewManager
}

async function _build_view<T extends HasProps>(view_cls: T["default_view"], model: T, options: Options<ViewOf<T>>): Promise<ViewOf<T>> {
  assert(view_cls != null, "model doesn't implement a view")
  const view = new view_cls({...options, model})
  view.initialize()
  await view.lazy_initialize()
  return view
}

export async function build_view<T extends HasProps>(model: T, options: Options<ViewOf<T>> = {parent: null},
    cls: (model: T) => T["default_view"] = (model) => model.default_view): Promise<ViewOf<T>> {
  const view = await _build_view(cls(model), model, options)
  view.connect_signals()
  return view
}

export type BuildResult<T extends HasProps> = {created: ViewOf<T>[], removed: ViewOf<T>[]}

type Deferred = {
  readonly promise: Promise<void>
  readonly resolve: () => void
  readonly reject: (error: unknown) => void
}

function _deferred(): Deferred {
  let resolve!: () => void
  let reject!: (error: unknown) => void
  const promise = new Promise<void>((res, rej) => {
    resolve = res
    reject = rej
  })
  promise.catch(() => {})
  return {promise, resolve, reject}
}

type BuildState<T extends HasProps> = {
  readonly pending: Map<T, Deferred>
  desired: Set<T>
  baseline: Set<T>
}

const _states = new WeakMap<ViewStorage<any>, BuildState<any>>()

function _state<T extends HasProps>(view_storage: ViewStorage<T>): BuildState<T> {
  let state = _states.get(view_storage)
  if (state == null) {
    state = {pending: new Map(), desired: new Set(), baseline: new Set()}
    _states.set(view_storage, state)
  }
  return state
}

function _reorder<T extends HasProps>(view_storage: ViewStorage<T>, order: Iterable<T>): void {
  for (const model of order) {
    const view = view_storage.get(model)
    if (view != null) {
      view_storage.delete(model)
      view_storage.set(model, view)
    }
  }
}

/**
 * Builds views for `models` into `view_storage` and removes views of models
 * that aren't wanted any more.
 *
 * Overlapping calls on the same `view_storage` cooperate: a model is built at
 * most once, by whichever call reserved it first, and a call wanting a model
 * somebody else is building waits for that build. So once this resolves, every
 * requested model that is still wanted has its view in `view_storage`.
 *
 * A call only waits on builds it doesn't own, and only after finishing its own,
 * so waiting can't cycle.
 */
export async function build_views<T extends HasProps>(
  view_storage: ViewStorage<T>,
  models: T[],
  options: Options<ViewOf<T>> = {parent: null},
  cls: (model: T) => T["default_view"] = (model) => model.default_view,
): Promise<BuildResult<T>> {
  const state = _state(view_storage)
  state.desired = new Set(models)

  const to_remove = difference([...view_storage.keys()], models)

  const removed_views: ViewOf<T>[] = []
  for (const model of to_remove) {
    const view = view_storage.get(model)
    if (view != null) {
      view_storage.delete(model)
      removed_views.push(view)
      view.remove()
    }
  }

  if (state.pending.size == 0) {
    state.baseline = new Set(view_storage.keys())
  }
  const {baseline} = state

  // Reserved up front, before awaiting anything, so an overlapping call can't
  // start a second build for any of the batch, not even models we haven't
  // gotten to yet.
  const owned = new Map<T, Deferred>()
  const awaited: Promise<void>[] = []
  for (const model of models) {
    if (view_storage.has(model) || owned.has(model)) {
      continue
    }
    const pending = state.pending.get(model)
    if (pending != null) {
      awaited.push(pending.promise)
    } else {
      const deferred = _deferred()
      state.pending.set(model, deferred)
      owned.set(model, deferred)
    }
  }

  const built: [T, ViewOf<T>][] = []
  let failure: unknown = null

  try {
    for (const [model, deferred] of owned) {
      const view = await _build_view(cls(model), model, options)
      if (state.desired.has(model)) {
        view_storage.set(model, view)
        built.push([model, view])
      } else {
        // A later call stopped wanting this model but couldn't see the build in
        // progress, so cleaning up is up to us.
        removed_views.push(view)
        view.remove()
      }
      state.pending.delete(model)
      deferred.resolve()
    }
  } catch (error) {
    failure = error
  }

  // Release reservations we still hold (i.e. after a failure), so waiters can't hang.
  for (const [model, deferred] of owned) {
    if (state.pending.get(model) === deferred) {
      state.pending.delete(model)
      deferred.reject(failure ?? new Error(`${model} view build was abandoned`))
    }
  }

  if (failure == null) {
    try {
      await Promise.all(awaited)
    } catch (error) {
      failure = error
    }
  }

  _reorder(view_storage, [...state.desired].filter((model) => !baseline.has(model)))

  if (state.pending.size == 0) {
    // Run fully settled: let the next one snapshot afresh, and stop retaining
    // models that are long gone.
    state.baseline = new Set()
  }

  const created_views: ViewOf<T>[] = []
  for (const [model, view] of built) {
    // An overlapping call may have removed this view while we built the rest of
    // the batch. Connecting a removed view would leave it reacting to its model
    // forever, with nothing left to disconnect it.
    if (view_storage.get(model) === view) {
      view.connect_signals()
      created_views.push(view)
    }
  }

  if (failure != null) {
    throw failure
  }

  return {
    created: created_views,
    removed: removed_views,
  }
}

export function remove_views(view_storage: ViewStorage<HasProps>): void {
  // Nothing is wanted any more, so that a build still in flight tears its view
  // down instead of storing and connecting it into a storage nobody owns.
  _state(view_storage).desired = new Set()

  for (const [model, view] of view_storage) {
    view.remove()
    view_storage.delete(model)
  }
}

export function traverse_views(views: View[], fn: (view: View) => void): void {
  const visited = new Set<View>()
  const queue: View[] = [...views]

  while (true) {
    const view = queue.shift()
    if (view === undefined) {
      break
    }
    if (visited.has(view)) {
      continue
    }
    visited.add(view)
    queue.push(...view.children_views())
    fn(view)
  }
}
