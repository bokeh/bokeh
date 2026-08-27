import {expect} from "#framework/assertions"

import type {GlyphRendererView} from "@bokehjs/models/renderers/glyph_renderer"
import {SelectionPolicy} from "@bokehjs/models/selections/interaction_policy"
import {Selection} from "@bokehjs/models/selections/selection"

describe("SelectionPolicy", () => {
  const geometry = {type: "point", sx: 0, sy: 0} as const
  const renderers = [
    {hit_test: () => Selection.create({indices: [0, 1]})},
    {hit_test: () => Selection.create({indices: [1, 2]})},
  ] as unknown as GlyphRendererView[]

  it("should union renderer hit-test results by default", () => {
    const result = SelectionPolicy.create().hit_test(geometry, renderers)
    expect(result?.indices).to.be.equal([0, 1, 2])
  })

  it("should intersect renderer hit-test results", () => {
    const result = SelectionPolicy.create({combine: "intersection"}).hit_test(geometry, renderers)
    expect(result?.indices).to.be.equal([1])
  })
})
