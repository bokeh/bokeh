import assert from "node:assert/strict"

assert.equal(globalThis.window, undefined)
assert.equal(globalThis.document, undefined)

const Bokeh = await import("@bokeh/bokehjs")
assert.equal(typeof Bokeh.mount, "function")
assert.equal(typeof Bokeh.Plotting.figure, "function")
assert.equal(typeof Bokeh.register_models, "function")
assert.equal(typeof Bokeh.register_standard_models, "function")

const plot = Bokeh.Plotting.figure({width: 240, height: 160, tools: []})
plot.line([0, 1], [1, 0])
assert.equal(plot.width, 240)

const resolver = new Bokeh.ModelResolver(null)
Bokeh.register_standard_models(resolver)
assert.equal(resolver.get("Range1d"), Bokeh.Range1d)

console.log("SSR import and construction passed")
