import {expect} from "assertions"
import {TeX} from "@bokehjs/models"

describe("TeX", () => {
  it("should divide mathstring into tex/plaintext parts", async () => {
    expect((TeX.find_math_parts("\\(a \\ne 0\\)")[0] as TeX).inline).to.be.equal(true)
    expect((TeX.find_math_parts("$$a \\ne 0$$")[0] as TeX).inline).to.be.equal(false)
    expect((TeX.find_math_parts("\\[a \\ne 0\\]")[0] as TeX).inline).to.be.equal(false)

    const mathjax_example = "When \\(a \\ne 0\\), there are two solutions to \\(ax^2 + bx + c = 0\\) and they are $$x = {-b \\pm \\sqrt{b^2-4ac} \\over 2a}.$$ currently"

    expect(TeX.find_math_parts(mathjax_example).length).to.be.equal(7)
    expect(TeX.find_math_parts(mathjax_example).map(el => el.text)).to.be.equal([
      "When ",
      "a \\ne 0",
      ", there are two solutions to ",
      "ax^2 + bx + c = 0",
      " and they are ",
      "x = {-b \\pm \\sqrt{b^2-4ac} \\over 2a}.",
      " currently",
    ])
  })
})
