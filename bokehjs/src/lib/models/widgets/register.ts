import {default_resolver, register_models} from "../../base"
import type {ModelResolver} from "../../core/resolvers"

import * as WidgetModels from "./"

export function register_widget_models(resolver: ModelResolver = default_resolver, force: boolean = false): void {
  register_models(WidgetModels, force, resolver)
}
