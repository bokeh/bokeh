declare function require(moduleName: string): any

require("es5-ext/object/assign/implement")
require("es5-ext/number/is-integer/implement")
require("es5-ext/string/#/repeat/implement")
require("es5-ext/array/from/implement")
require("es5-ext/math/log10/implement")
require("es6-set/implement")
require("es6-map/implement")
require("es6-weak-map/implement")

if (typeof Promise === "undefined") {
  require("es6-promise").polyfill()
}
