import type {HasProps} from "./has_props"
import type {View, ViewOf, IterViews} from "./view"

export class ViewManager {
  protected readonly _roots: Set<View>

  constructor(roots: Iterable<View> = [], protected drop?: (view: View) => void) {
    this._roots = new Set(roots)
  }

  toString(): string {
    const views = [...this._roots].map((view) => `${view}`).join(", ")
    return `ViewManager(${views})`
  }

  get<T extends HasProps>(model: T): ViewOf<T> | null {
    for (const view of this._roots) {
      if (view.model == model)
        return view
    }
    return null
  }

  get_by_id(id: string): ViewOf<HasProps> | null {
    for (const view of this._roots) {
      if (view.model.id == id)
        return view
    }
    return null
  }

  add(view: View): void {
    this._roots.add(view)
  }

  delete(view: View): void {
    this._roots.delete(view)
  }

  clear(): void {
    const drop = this.drop ?? ((view: View) => this.delete(view))
    for (const view of this) {
      drop(view)
    }
  }

  /* TODO (TS 5.2)
  [Symbol.dispose](): void {
    this.clear()
  }
  */

  get roots(): View[] {
    return [...this._roots]
  }

  *[Symbol.iterator](): IterViews {
    yield* this._roots
  }

  *views(): IterViews {
    yield* this.query(() => true)
  }

  *query(fn: (view: View) => boolean): IterViews {
    const visited = new Set<View>()

    function* descend(view: View): IterViews {
      if (visited.has(view)) {
        return
      }

      visited.add(view)

      if (fn(view)) {
        yield view
      }

      for (const child of view.children()) {
        yield* descend(child)
      }
    }

    for (const root of this._roots) {
      yield* descend(root)
    }
  }

  query_one(fn: (view: View) => boolean): View | null {
    for (const view of this.query(fn)) {
      return view
    }
    return null
  }

  *find<T extends HasProps>(model: T): IterViews<ViewOf<T>> {
    yield* this.query((view) => view.model == model)
  }

  *find_by_id(id: string): IterViews {
    yield* this.query((view) => view.model.id == id)
  }

  find_one<T extends HasProps>(model: T): ViewOf<T> | null {
    for (const view of this.find(model)) {
      return view
    }
    return null
  }

  find_one_by_id(id: string): View | null {
    for (const view of this.find_by_id(id)) {
      return view
    }
    return null
  }

  get_one<T extends HasProps>(model: T): ViewOf<T> {
    const view = this.find_one(model)
    if (view != null)
      return view
    else
      throw new Error(`cannot find a view for ${model}`)
  }

  get_one_by_id(id: string): View {
    const view = this.find_one_by_id(id)
    if (view != null)
      return view
    else
      throw new Error(`cannot find a view for a model with '${id}' identity`)
  }

  find_all<T extends HasProps>(model: T): ViewOf<T>[] {
    return [...this.find(model)]
  }

  find_all_by_id(id: string): View[] {
    return [...this.find_by_id(id)]
  }
}
