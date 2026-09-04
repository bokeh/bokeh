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
  try {
    view.initialize()
    await view.lazy_initialize()
    return view
  } catch (error) {
    view.remove()
    throw error
  }
}

export async function build_view<T extends HasProps>(model: T, options: Options<ViewOf<T>> = {parent: null},
    cls: (model: T) => T["default_view"] = (model) => model.default_view): Promise<ViewOf<T>> {
  const view = await _build_view(cls(model), model, options)
  try {
    view.connect_signals()
    return view
  } catch (error) {
    view.remove()
    throw error
  }
}

export type BuildResult<T extends HasProps> = {created: ViewOf<T>[], removed: ViewOf<T>[]}

/**
 * A build of a single model's view, shared by all calls that want that model.
 * Resolves with the view and whether it ended up in `view_storage` (it doesn't
 * if nothing wants the model any more by the time it's built).
 */
type PendingBuild<T extends HasProps> = Promise<{view: ViewOf<T>, stored: boolean}>

type BuildState<T extends HasProps> = {
  readonly pending: Map<T, PendingBuild<T>>
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

async function _build_into<T extends HasProps>(
  view_storage: ViewStorage<T>,
  state: BuildState<T>,
  model: T,
  options: Options<ViewOf<T>>,
  cls: (model: T) => T["default_view"],
): PendingBuild<T> {
  try {
    const view = await _build_view(cls(model), model, options)
    if (state.desired.has(model)) {
      view_storage.set(model, view)
      // Connected before returning, i.e. before anything else gets to run, so
      // that `view_storage` never holds a view that hasn't been connected yet.
      // An overlapping call's `to_remove` diff can see anything in there, and
      // remove() assumes connect_signals() already ran.
      view.connect_signals()
      return {view, stored: true}
    } else {
      // Nothing wants this model any more, but the call that dropped it couldn't
      // see this build in progress, so cleaning up is up to us. Never connected,
      // so that connect_signals() side effects (e.g. an async continuation that
      // lands on this view later) can't outlive a view nothing asked for.
      view.remove()
      return {view, stored: false}
    }
  } finally {
    state.pending.delete(model)
  }
}

/**
 * Builds views for `models` into `view_storage` and removes views of models
 * that aren't wanted any more.
 *
 * Overlapping calls on the same `view_storage` cooperate: a model is built at
 * most once, by whichever call got to it first, and a call wanting a model
 * somebody else is already building waits for that build instead of starting a
 * second one. So once this resolves, every requested model that is still wanted
 * has a connected view in `view_storage`.
 *
 * Models are processed in request order, waiting included, so a view is never
 * initialized ahead of a view requested before it.
 *
 * A build belongs to the model, not to the call that started it, and never
 * waits on a call, so waiting can't cycle and a failing model doesn't poison
 * unrelated models: whatever is still wanted can be built by a later call. The
 * one thing this can't support is a view whose (lazy) initialization asks the
 * same `view_storage` for its own model, which would wait for itself.
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

  const built: [T, ViewOf<T>][] = []
  let failure: unknown = null

  try {
    for (const model of models) {
      if (view_storage.has(model) || !state.desired.has(model)) {
        // Either already built, or a later call has stopped wanting it, in which
        // case building it would just be followed by tearing it down again.
        continue
      }
      const pending = state.pending.get(model)
      if (pending != null) {
        // Somebody got here first. Wait for their build, both to not build a
        // second view for this model, and to keep the rest of our batch behind
        // this model's initialization.
        await pending
        continue
      }
      // Registered before awaiting anything, so an overlapping call is
      // guaranteed to find this build instead of starting its own. The build
      // clears its own entry as it settles, so a failed one is never left
      // around for a later call to inherit.
      const build = _build_into(view_storage, state, model, options, cls)
      state.pending.set(model, build)
      const {view, stored} = await build
      if (stored) {
        built.push([model, view])
      } else {
        removed_views.push(view)
      }
    }
  } catch (error) {
    failure = error
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
    // the batch, in which case it's destroyed and not ours to report.
    if (view_storage.get(model) === view) {
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
