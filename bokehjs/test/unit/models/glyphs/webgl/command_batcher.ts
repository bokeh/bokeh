import {expect} from "#framework/assertions"

import {ReglCommandBatcher} from "@bokehjs/models/glyphs/webgl/command_batcher"

describe("ReglCommandBatcher", () => {
  it("should batch adjacent compatible commands without reordering", () => {
    const batcher = new ReglCommandBatcher()
    const a = Symbol("a")
    const b = Symbol("b")
    const draws: string[] = []
    const draw_a = (props: string | string[]) => draws.push(`a:${Array.isArray(props) ? props.join(",") : props}`)
    const draw_b = (props: string | string[]) => draws.push(`b:${Array.isArray(props) ? props.join(",") : props}`)

    batcher.submit(a, draw_a, "1")
    batcher.submit(a, draw_a, "2")
    expect(batcher.pending).to.be.equal({commands: 2, label: undefined})
    batcher.submit(b, draw_b, "3")
    batcher.submit(a, draw_a, "4")
    batcher.flush()

    expect(draws).to.be.equal(["a:1,2", "b:3", "a:4"])
    expect(batcher.stats).to.be.equal({submitted: 4, draw_calls: 3})
    expect(batcher.pending).to.be.equal({commands: 0, label: undefined})
  })

  it("should track resources referenced by the pending batch", () => {
    const batcher = new ReglCommandBatcher()
    const key = Symbol("draw")
    const first = {}
    const second = {}
    const unrelated = {}
    batcher.submit(key, () => {}, "first", undefined, [first])
    batcher.submit(key, () => {}, "second", undefined, [second])

    expect(batcher.references(first)).to.be.true
    expect(batcher.references(second)).to.be.true
    expect(batcher.references(unrelated)).to.be.false

    batcher.flush()
    expect(batcher.references(first)).to.be.false
  })
})
