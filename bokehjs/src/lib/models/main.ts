import {register_models} from "../base"

import * as AllModels from "./"
register_models(AllModels)

import * as DOMModels from "./dom"
const {GlobalInlineStyleSheet, TranslatableText, ...unregisteredDOMModels} = DOMModels
register_models(unregisteredDOMModels)
