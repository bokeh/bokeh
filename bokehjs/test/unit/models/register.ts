import {expect} from "#framework/assertions"

import {register_models} from "@bokehjs/base"
import {ModelResolver} from "@bokehjs/core/resolvers"
import {register_standard_models} from "@bokehjs/models/register"
import {Range1d} from "@bokehjs/models/ranges/range1d"

interface CustomRange extends Range1d.Attrs {}
class CustomRange extends Range1d {}

describe("model registration", () => {
  it("can populate an isolated resolver", () => {
    const resolver = new ModelResolver(null)
    register_standard_models(resolver)

    expect(resolver.get("Range1d")).to.be.equal(Range1d)
  })

  it("can register custom models without using the global resolver", () => {
    const resolver = new ModelResolver(null)
    register_models([CustomRange], resolver)

    expect(resolver.get("CustomRange")).to.be.equal(CustomRange)
  })

  it("can use a stable qualified name in minified custom extensions", () => {
    interface MinifiedRange extends Range1d.Attrs {}
    class MinifiedRange extends Range1d {}
    MinifiedRange.__qualified__ = "extension.CustomRange"

    const resolver = new ModelResolver(null)
    register_models([MinifiedRange], resolver)

    expect(resolver.get("extension.CustomRange")).to.be.equal(MinifiedRange)
  })
})
