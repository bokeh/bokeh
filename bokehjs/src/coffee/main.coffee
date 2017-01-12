import "./core/util/underscore"

export {version} from "./version"

import * as _ from "underscore"
Object.defineProperty(module.exports, "_", {
  get: () ->
    console.warn("Bokeh._ was deprecated in Bokeh 0.12.4 and will be removed.
                  You have to provide your own copy of underscore if necessary.")
    return _
})

import * as embed from "./embed"
export {embed}

export {logger, set_log_level} from "./core/logging"
export {Models, index}         from "./base"
export {safely}                from "./safely"
