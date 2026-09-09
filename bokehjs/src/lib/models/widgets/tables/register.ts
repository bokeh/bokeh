import {default_resolver, register_models} from "../../../base"
import type {ModelResolver} from "../../../core/resolvers"

import * as TableModels from "./"

export function register_table_models(resolver: ModelResolver = default_resolver, force: boolean = false): void {
  register_models(TableModels, force, resolver)
}
