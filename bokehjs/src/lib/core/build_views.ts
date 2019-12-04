import {HasProps} from "./has_props"
import {View} from "./view"
import {difference} from "./util/array"

export type ViewStorage = {[key: string]: View}
export type Options = {parent: View | null}

export type ViewOf<T extends HasProps> = InstanceType<T["default_view"]>

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

export async function build_views<T extends HasProps>(view_storage: ViewStorage, models: T[],
    options: Options = {parent: null}, cls: (model: T) => T["default_view"] = (model) => model.default_view): Promise<ViewOf<T>[]> {

  const to_remove = difference(Object.keys(view_storage), models.map((model) => model.id))

  for (const model_id of to_remove) {
    view_storage[model_id].remove()
    delete view_storage[model_id]
  }

  const created_views = []
  const new_models = models.filter((model) => view_storage[model.id] == null)

  for (const model of new_models) {
    const view = await _build_view(cls(model), model, options)
    view_storage[model.id] = view
    created_views.push(view)
  }

  for (const view of created_views)
    view.connect_signals()

  return created_views
}

export function remove_views(view_storage: ViewStorage): void {
  for (const id in view_storage) {
    view_storage[id].remove()
    delete view_storage[id]
  }
}
