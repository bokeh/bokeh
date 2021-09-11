import {expect} from "assertions"

import {TeX} from "@bokehjs/models/text/math_text"
import {PlainText} from "@bokehjs/models/text/plain_text"
import {find_math_parts, contains_tex_string} from "@bokehjs/models/text/utils"

describe("text utils", () => {
  describe("find_math_parts find tex elements on strings", () => {
    function isTeX(text_model: PlainText): text_model is TeX {
      return text_model instanceof TeX
    }
    function isPlainText(text_model: PlainText) {
      return !(text_model instanceof TeX)
    }

    it("resolve to textbox when delimiters are only on end", () => {
      const parts = find_math_parts("test$$")
      expect(parts.length).to.be.equal(1)
      expect(isPlainText(parts[0])).to.be.true
      expect(parts[0].text).to.be.equal("test$$")
    })
    it("resolve to textbox when delimiters are only on start", () => {
      const parts = find_math_parts("$$test")
      expect(parts.length).to.be.equal(1)
      expect(isPlainText(parts[0])).to.be.true
      expect(parts[0].text).to.be.equal("$$test")
    })
    it("find block tex elements with delimiters $$ and $$", () => {
      const parts = find_math_parts("$$test$$")
      expect(parts.length).to.be.equal(1)
      expect(isTeX(parts[0]))
      expect(isTeX(parts[0]) && !parts[0].inline)
      expect(parts[0].text).to.be.equal("test")
    })
    it("find block tex elements with delimiters \\[ and \\]", () => {
      const parts = find_math_parts("\\[test\\]")
      expect(parts.length).to.be.equal(1)
      expect(isTeX(parts[0]))
      expect(isTeX(parts[0]) && !parts[0].inline)
      expect(parts[0].text).to.be.equal("test")
    })
    it("find inline tex elements with delimiters \\( and \\)", () => {
      const parts = find_math_parts("\\(test\\)")
      expect(parts.length).to.be.equal(1)
      expect(isTeX(parts[0]))
      expect(isTeX(parts[0]) && parts[0].inline)
    })
    it("starts with one delimiter and with other", () => {
      const parts = find_math_parts("$$test\\]")
      expect(parts.length).to.be.equal(1)
      expect(isPlainText(parts[0]))
      expect(parts[0].text).to.be.equal("$$test\\]")
    })
    it("starts with open delimiter and has an pair later", () => {
      const parts = find_math_parts("$$test $$ end $$")
      expect(parts.length).to.be.equal(2)
      expect(isTeX(parts[0]))
      expect((parts[0] as TeX).inline).to.be.false
      expect(isPlainText(parts[1]))
      expect(parts[0].text).to.be.equal("test ")
      expect(parts[1].text).to.be.equal(" end $$")
    })
    it("starts with open delimiter and has an different pair later", () => {
      const parts = find_math_parts("\\[test $$end$$")
      expect(parts.length)
      expect(parts.length).to.be.equal(2)
      expect(isPlainText(parts[0]))
      expect(isTeX(parts[1]))
      expect((parts[1] as TeX).inline).to.be.false
      expect(parts[0].text).to.be.equal("\\[test ")
      expect(parts[1].text).to.be.equal("end")
    })
    it("starts with text then open delimiter and has an different pair later", () => {
      const parts = find_math_parts("text \\[text $$latex$$")
      expect(parts.length)
      expect(parts.length).to.be.equal(2)
      expect(isPlainText(parts[0]))
      expect(isTeX(parts[1]))
      expect((parts[1] as TeX).inline).to.be.false
      expect(parts[0].text).to.be.equal("text \\[text ")
      expect(parts[1].text).to.be.equal("latex")
    })
    it("ignore nested different delimiters", () => {
      const parts = find_math_parts("$$ tex [ tex ] tex $$")
      expect(parts.length)
      expect(parts.length).to.be.equal(1)
      expect(isTeX(parts[0]))
      expect((parts[0] as TeX).inline).to.be.false
      expect(parts[0].text).to.be.equal(" tex [ tex ] tex ")
    })
    it("ends on first end delimiter even if there is more after", () => {
      const parts = find_math_parts("$$tex$$text$$tex$$")
      expect(parts.length)
      expect(parts.length).to.be.equal(3)
      expect(isTeX(parts[0]))
      expect((parts[0] as TeX).inline).to.be.false
      expect(isPlainText(parts[1]))
      expect(isTeX(parts[2]))
      expect((parts[2] as TeX).inline).to.be.false
      expect(parts[0].text).to.be.equal("tex")
      expect(parts[1].text).to.be.equal("text")
      expect(parts[2].text).to.be.equal("tex")
    })
    it("multiple pairs", () => {
      const parts = find_math_parts(
        "When \\(a \\ne 0\\), there are two solutions to \\(ax^2 + bx + c = 0\\) and they are $$x = {-b \\pm \\sqrt{b^2-4ac} \\over 2a}.$$"
      )
      expect(parts.length)
      expect(parts.length).to.be.equal(6)
      expect(isPlainText(parts[0]))
      expect(isTeX(parts[1]))
      expect((parts[1] as TeX).inline).to.be.true
      expect(isPlainText(parts[2]))
      expect(isTeX(parts[3]))
      expect((parts[3] as TeX).inline).to.be.true
      expect(isPlainText(parts[4]))
      expect(isTeX(parts[5]))
      expect((parts[5] as TeX).inline).to.be.false
      expect(parts[0].text).to.be.equal("When ")
      expect(parts[1].text).to.be.equal("a \\ne 0")
      expect(parts[2].text).to.be.equal(", there are two solutions to ")
      expect(parts[3].text).to.be.equal("ax^2 + bx + c = 0")
      expect(parts[4].text).to.be.equal(" and they are ")
      expect(parts[5].text).to.be.equal(
        "x = {-b \\pm \\sqrt{b^2-4ac} \\over 2a}."
      )
    })
    it("have many open delimiter but only first closes", () => {
      const parts = find_math_parts("part0$$part1\\[part2\\(part3$$")
      expect(parts.length)
      expect(parts.length).to.be.equal(2)
      expect(isPlainText(parts[0]))
      expect(isTeX(parts[1]))
      expect((parts[1] as TeX).inline).to.be.false
      expect(parts[0].text).to.be.equal("part0")
      expect(parts[1].text).to.be.equal("part1\\[part2\\(part3")
    })
    it("have many open delimiter but only middle closes", () => {
      const parts = find_math_parts("part0$$part1\\[part2\\(part3\\]")
      expect(parts.length)
      expect(parts.length).to.be.equal(2)
      expect(isPlainText(parts[0]))
      expect(isTeX(parts[1]))
      expect((parts[1] as TeX).inline).to.be.false
      expect(parts[0].text).to.be.equal("part0$$part1")
      expect(parts[1].text).to.be.equal("part2\\(part3")
    })
    it("have many open delimiter but only last closes", () => {
      const parts = find_math_parts("part0$$part1\\[part2\\(part3\\)")
      expect(parts.length)
      expect(parts.length).to.be.equal(2)
      expect(isPlainText(parts[0]))
      expect(isTeX(parts[1]))
      expect((parts[1] as TeX).inline).to.be.true
      expect(parts[0].text).to.be.equal("part0$$part1\\[part2")
      expect(parts[1].text).to.be.equal("part3")
    })
  })

  describe("contains_tex_string", () => {
    it("resolve to textbox when delimiters are only on end", () => {
      const result = contains_tex_string("test$$")
      expect(result).to.be.false
    })
    it("resolve to textbox when delimiters are only on start", () => {
      const result = contains_tex_string("$$test")
      expect(result).to.be.false
    })
    it("find block tex elements with delimiters $$ and $$", () => {
      const result = contains_tex_string("$$test$$")
      expect(result).to.be.true
    })
    it("find block tex elements with delimiters \\[ and \\]", () => {
      const result = contains_tex_string("\\[test\\]")
      expect(result).to.be.true
    })
    it("find inline tex elements with delimiters \\( and \\)", () => {
      const result = contains_tex_string("\\(test\\)")
      expect(result).to.be.true
    })
    it("starts with one delimiter and with other", () => {
      const result = contains_tex_string("$$test\\]")
      expect(result).to.be.false
    })
    it("starts with open delimiter and has an pair later", () => {
      const result = contains_tex_string("$$test $$ end $$")
      expect(result).to.be.true
    })
    it("starts with open delimiter and has an different pair later", () => {
      const result = contains_tex_string("\\[test $$end$$")
      expect(result).to.be.true
    })
    it("starts with text then open delimiter and has an different pair later", () => {
      const result = contains_tex_string("text \\[text $$latex$$")
      expect(result).to.be.true
    })
    it("ignore nested different delimiters", () => {
      const result = contains_tex_string("$$ tex [ tex ] tex $$")
      expect(result).to.be.true
    })
    it("ends on first end delimiter even if there is more after", () => {
      const result = contains_tex_string("$$tex$$text$$tex$$")
      expect(result).to.be.true
    })
    it("have many open delimiter but only first closes", () => {
      const result = contains_tex_string("part0$$part1\\[part2\\(part3$$")
      expect(result).to.be.true
    })
    it("have many open delimiter but only middle closes", () => {
      const result = contains_tex_string("part0$$part1\\[part2\\(part3\\]")
      expect(result).to.be.true
    })
    it("have many open delimiter but only last closes", () => {
      const result = contains_tex_string("part0$$part1\\[part2\\(part3\\)")
      expect(result).to.be.true
    })

    it("multiple pairs", () => {
      const result =  contains_tex_string(
        "When \\(a \\ne 0\\), there are two solutions to \\(ax^2 + bx + c = 0\\) and they are $$x = {-b \\pm \\sqrt{b^2-4ac} \\over 2a}.$$"
      )
      expect(result).to.be.true
    })
  })
})
