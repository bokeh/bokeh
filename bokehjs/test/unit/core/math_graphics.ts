import sinon from "sinon"
import {expect} from "assertions"

import {default_provider} from "@bokehjs/models/text/providers"
import {find_tex} from "@bokehjs/models/text/mathjax"
import {TeXBox} from "@bokehjs/core/math_graphics"

function tex2svg(text: string, options: {display: boolean}) {
  return {outerHTML: `<svg display="${options.display}">${text}</svg>`}
}

describe("MathText graphics", () => {
  describe("TeX processing", () => {
    it("resolve to simple strings when delimiters are only on end", async () => {
      const stub = sinon.stub(default_provider, "MathJax")
      stub.value({tex2svg, find_tex})

      try {
        const tex_html = new TeXBox({text: "test$$"}).to_html_string()
        expect(tex_html).to.be.equal("test$$")
      } finally {
        stub.restore()
      }
    })

    it("resolve to simple strings when delimiters are only on start", async () => {
      const stub = sinon.stub(default_provider, "MathJax")
      stub.value({tex2svg, find_tex})

      try {
        const tex_html = new TeXBox({text: "$$test"}).to_html_string()
        expect(tex_html).to.be.equal("$$test")
      } finally {
        stub.restore()
      }
    })

    it("find block tex elements with delimiters $$ and $$", async () => {
      const stub = sinon.stub(default_provider, "MathJax")
      stub.value({tex2svg, find_tex})

      try {
        const tex_html = new TeXBox({text: "$$test$$"}).to_html_string()
        expect(tex_html).to.be.equal("<svg display=\"true\">test</svg>")
      } finally {
        stub.restore()
      }
    })

    it("has text after tex delimiters", async () => {
      const stub = sinon.stub(default_provider, "MathJax")
      stub.value({tex2svg, find_tex})

      try {
        const tex_html = new TeXBox({text: "$$tex$$text"}).to_html_string()
        expect(tex_html).to.be.equal("<svg display=\"true\">tex</svg>text")
      } finally {
        stub.restore()
      }
    })

    it("has text before tex delimiters", async () => {
      const stub = sinon.stub(default_provider, "MathJax")
      stub.value({tex2svg, find_tex})

      try {
        const tex_html = new TeXBox({text: "text$$tex$$"}).to_html_string()
        expect(tex_html).to.be.equal("text<svg display=\"true\">tex</svg>")
      } finally {
        stub.restore()
      }
    })

    it("has text on new line after tex delimiters", async () => {
      const stub = sinon.stub(default_provider, "MathJax")
      stub.value({tex2svg, find_tex})

      try {
        const tex_html = new TeXBox({text: `$$tex$$
        text`}).to_html_string()
        expect(tex_html).to.be.equal(`<svg display=\"true\">tex</svg>
        text`)
      } finally {
        stub.restore()
      }
    })
  })
})
