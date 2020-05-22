// "polyfill" nodejs features
const global = window as any
global.Buffer = {}
global.process = {version: "unknown"}

// expose path-browserify as path
import "./path"

import sourcemaps from "source-map-support"
sourcemaps.install({environment: "browser"})
