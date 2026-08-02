import {expect} from "#framework/assertions"

import {register_models} from "@bokehjs/base"
import {ModelResolver} from "@bokehjs/core/resolvers"
import {register_standard_models} from "@bokehjs/models/register"
import {Range1d} from "@bokehjs/models/ranges/range1d"
import {Document} from "@bokehjs/document"

interface CustomRange extends Range1d.Attrs {}
class CustomRange extends Range1d {}

describe("model registration", () => {
  it("can populate an isolated resolver", () => {
    const resolver = new ModelResolver(null)
    register_standard_models(resolver)

    expect(resolver.get("Range1d")).to.be.equal(Range1d)
  })

  it("can deserialize standard and custom models with an isolated resolver", () => {
    const resolver = new ModelResolver(null)
    register_standard_models(resolver)
    register_models([CustomRange], resolver)

    const original = new Document({roots: [Range1d.create({start: 3, end: 4}), CustomRange.create({start: 1, end: 2})]})
    const restored = Document.from_json(original.to_json(), {resolver})
    try {
      const [standard, range] = restored.roots()
      expect(standard).to.be.instanceof(Range1d)
      expect(range).to.be.instanceof(CustomRange)
    } finally {
      original.destroy()
      restored.destroy()
    }
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

  it("uses object keys as stable names for custom extensions", () => {
    interface a extends Range1d.Attrs {}
    class a extends Range1d {}
    const MinifiedRange = a

    const resolver = new ModelResolver(null)
    register_models({CustomRange: MinifiedRange}, resolver)

    expect(MinifiedRange.__qualified__).to.be.equal("CustomRange")
    expect(resolver.get("CustomRange")).to.be.equal(MinifiedRange)
  })
})
