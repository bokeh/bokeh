import {default_resolver, register_models} from "../base"
import type {ModelResolver} from "../core/resolvers"
import {register_standard_models} from "../models/register"
import * as WidgetModels from "../models/widgets"
import * as TableModels from "../models/widgets/tables"

/** Register every model shipped in the BokehJS npm package. */
export function register_all_models(resolver: ModelResolver = default_resolver, force: boolean = false): void {
  register_standard_models(resolver, force)
  register_models(WidgetModels, force, resolver)
  register_models(TableModels, force, resolver)
}
