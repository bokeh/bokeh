import {expect} from "assertions"

import {parse_delimited_string} from "@bokehjs/models/text/utils"
import {TeX, PlainText} from "@bokehjs/models/text"
import {wildcard} from "@bokehjs/core/util/eq"

describe("models/text/utils module", () => {
  it("should provide parse_delimited_string() function", () => {
    const s0 = parse_delimited_string("$$test$$")
    ;(s0 as any).id = wildcard // XXX: figure out how to deal with value equality with IDs
    expect(s0).to.be.equal(new TeX({text: "test"}))
    const s1 = parse_delimited_string("\\[test\\]")
    ;(s1 as any).id = wildcard
    expect(s1).to.be.equal(new TeX({text: "test"}))
    const s2 = parse_delimited_string("\\(test\\)")
    ;(s2 as any).id = wildcard
    expect(s2).to.be.equal(new TeX({text: "test", inline: true}))

    const s3 = parse_delimited_string("test$$")
    ;(s3 as any).id = wildcard
    expect(s3).to.be.equal(new PlainText({text: "test$$"}))
    const s4 = parse_delimited_string("$$test")
    ;(s4 as any).id = wildcard
    expect(s4).to.be.equal(new PlainText({text: "$$test"}))

    const s5 = parse_delimited_string("test\\]")
    ;(s5 as any).id = wildcard
    expect(s5).to.be.equal(new PlainText({text: "test\\]"}))
    const s6 = parse_delimited_string("\\[test")
    ;(s6 as any).id = wildcard
    expect(s6).to.be.equal(new PlainText({text: "\\[test"}))

    const s7 = parse_delimited_string("test\\)")
    ;(s7 as any).id = wildcard
    expect(s7).to.be.equal(new PlainText({text: "test\\)"}))
    const s8 = parse_delimited_string("\\(test")
    ;(s8 as any).id = wildcard
    expect(s8).to.be.equal(new PlainText({text: "\\(test"}))

    const s9 = parse_delimited_string("HTML <b>text</b> $$\\sin(x)$$ and \\[x\\cdot\\pi\\]!")
    ;(s9 as any).id = wildcard
    expect(s9).to.be.equal(new TeX({text: "\\text{HTML <b>text</b> }\\sin(x)\\text{ and }x\\cdot\\pi\\text{!}"}))
    const s10 = parse_delimited_string("HTML <b>text</b> $$sin(x)$$ and [xcdotpi]!")
    ;(s10 as any).id = wildcard
    expect(s10).to.be.equal(new TeX({text: "\\text{HTML <b>text</b> }sin(x)\\text{ and [xcdotpi]!}"}))

    const s11 = parse_delimited_string("$$test\\]")
    ;(s11 as any).id = wildcard
    expect(s11).to.be.equal(new PlainText({text: "$$test\\]"}))
    const s12 = parse_delimited_string("$$test $$ end $$")
    ;(s12 as any).id = wildcard
    expect(s12).to.be.equal(new TeX({text: "test \\text{ end $$}"}))
    const s13 = parse_delimited_string("$$ \\[test end\\]")
    ;(s13 as any).id = wildcard
    expect(s13).to.be.equal(new TeX({text: "\\text{$$ }test end"}))
    const s14 = parse_delimited_string("text \\[text $$latex$$")
    ;(s14 as any).id = wildcard
    expect(s14).to.be.equal(new TeX({text: "\\text{text \\[text }latex"}))
    const s15 = parse_delimited_string("$$ tex [ tex ] tex $$")
    ;(s15 as any).id = wildcard
    expect(s15).to.be.equal(new TeX({text: " tex [ tex ] tex "}))
    const s16 = parse_delimited_string("$$tex$$text$$tex$$")
    ;(s16 as any).id = wildcard
    expect(s16).to.be.equal(new TeX({text: "tex\\text{text}tex"}))
    const s17 = parse_delimited_string("part0$$part1\\[part2\\(part3$$")
    ;(s17 as any).id = wildcard
    expect(s17).to.be.equal(new TeX({text: "\\text{part0}part1\\[part2\\(part3"}))
    const s18 = parse_delimited_string("part0$$part1\\[part2\\(part3\\]")
    ;(s18 as any).id = wildcard
    expect(s18).to.be.equal(new TeX({text: "\\text{part0$$part1}part2\\(part3"}))
    const s19 = parse_delimited_string("part0$$part1\\[part2\\(part3\\)")
    ;(s19 as any).id = wildcard
    expect(s19).to.be.equal(new TeX({text: "\\text{part0$$part1\\[part2}part3"}))

    const s20 = parse_delimited_string("$$\ncos(x)\n$$")
    ;(s20 as any).id = wildcard
    expect(s20).to.be.equal(new TeX({text: "\ncos(x)\n"}))
    const s21 = parse_delimited_string("$$\ncos(x)$$\n")
    ;(s21 as any).id = wildcard
    expect(s21).to.be.equal(new TeX({text: "\ncos(x)\\text{\n}"}))
  })
})
