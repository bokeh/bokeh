import * as sinon from "sinon"

import {expect} from "#framework/assertions"
import {restorable} from "#framework/util"

import {ModelResolver} from "@bokehjs/core/resolvers"
import {Model} from "@bokehjs/model"

class Original extends Model {}
class Replacement extends Model {}
Replacement.__qualified__ = Original.__qualified__

describe("ModelResolver", () => {
  it("silently accepts repeated registration of the same constructor", () => {
    using warn = restorable(sinon.stub(console, "warn"))
    const resolver = new ModelResolver(null, [Original])
    resolver.register(Original)

    expect(resolver.get(Original.__qualified__)).to.be.equal(Original)
    expect(resolver.names).to.be.equal([Original.__qualified__])
    expect(warn.called).to.be.false
  })

  it("silently accepts the same constructor from a parent without adding a local binding", () => {
    using warn = restorable(sinon.stub(console, "warn"))
    const parent = new ModelResolver(null, [Original])
    const resolver = new ModelResolver(parent)
    resolver.register(Original)

    expect(resolver.get(Original.__qualified__)).to.be.equal(Original)
    expect(resolver.names).to.be.equal([])
    expect(warn.called).to.be.false
  })

  for (const inherited of [false, true]) {
    const location = inherited ? "parent" : "local"

    it(`warns and preserves a conflicting ${location} binding`, () => {
      using warn = restorable(sinon.stub(console, "warn"))
      const original = new ModelResolver(null, [Original])
      const resolver = inherited ? new ModelResolver(original) : original
      resolver.register(Replacement)

      expect(resolver.get(Original.__qualified__)).to.be.equal(Original)
      expect(warn.calledOnceWithExactly(`Model '${Original.__qualified__}' was already registered with this resolver`)).to.be.true
    })

    it(`can force replacement of a ${location} binding`, () => {
      using warn = restorable(sinon.stub(console, "warn"))
      const original = new ModelResolver(null, [Original])
      const resolver = inherited ? new ModelResolver(original) : original
      resolver.register(Replacement, true)

      expect(resolver.get(Original.__qualified__)).to.be.equal(Replacement)
      expect(resolver.names).to.be.equal([Original.__qualified__])
      if (inherited) {
        expect(original.get(Original.__qualified__)).to.be.equal(Original)
      }
      expect(warn.called).to.be.false
    })
  }

  it("can force a local binding for the same constructor from a parent", () => {
    using warn = restorable(sinon.stub(console, "warn"))
    const parent = new ModelResolver(null, [Original])
    const resolver = new ModelResolver(parent)
    resolver.register(Original, true)
    parent.register(Replacement, true)

    expect(resolver.get(Original.__qualified__)).to.be.equal(Original)
    expect(resolver.names).to.be.equal([Original.__qualified__])
    expect(warn.called).to.be.false
  })
})
