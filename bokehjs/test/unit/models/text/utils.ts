import {expect} from "assertions"

import {is_tex_string} from "@bokehjs/models/text/utils"

describe("Text utils", () => {
  it("is_tex_string", async () => {
    expect(is_tex_string("$$test$$")).to.be.true
    expect(is_tex_string("\[test\]")).to.be.true
    expect(is_tex_string("\(test\)")).to.be.true
    expect(is_tex_string("HTML <b>text</b> $$\\sin(x) and \\[x\\cdot\\pi\\]!")).to.be.false
    expect(is_tex_string("\\[test\\]")).to.be.true
    expect(is_tex_string("\\(test\\)")).to.be.true
    expect(is_tex_string("test$$")).to.be.false
    expect(is_tex_string("$$test")).to.be.false
    expect(is_tex_string("HTML <b>text</b> $$sin(x)$$ and [xcdotpi]!")).to.be.false
    expect(is_tex_string("$$test\\]")).to.be.false
    expect(is_tex_string("$$test $$ end $$")).to.be.true
    expect(is_tex_string("$$ \\[test end\\]")).to.be.false
    expect(is_tex_string("text \\[text $$latex$$")).to.be.false
    expect(is_tex_string("$$ tex [ tex ] tex $$")).to.be.true
    expect(is_tex_string("$$tex$$text$$tex$$")).to.be.true
    expect(is_tex_string("part0$$part1\\[part2\\(part3$$")).to.be.false
    expect(is_tex_string("part0$$part1\\[part2\\(part3\\]")).to.be.false
    expect(is_tex_string("part0$$part1\\[part2\\(part3\\)")).to.be.false
    expect(is_tex_string(`$$
      cos(x)
    $$`)).to.be.true
    expect(is_tex_string(`$$
      cos(x)$$
    `)).to.be.false
  })
})
