import {register_models} from "../base"

import * as AllModels from "./"
register_models(AllModels)

import * as DOMModels from "./dom"
const {GlobalInlineStyleSheet, ...unregisteredDOMModels} = DOMModels
register_models(unregisteredDOMModels)
