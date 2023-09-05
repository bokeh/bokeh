// "polyfill" nodejs features
const global = window as any
global.Buffer = {}
global.process = {version: "unknown"}

// "polyfill" esnext features
if (typeof Symbol.dispose === "undefined") {
  (Symbol as any).dispose = Symbol("dispose")
}
if (typeof Symbol.asyncDispose === "undefined") {
  (Symbol as any).asyncDispose = Symbol("asyncDispose")
}

// expose path-browserify as path
import "./path"

import sourcemaps from "source-map-support"
sourcemaps.install({environment: "browser"})
