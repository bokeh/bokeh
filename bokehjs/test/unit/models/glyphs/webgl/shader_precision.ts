import {expect} from "#framework/assertions"

import accumulate_vertex_source from "@bokehjs/models/glyphs/webgl/accumulate.vert"
import accumulate_fragment_source from "@bokehjs/models/glyphs/webgl/accumulate.frag"
import image_vertex_source from "@bokehjs/models/glyphs/webgl/image.vert"
import image_fragment_source from "@bokehjs/models/glyphs/webgl/image.frag"
import line_vertex_source from "@bokehjs/models/glyphs/webgl/regl_line.vert"
import line_fragment_source from "@bokehjs/models/glyphs/webgl/regl_line.frag"
import marker_vertex_source from "@bokehjs/models/glyphs/webgl/marker.vert"
import marker_fragment_source from "@bokehjs/models/glyphs/webgl/marker.frag"
import polygon_vertex_source from "@bokehjs/models/glyphs/webgl/polygon.vert"
import polygon_fragment_source from "@bokehjs/models/glyphs/webgl/polygon.frag"
import {assemble_shader} from "@bokehjs/models/glyphs/webgl/shader_modules"

const vertex_sources = new Map([
  ["accumulate", accumulate_vertex_source],
  ["image", image_vertex_source],
  ["line", line_vertex_source],
  ["marker", marker_vertex_source],
  ["polygon", polygon_vertex_source],
])

const fragment_sources = new Map([
  ["accumulate", accumulate_fragment_source],
  ["image", image_fragment_source],
  ["line", line_fragment_source],
  ["marker", marker_fragment_source],
  ["polygon", polygon_fragment_source],
])

describe("WebGL shader precision", () => {
  it("should request high precision in every vertex shader", () => {
    for (const source of vertex_sources.values()) {
      const shader = assemble_shader(source)
      expect(shader.trimStart().startsWith("precision highp float;")).to.be.true
      expect(shader.includes("#include")).to.be.false
    }
  })

  it("should prefer high fragment precision with a portable fallback", () => {
    for (const source of fragment_sources.values()) {
      const shader = assemble_shader(source)
      expect(shader.includes("#ifdef GL_FRAGMENT_PRECISION_HIGH")).to.be.true
      expect(shader.includes("precision highp float;")).to.be.true
      expect(shader.includes("#else")).to.be.true
      expect(shader.includes("precision mediump float;")).to.be.true
      expect(shader.includes("#endif")).to.be.true
      expect(shader.includes("#include")).to.be.false
    }
  })
})
