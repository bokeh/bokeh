import {expect, expect_condition, expect_not_null} from "#framework/assertions"

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

function compile_shader(gl: WebGLRenderingContext, type: number, source: string, label: string): WebGLShader {
  const shader = gl.createShader(type)
  expect_not_null(shader)

  gl.shaderSource(shader, source)
  gl.compileShader(shader)
  expect_condition(gl.getShaderParameter(shader, gl.COMPILE_STATUS) === true,
    `${label} shader failed to compile: ${gl.getShaderInfoLog(shader) ?? "unknown error"}`)

  return shader
}

function compile_program(gl: WebGLRenderingContext, vertex_source: string, fragment_source: string, label: string): void {
  const vertex_shader = compile_shader(gl, gl.VERTEX_SHADER, vertex_source, `${label} vertex`)
  const fragment_shader = compile_shader(gl, gl.FRAGMENT_SHADER, fragment_source, `${label} fragment`)
  const program = gl.createProgram()
  expect_not_null(program)

  gl.attachShader(program, vertex_shader)
  gl.attachShader(program, fragment_shader)
  gl.linkProgram(program)
  expect_condition(gl.getProgramParameter(program, gl.LINK_STATUS) === true,
    `${label} program failed to link: ${gl.getProgramInfoLog(program) ?? "unknown error"}`)

  gl.deleteProgram(program)
  gl.deleteShader(fragment_shader)
  gl.deleteShader(vertex_shader)
}

describe("WebGL shader precision", () => {
  it("should request high precision in every vertex shader", () => {
    for (const source of vertex_sources.values()) {
      expect(source.trimStart().startsWith("precision highp float;")).to.be.true
      expect(source.includes("#include")).to.be.false
    }
  })

  it("should prefer high fragment precision with a portable fallback", () => {
    for (const source of fragment_sources.values()) {
      expect(source.includes("#ifdef GL_FRAGMENT_PRECISION_HIGH")).to.be.true
      expect(source.includes("precision highp float;")).to.be.true
      expect(source.includes("#else")).to.be.true
      expect(source.includes("precision mediump float;")).to.be.true
      expect(source.includes("#endif")).to.be.true
      expect(source.includes("#include")).to.be.false
    }
  })

  it("should compile and link every generated shader pair in WebGL", () => {
    const canvas = document.createElement("canvas")
    const gl = canvas.getContext("webgl")
    expect_not_null(gl)

    for (const [name, vertex_source] of vertex_sources) {
      const fragment_source = fragment_sources.get(name)
      expect_not_null(fragment_source)
      // Marker shaders are templates and need a concrete variant, as in regl_marker().
      const prefix = name == "marker" ? "#define USE_CIRCLE\n" : ""
      compile_program(gl, `${prefix}${vertex_source}`, `${prefix}${fragment_source}`, name)
    }
  })
})
