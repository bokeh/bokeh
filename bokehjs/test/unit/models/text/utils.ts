import {expect} from "assertions"

import {parse_delimited_string} from "@bokehjs/models/text/utils"
import {TeX, PlainText} from "@bokehjs/models/text"

describe("models/text/utils module", () => {
  it("should provide parse_delimited_string() function", () => {
    const s0 = parse_delimited_string("$$test$$")
    expect(s0).to.be.equal(new TeX({text: "test"}))
    const s1 = parse_delimited_string("\\[test\\]")
    expect(s1).to.be.equal(new TeX({text: "test"}))
    const s2 = parse_delimited_string("\\(test\\)")
    expect(s2).to.be.equal(new TeX({text: "test", inline: true}))

    const s3 = parse_delimited_string("test$$")
    expect(s3).to.be.equal(new PlainText({text: "test$$"}))
    const s4 = parse_delimited_string("$$test")
    expect(s4).to.be.equal(new PlainText({text: "$$test"}))

    const s5 = parse_delimited_string("test\\]")
    expect(s5).to.be.equal(new PlainText({text: "test\\]"}))
    const s6 = parse_delimited_string("\\[test")
    expect(s6).to.be.equal(new PlainText({text: "\\[test"}))

    const s7 = parse_delimited_string("test\\)")
    expect(s7).to.be.equal(new PlainText({text: "test\\)"}))
    const s8 = parse_delimited_string("\\(test")
    expect(s8).to.be.equal(new PlainText({text: "\\(test"}))

    const s9 = parse_delimited_string("HTML <b>text</b> $$\\sin(x) and \\[x\\cdot\\pi\\]!")
    expect(s9).to.be.equal(new PlainText({text: "HTML <b>text</b> $$\\sin(x) and \\[x\\cdot\\pi\\]!"}))
    const s10 = parse_delimited_string("HTML <b>text</b> $$sin(x)$$ and [xcdotpi]!")
    expect(s10).to.be.equal(new PlainText({text: "HTML <b>text</b> $$sin(x)$$ and [xcdotpi]!"}))

    const s11 = parse_delimited_string("$$test\\]")
    expect(s11).to.be.equal(new PlainText({text: "$$test\\]"}))
    const s12 = parse_delimited_string("$$test $$ end $$")
    expect(s12).to.be.equal(new TeX({text: "$$test $$ end $$"}))
    const s13 = parse_delimited_string("$$ \\[test end\\]")
    expect(s13).to.be.equal(new PlainText({text: "$$ \\[test end\\]"}))
    const s14 = parse_delimited_string("text \\[text $$latex$$")
    expect(s14).to.be.equal(new PlainText({text: "text \\[text $$latex$$"}))
    const s15 = parse_delimited_string("$$ tex [ tex ] tex $$")
    expect(s15).to.be.equal(new TeX({text: " tex [ tex ] tex "}))
    const s16 = parse_delimited_string("$$tex$$text$$tex$$")
    expect(s16).to.be.equal(new TeX({text: "$$tex$$text$$tex$$"}))
    const s17 = parse_delimited_string("part0$$part1\\[part2\\(part3$$")
    expect(s17).to.be.equal(new PlainText({text: "part0$$part1\\[part2\\(part3$$"}))
    const s18 = parse_delimited_string("part0$$part1\\[part2\\(part3\\]")
    expect(s18).to.be.equal(new PlainText({text: "part0$$part1\\[part2\\(part3\\]"}))
    const s19 = parse_delimited_string("part0$$part1\\[part2\\(part3\\)")
    expect(s19).to.be.equal(new PlainText({text: "part0$$part1\\[part2\\(part3\\)"}))

    const s20 = parse_delimited_string("$$\ncos(x)\n$$")
    expect(s20).to.be.equal(new TeX({text: "\ncos(x)\n"}))
    const s21 = parse_delimited_string("$$\ncos(x)$$\n")
    expect(s21).to.be.equal(new PlainText({text: "$$\ncos(x)$$\n"}))
  })
})
