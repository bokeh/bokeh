import sinon from "sinon"
import {expect} from "#framework/assertions"

import {build_view} from "@bokehjs/core/build_views"
import {MathJaxProvider} from "@bokehjs/models/text/providers"
import {ascii2svg, find_tex, mathml2svg, tex2svg} from "@bokehjs/models/text/mathjax"
import {Div} from "@bokehjs/models/widgets/div"
import {WidgetView} from "@bokehjs/models/widgets/widget"

/** Loads MathJax once `finish()` is called. */
class ControlledProvider extends MathJaxProvider {
  fetches = 0

  get MathJax() {
    return this.status == "loaded" ? {ascii2svg, find_tex, mathml2svg, tex2svg} : null
  }

  private _finish: (() => void) | null = null

  async fetch(): Promise<void> {
    this.fetches += 1
    this.status = "loading"
    await new Promise<void>((resolve) => this._finish = resolve)
    this.status = "loaded"
    this.ready.emit()
  }

  finish(): void {
    this._finish?.()
  }
}

describe("models/text/providers module", () => {
  describe("MathJaxProvider.load()", () => {
    it("should fetch only once for concurrent calls", async () => {
      const provider = new ControlledProvider()
      const loading0 = provider.load()
      const loading1 = provider.load()
      expect(provider.fetches).to.be.equal(1)
      expect(provider.status).to.be.equal("loading")

      provider.finish()
      await Promise.all([loading0, loading1])
      expect(provider.status).to.be.equal("loaded")

      await provider.load()
      expect(provider.fetches).to.be.equal(1)
    })

    it("should not fetch when loading already failed", async () => {
      const provider = new ControlledProvider()
      provider.status = "failed"
      await provider.load()
      expect(provider.fetches).to.be.equal(0)
    })
  })

  describe("in WidgetView", () => {
    it("should load MathJax without blocking initialization and re-render TeX once loaded", async () => {
      const provider = new ControlledProvider()
      const stub = sinon.stub(WidgetView.prototype, "provider")
      stub.value(provider)
      try {
        const div = Div.create({text: "$$x$$"})
        const view = await build_view(div)
        view.build(document.body)
        try {
          expect(provider.fetches).to.be.equal(1)
          expect(provider.status).to.be.equal("loading")

          // not finished while MathJax is loading, even if otherwise finished
          view.mark_finished()
          expect(view.has_finished()).to.be.false

          let resolved = false
          const ready = view.ready.then(() => resolved = true)
          await Promise.resolve()
          expect(resolved).to.be.false

          const rerender = sinon.spy(view, "rerender")
          try {
            provider.finish()
            await ready
            expect(provider.status).to.be.equal("loaded")
            expect(rerender.calledOnce).to.be.true
            expect(view.has_finished()).to.be.true
          } finally {
            rerender.restore()
          }
        } finally {
          view.remove()
        }
      } finally {
        stub.restore()
      }
    })

    it("should not re-render views that weren't rendered yet", async () => {
      const provider = new ControlledProvider()
      const stub = sinon.stub(WidgetView.prototype, "provider")
      stub.value(provider)
      try {
        const view = await build_view(Div.create({text: "$$x$$"}))
        const rerender = sinon.spy(view, "rerender")
        try {
          provider.finish()
          await view.ready
          expect(rerender.called).to.be.false
        } finally {
          rerender.restore()
          view.remove()
        }
      } finally {
        stub.restore()
      }
    })
  })
})
