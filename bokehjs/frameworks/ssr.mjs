import assert from "node:assert/strict"

assert.equal(globalThis.window, undefined)
assert.equal(globalThis.document, undefined)

// Exercise this checkout's freshly built modules. The packed SSR fixture separately
// verifies these same imports through the public npm package exports.
const Bokeh = await import("../build/js/lib/bokeh_package.js")
const {register_all_models} = await import("../build/js/lib/all/register.js")
assert.equal(typeof Bokeh.mount, "function")
assert.equal(typeof Bokeh.Plotting.figure, "function")
assert.equal(typeof Bokeh.register_models, "function")
assert.equal(typeof Bokeh.register_standard_models, "function")

const plot = Bokeh.Plotting.figure({width: 240, height: 160, tools: []})
plot.line([0, 1], [1, 0])
assert.equal(plot.width, 240)

const resolver = new Bokeh.ModelResolver(null)
register_all_models(resolver)
assert.equal(resolver.get("Range1d"), Bokeh.Range1d)
assert.equal(resolver.get("Button")?.__qualified__, "Button")
assert.equal(resolver.get("DataTable")?.__qualified__, "DataTable")

console.log("SSR import and construction passed")
