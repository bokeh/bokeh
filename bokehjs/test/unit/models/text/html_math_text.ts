import sinon from "sinon"
import {expect} from "assertions"

import {default_provider} from "@bokehjs/models/text/providers"
import {find_tex} from "@bokehjs/models/text/mathjax"
import {tex2html} from "@bokehjs/models/text/html_math_text"

function tex2svg(text: string, options: {display: boolean}) {
  return {outerHTML: `<svg display="${options.display}">${text}</svg>`}
}

describe("HTMLMathText", () => {
  describe("TeX processing", () => {
    it("resolve to simple strings when delimiters are only on end", async () => {
      const stub = sinon.stub(default_provider, "MathJax")
      stub.value({tex2svg, find_tex})

      try {
        const tex_html = tex2html("test$$")
        expect(tex_html).to.be.equal("test$$")
      } finally {
        stub.restore()
      }
    })

    it("resolve to simple strings when delimiters are only on start", async () => {
      const stub = sinon.stub(default_provider, "MathJax")
      stub.value({tex2svg, find_tex})

      try {
        const tex_html = tex2html("$$test")
        expect(tex_html).to.be.equal("$$test")
      } finally {
        stub.restore()
      }
    })

    it("find block tex elements with delimiters $$ and $$", async () => {
      const stub = sinon.stub(default_provider, "MathJax")
      stub.value({tex2svg, find_tex})

      try {
        const tex_html = tex2html("$$test$$")
        expect(tex_html).to.be.equal("<svg display=\"true\">test</svg>")
      } finally {
        stub.restore()
      }
    })

    it("has text after tex delimiters", async () => {
      const stub = sinon.stub(default_provider, "MathJax")
      stub.value({tex2svg, find_tex})

      try {
        const tex_html = tex2html("$$tex$$text")
        expect(tex_html).to.be.equal("<svg display=\"true\">tex</svg>text")
      } finally {
        stub.restore()
      }
    })

    it("has text before tex delimiters", async () => {
      const stub = sinon.stub(default_provider, "MathJax")
      stub.value({tex2svg, find_tex})

      try {
        const tex_html = tex2html("text$$tex$$")
        expect(tex_html).to.be.equal("text<svg display=\"true\">tex</svg>")
      } finally {
        stub.restore()
      }
    })

    it("has text on new line after tex delimiters", async () => {
      const stub = sinon.stub(default_provider, "MathJax")
      stub.value({tex2svg, find_tex})

      try {
        const tex_html = tex2html(`$$tex$$

        text`)
        expect(tex_html).to.be.equal(`<svg display=\"true\">tex</svg>

        text`)
      } finally {
        stub.restore()
      }
    })
  })
})
