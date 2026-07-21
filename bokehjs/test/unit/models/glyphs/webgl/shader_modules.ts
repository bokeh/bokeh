import {expect} from "#framework/assertions"

import {assemble_shader} from "@bokehjs/models/glyphs/webgl/shader_modules"

describe("assemble_shader", () => {
  it("should assemble shared precision and projection modules once", () => {
    const shader = assemble_shader(`
#include <bokeh_vertex_precision>
#include <bokeh_screen_projection>
#include <bokeh_vertex_precision>
void main() { gl_Position = bokeh_screen_to_clip(vec2(0.0), vec2(1.0)); }
`)
    expect(shader.match(/precision highp float;/g)?.length).to.be.equal(1)
    expect(shader.includes("vec4 bokeh_screen_to_clip")).to.be.true
    expect(shader.includes("#include")).to.be.false
  })

  it("should reject unknown modules", () => {
    expect(() => assemble_shader("#include <not_a_module>")).to.throw()
  })

  it("should assemble the optional data mapping module", () => {
    const shader = assemble_shader(`
#define DATA_MAPPING
#include <bokeh_vertex_precision>
#include <bokeh_data_mapping>
void main() { gl_Position = vec4(bokeh_map_data(vec2(0.0)), 0.0, 1.0); }
`)
    expect(shader.includes("vec2 bokeh_map_data")).to.be.true
    expect(shader.includes("u_data_offset")).to.be.true
    expect(shader.includes("#include")).to.be.false
  })
})
