import sinon from "sinon"
import {expect} from "assertions"

import {Div} from "@bokehjs/models/widgets/div"
import {MathJaxProvider} from "@bokehjs/models/text/providers"
import {find_tex} from "@bokehjs/models/text/mathjax"
import {build_view} from "@bokehjs/core/build_views"
import {WidgetView} from "@bokehjs/models/widgets/widget"

function tex2svg(text: string, options: {display: boolean}) {
  return {outerHTML: `<svg display="${options.display}">${text}</svg>`}
}

class InternalProvider extends MathJaxProvider {
  get MathJax() {
    return this.status == "loaded" ? {tex2svg, find_tex} : null
  }
  async fetch() {
    this.status = "loaded"
  }
}

describe("MarkupView", () => {
  describe("MarkupView TeX processing", () => {
    it("resolve to simple strings when delimiters are only on end", async () => {
      const stub = sinon.stub(WidgetView.prototype, "provider")
      stub.value(new InternalProvider())
      try {
        const div = new Div({text: "test$$"})
        const div_view = (await build_view(div))
        const processed_div = div_view.process_tex(div.text)
        expect(processed_div).to.be.equal("test$$")
      } finally {
        stub.restore()
      }
    })

    it("resolve to simple strings when delimiters are only on start", async () => {
      const stub = sinon.stub(WidgetView.prototype, "provider")
      stub.value(new InternalProvider())
      try {
        const div = new Div({text: "$$test"})
        const div_view = (await build_view(div))
        const processed_div = div_view.process_tex(div.text)
        expect(processed_div).to.be.equal("$$test")
      } finally {
        stub.restore()
      }
    })

    it("find block tex elements with delimiters $$ and $$", async () => {
      const stub = sinon.stub(WidgetView.prototype, "provider")
      stub.value(new InternalProvider())
      try {
        const div = new Div({text: "$$test$$"})
        const div_view = (await build_view(div))
        const processed_div = div_view.process_tex(div.text)
        expect(processed_div).to.be.equal("<svg display=\"true\">test</svg>")
      } finally {
        stub.restore()
      }
    })

    it("has text after tex delimiters", async () => {
      const stub = sinon.stub(WidgetView.prototype, "provider")
      stub.value(new InternalProvider())
      try {
        const div = new Div({text: "$$tex$$text"})
        const div_view = (await build_view(div))
        const processed_div = div_view.process_tex(div.text)
        expect(processed_div).to.be.equal("<svg display=\"true\">tex</svg>text")
      } finally {
        stub.restore()
      }
    })

    it("has text before tex delimiters", async () => {
      const stub = sinon.stub(WidgetView.prototype, "provider")
      stub.value(new InternalProvider())
      try {
        const div = new Div({text: "text$$tex$$"})
        const div_view = (await build_view(div))
        const processed_div = div_view.process_tex(div.text)
        expect(processed_div).to.be.equal("text<svg display=\"true\">tex</svg>")
      } finally {
        stub.restore()
      }
    })

    it("has text on new line after tex delimiters", async () => {
      const stub = sinon.stub(WidgetView.prototype, "provider")
      stub.value(new InternalProvider())
      try {
        const div = new Div({text: `$$tex$$

        text`})
        const div_view = (await build_view(div))
        const processed_div = div_view.process_tex(div.text)
        expect(processed_div).to.be.equal(`<svg display=\"true\">tex</svg>

        text`)
      } finally {
        stub.restore()
      }
    })
  })
})
