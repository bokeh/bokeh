import {HasProps} from "./has_props"
import {View} from "./view"
import {Class} from "./class"
import {difference} from "./util/array"

export type ViewStorage = {[key: string]: View}

export function build_views<T extends HasProps>(view_storage: ViewStorage, models: T[],
    options: object, cls: (model: T) => Class<View> = (model) => model.default_view): View[] {

  const to_remove = difference(Object.keys(view_storage), models.map((model) => model.id))

  for (const model_id of to_remove) {
    view_storage[model_id].remove()
    delete view_storage[model_id]
  }

  const created_views = []
  const new_models = models.filter((model) => view_storage[model.id] == null)

  for (const model of new_models) {
    const view_cls = cls(model)
    const view_options = {...options, model, connect_signals: false}
    const view = new view_cls(view_options)
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
