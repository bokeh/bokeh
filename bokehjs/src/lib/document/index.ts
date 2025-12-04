export * from "./document"
export * from "./events"

import {register_models} from "../base"
import * as ConfigModels from "./config"
register_models(ConfigModels)
