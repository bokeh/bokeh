import {expect} from "#framework/assertions"

import {bind} from "@bokehjs/core/class"

describe("core/class module", () => {
  describe("implements @bind decorator", () => {
    class A {
      readonly calls: string[] = []

      @bind
      method(arg: number): this {
        this.calls.push(`A(${arg})`)
        return this
      }
    }

    it("which binds a method to its instance", () => {
      const a = new A()
      const {method} = a
      expect(method(1)).to.be.identical(a)
      expect(a.calls).to.be.equal(["A(1)"])
    })

    it("which caches the bound method on the instance", () => {
      const a = new A()
      expect(Object.hasOwn(a, "method")).to.be.false
      const method = a.method
      expect(Object.hasOwn(a, "method")).to.be.true
      expect(a.method).to.be.identical(method)
    })

    it("which binds each instance separately", () => {
      const a0 = new A()
      const a1 = new A()
      expect(a0.method).to.not.be.identical(a1.method)
      a0.method(0)
      a1.method(1)
      expect(a0.calls).to.be.equal(["A(0)"])
      expect(a1.calls).to.be.equal(["A(1)"])
    })

    it("which supports inherited methods", () => {
      class B extends A {}
      const b = new B()
      const {method} = b
      expect(method(1)).to.be.identical(b)
      expect(b.method).to.be.identical(method)
      expect(b.calls).to.be.equal(["A(1)"])
    })

    it("which supports bound overrides calling super", () => {
      class B extends A {
        @bind
        override method(arg: number): this {
          super.method(arg)
          this.calls.push(`B(${arg})`)
          return this
        }
      }

      const b = new B()
      const {method} = b
      expect(method(1)).to.be.identical(b)
      expect(method(2)).to.be.identical(b)
      expect(b.method).to.be.identical(method)
      expect(b.calls).to.be.equal(["A(1)", "B(1)", "A(2)", "B(2)"])
    })

    it("which supports unbound overrides calling super", () => {
      class B extends A {
        override method(arg: number): this {
          super.method(arg)
          this.calls.push(`B(${arg})`)
          return this
        }
      }

      const b = new B()
      b.method(1)
      b.method(2)
      expect(Object.hasOwn(b, "method")).to.be.false
      expect(b.calls).to.be.equal(["A(1)", "B(1)", "A(2)", "B(2)"])
    })

    it("which supports multiple levels of bound overrides", () => {
      class B extends A {
        @bind
        override method(arg: number): this {
          super.method(arg)
          this.calls.push(`B(${arg})`)
          return this
        }
      }
      class C extends B {
        @bind
        override method(arg: number): this {
          super.method(arg)
          this.calls.push(`C(${arg})`)
          return this
        }
      }

      const c = new C()
      const {method} = c
      method(1)
      method(2)
      expect(c.method).to.be.identical(method)
      expect(c.calls).to.be.equal(["A(1)", "B(1)", "C(1)", "A(2)", "B(2)", "C(2)"])
    })
  })
})
