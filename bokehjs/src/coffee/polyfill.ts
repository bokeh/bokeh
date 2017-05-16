declare function require(moduleName: string): any

if (typeof WeakMap !== "function") {
  require("es6-weak-map/implement")
}

if (typeof Set !== "function") {
  require("es6-set/implement")
}
