import {default_resolver, register_models} from "../base"
import type {ModelResolver} from "../core/resolvers"

import * as AllModels from "./"
import * as DOMModels from "./dom"

export function register_standard_models(resolver: ModelResolver = default_resolver, force: boolean = false): void {
  register_models(AllModels, force, resolver)

  const {GlobalInlineStyleSheet: _GlobalInlineStyleSheet, ...registered_dom_models} = DOMModels
  register_models(registered_dom_models, force, resolver)
}
