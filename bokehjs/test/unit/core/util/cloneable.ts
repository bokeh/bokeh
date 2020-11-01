import {expect} from "assertions"

import {Cloner, clone, Cloneable, CloneableType} from "@bokehjs/core/util/cloneable"
import {Comparator, equals, Equatable} from "@bokehjs/core/util/eq"

function copy<T extends CloneableType>(obj: T): T {
  const cloner = new Cloner()
  return cloner.clone(obj)
}

describe("core/util/cloneable module", () => {
  describe("implements clone() function", () => {
    it("that supports null", () => {
      const v0 = null
      const r0 = copy(v0)

      expect(r0).to.be.equal(v0)
      expect(r0).to.be.identical(v0)
    })

    it("that supports booleans", () => {
      const v0 = true
      const r0 = copy(v0)

      expect(r0).to.be.equal(v0)
      expect(r0).to.be.identical(v0)

      const v1 = false
      const r1 = copy(v1)

      expect(r1).to.be.equal(v1)
      expect(r1).to.be.identical(v1)
    })

    it("that supports numbers", () => {
      const v0 = 123
      const r0 = copy(v0)

      expect(r0).to.be.equal(v0)
      expect(r0).to.be.identical(v0)
    })

    it("that supports strings", () => {
      const v0 = "abc"
      const r0 = copy(v0)

      expect(r0).to.be.equal(v0)
      expect(r0).to.be.identical(v0)
    })

    it("that supports arrays", () => {
      const v0: number[] = []
      const r0 = copy(v0)

      expect(r0).to.be.equal(v0)
      expect(r0).to.not.be.identical(v0)

      const v1 = [0, 1, 2]
      const r1 = copy(v1)

      expect(r1).to.be.equal(v1)
      expect(r1).to.not.be.identical(v1)

      const v2 = [[0, 1, 2], [3, 4, 5]]
      const r2 = copy(v2)

      expect(r2).to.be.equal(v2)
      expect(r2).to.not.be.identical(v2)
      expect(r2[0]).to.be.equal(v2[0])
      expect(r2[0]).to.not.be.identical(v2[0])
      expect(r2[1]).to.be.equal(v2[1])
      expect(r2[1]).to.not.be.identical(v2[1])
    })

    it("that supports plain objects", () => {
      const v0 = {}
      const r0 = copy(v0)

      expect(r0).to.be.equal(v0)
      expect(r0).to.not.be.identical(v0)

      const v1 = {k0: 0, k1: 1}
      const r1 = copy(v1)

      expect(r1).to.be.equal(v1)
      expect(r1).to.not.be.identical(v1)

      const v2 = {k0: {k01: 0}, k1: {k11: 1}}
      const r2 = copy(v2)

      expect(r2).to.be.equal(v2)
      expect(r2).to.not.be.identical(v2)
      expect(r2.k0).to.be.equal(v2.k0)
      expect(r2.k0).to.not.be.identical(v2.k0)
      expect(r2.k1).to.be.equal(v2.k1)
      expect(r2.k1).to.not.be.identical(v2.k1)
    })

    it("that supports objects implementing Cloneable interface", () => {
      class Some implements Cloneable, Equatable {
        constructor(readonly value: number[]) {}

        [clone](cloner: Cloner): this {
          return new Some(cloner.clone(this.value)) as this
        }

        [equals](that: this, cmp: Comparator): boolean {
          return cmp.eq(this.value, that.value)
        }
      }

      const v0 = new Some([0, 1, 2])
      const r0 = copy(v0)

      expect(r0).to.be.equal(v0)
      expect(r0).to.not.be.identical(v0)
      expect(r0.value).to.be.equal(v0.value)
      expect(r0.value).to.not.be.identical(v0.value)
    })
  })
})
