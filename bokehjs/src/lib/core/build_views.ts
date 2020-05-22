import {HasProps} from "./has_props"
import {View, ViewOf} from "./view"
import {difference} from "./util/array"

export type ViewStorage<T extends HasProps> = Map<T, ViewOf<T>>
export type Options = {parent: View | null}

async function _build_view<T extends HasProps>(view_cls: T["default_view"], model: T, options: Options): Promise<ViewOf<T>> {
  const view = new view_cls({...options, model}) as ViewOf<T>
  view.initialize()
  await view.lazy_initialize()
  return view
}

export async function build_view<T extends HasProps>(model: T, options: Options = {parent: null},
    cls: (model: T) => T["default_view"] = (model) => model.default_view): Promise<ViewOf<T>> {
  const view = await _build_view(cls(model), model, options)
  view.connect_signals()
  return view
}

export async function build_views<T extends HasProps>(view_storage: ViewStorage<T>, models: T[],
    options: Options = {parent: null}, cls: (model: T) => T["default_view"] = (model) => model.default_view): Promise<ViewOf<T>[]> {

  const to_remove = difference([...view_storage.keys()], models)

  for (const model of to_remove) {
    view_storage.get(model)!.remove()
    view_storage.delete(model)
  }

  const created_views = []
  const new_models = models.filter((model) => !view_storage.has(model))

  for (const model of new_models) {
    const view = await _build_view(cls(model), model, options)
    view_storage.set(model, view)
    created_views.push(view)
  }

  for (const view of created_views)
    view.connect_signals()

  return created_views
}

export function remove_views(view_storage: ViewStorage<HasProps>): void {
  for (const [model, view] of view_storage) {
    view.remove()
    view_storage.delete(model)
  }
}
