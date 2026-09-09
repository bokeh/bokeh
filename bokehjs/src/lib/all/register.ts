import {default_resolver} from "../base"
import type {ModelResolver} from "../core/resolvers"
import {register_standard_models} from "../models/register"
import {register_widget_models} from "../models/widgets/register"
import {register_table_models} from "../models/widgets/tables/register"

/** Register every model shipped in the BokehJS npm package. */
export function register_all_models(resolver: ModelResolver = default_resolver, force: boolean = false): void {
  register_standard_models(resolver, force)
  register_widget_models(resolver, force)
  register_table_models(resolver, force)
}
