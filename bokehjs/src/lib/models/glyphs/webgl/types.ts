import type {Float32Buffer, NormalizedUint8Buffer, Uint8Buffer} from "./buffer"
import type {AttributeConfig, BoundingBox, Framebuffer2D, Texture2D, Vec2, Vec4} from "regl"

import type {MarkerType} from "core/enums"
export type GLMarkerType = MarkerType | "hex_tile" | "rect" | "round_rect" | "ellipse" | "annulus" | "wedge" | "annular_wedge"

// Props are used to pass properties from GL glyph classes to ReGL functions.
export type AccumulateProps = {
  scissor: BoundingBox
  viewport: BoundingBox
  framebuffer_tex: Texture2D
}

type CommonProps = {
  scissor: BoundingBox
  viewport: BoundingBox
  canvas_size: Vec2
}

type CommonLineProps = CommonProps & {
  antialias: number
}

export type LineProps = {
  linewidth: Float32Buffer
  line_color: NormalizedUint8Buffer
  line_cap: Uint8Buffer
  line_join: Uint8Buffer
}

export type FillProps = {
  fill_color: NormalizedUint8Buffer
}

type DashProps = {
  length_so_far: Float32Buffer
  dash_tex: Texture2D
  dash_tex_info: Float32Buffer
  dash_scale: Float32Buffer
  dash_offset: Float32Buffer
}

export type HatchProps = {
  hatch_pattern: Uint8Buffer
  hatch_scale: Float32Buffer
  hatch_weight: Float32Buffer
  hatch_color: NormalizedUint8Buffer
}

export type LineGlyphProps = CommonLineProps & LineProps & {
  miter_limit: number
  points: Float32Buffer
  show: Uint8Buffer
  nsegments: number
  framebuffer: Framebuffer2D | null  // null means using WebGL drawing buffer
  point_offset: number
  line_offset: number
}

export type LineDashGlyphProps = LineGlyphProps & DashProps

export type MarkerGlyphProps = CommonLineProps & LineProps & FillProps & {
  center: Float32Buffer
  nmarkers: number
  width: Float32Buffer
  height: Float32Buffer
  angle: Float32Buffer
  aux: Float32Buffer
  border_radius: Vec4
  size_hint: number
  show: Uint8Buffer
}

export type MarkerHatchGlyphProps = MarkerGlyphProps & HatchProps

export type ImageProps = CommonProps & {
  bounds: Float32Buffer
  tex: Texture2D
  global_alpha: number
}

// Uniforms are used to pass GLSL uniform values from ReGL functions to shaders.
export type AccumulateUniforms = {
  u_framebuffer_tex: Texture2D
}

export type CommonUniforms = {
  u_canvas_size: Vec2
}

export type CommonLineUniforms = CommonUniforms & {
  u_antialias: number
}

export type DashUniforms = {
  u_dash_tex: Texture2D
}

export type LineGlyphUniforms = CommonLineUniforms & {
  u_miter_limit: number
}

export type LineDashGlyphUniforms = LineGlyphUniforms & DashUniforms

export type MarkerGlyphUniforms = CommonLineUniforms & {
  u_border_radius: Vec4
  u_size_hint: number
}

export type ImageUniforms = CommonUniforms & {
  u_tex: Texture2D
  u_global_alpha: number
}

// Attributes are used to pass GLSL attribute values from ReGL functions to shaders.
export type AccumulateAttributes = {
  a_position: AttributeConfig
}

type LineAttributes = {
  a_linewidth: AttributeConfig
  a_line_color: AttributeConfig
  a_line_cap: AttributeConfig
  a_line_join: AttributeConfig
}

type FillAttributes = {
  a_fill_color: AttributeConfig
}

export type HatchAttributes = {
  a_hatch_pattern: AttributeConfig
  a_hatch_scale: AttributeConfig
  a_hatch_weight: AttributeConfig
  a_hatch_color: AttributeConfig
}

export type LineGlyphAttributes = LineAttributes & {
  a_position: AttributeConfig
  a_point_prev: AttributeConfig
  a_point_start: AttributeConfig
  a_point_end: AttributeConfig
  a_point_next: AttributeConfig
  a_show_prev: AttributeConfig
  a_show_curr: AttributeConfig
  a_show_next: AttributeConfig
}

export type LineDashGlyphAttributes = LineGlyphAttributes & {
  a_dash_tex_info: AttributeConfig
  a_dash_scale: AttributeConfig
  a_dash_offset: AttributeConfig
  a_length_so_far: AttributeConfig
}

export type MarkerGlyphAttributes = LineAttributes & FillAttributes & {
  a_center: AttributeConfig
  a_show: AttributeConfig
  a_position: AttributeConfig
  a_width: AttributeConfig
  a_height: AttributeConfig
  a_angle: AttributeConfig
  a_aux: AttributeConfig
}

export type MarkerHatchGlyphAttributes = MarkerGlyphAttributes & HatchAttributes

export type ImageAttributes = {
  a_position: AttributeConfig
  a_bounds: AttributeConfig
}
