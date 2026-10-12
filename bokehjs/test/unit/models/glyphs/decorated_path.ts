import {expect} from "#framework/assertions"
import {cubic_path, path_length, path_segments, trim_path} from "@bokehjs/models/glyphs/decorated_path"

describe("decorated path geometry", () => {
  it("should preserve NaN gaps and original segment indices while trimming", () => {
    const segments = path_segments([0, 10, NaN, 20, 30], [0, 0, NaN, 0, 0])
    const visible = trim_path(segments, 3, 4)
    expect(visible.map(s => [s.index, s.sx0, s.sx1, s.move])).to.be.equal([[0, 3, 10, true], [3, 20, 26, true]])
  })

  it("should adaptively flatten curved and collinear reversing cubics", () => {
    const curve = cubic_path(0, 0, 0, 100, 100, 100, 100, 0)
    expect(curve.length > 8).to.be.true
    expect(curve[0].sx0).to.be.equal(0)
    expect(curve[curve.length - 1].sx1).to.be.equal(100)
    expect(Math.abs(path_length(curve) - 200) < 0.3).to.be.true
    const reversing = cubic_path(0, 0, 100, 0, -100, 0, 10, 0)
    expect(path_length(reversing) > 100).to.be.true
    expect(cubic_path(NaN, 0, 0, 0, 0, 0, 10, 0)).to.be.equal([])
  })
})
