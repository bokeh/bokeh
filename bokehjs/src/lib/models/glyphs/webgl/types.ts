import {Float32Buffer, NormalizedUint8Buffer, Uint8Buffer} from "./buffer"
import {AttributeConfig, BoundingBox, Texture2D, Vec2, Vec4} from "regl"

import {MarkerType} from "core/enums"
export type GLMarkerType = MarkerType | "ellipse" | "annulus"

// Props are used to pass properties from GL glyph classes to ReGL functions.
type CommonProps = {
  scissor: BoundingBox
  viewport: BoundingBox
  canvas_size: Vec2
  pixel_ratio: number
  antialias: number
}

type LineProps = {
  linewidth: Float32Buffer
  line_color: NormalizedUint8Buffer
  line_cap: Uint8Buffer
  line_join: Uint8Buffer
}

type FillProps = {
  fill_color: NormalizedUint8Buffer
}

type DashProps = {
  length_so_far: Float32Buffer
  dash_tex: Texture2D
  dash_tex_info: number[]
  dash_scale: number
  dash_offset: number
}

type HatchProps = {
  hatch_pattern: Uint8Buffer
  hatch_scale: Float32Buffer
  hatch_weight: Float32Buffer
  hatch_color: NormalizedUint8Buffer
}

export type LineGlyphProps = CommonProps & {
  line_color: number[]
  linewidth: number
  miter_limit: number
  points: Float32Buffer
  show: Uint8Buffer
  nsegments: number
  line_cap: number
  line_join: number
}

export type LineDashGlyphProps = LineGlyphProps & DashProps

export type MarkerGlyphProps = CommonProps & LineProps & FillProps & {
  center: Float32Buffer
  nmarkers: number
  width: Float32Buffer
  height: Float32Buffer
  angle: Float32Buffer
  border_radius: Vec4
  size_hint: number
  show: Uint8Buffer
}

export type MarkerHatchGlyphProps = MarkerGlyphProps & HatchProps

// Uniforms are used to pass GLSL uniform values from ReGL functions to shaders.
export type CommonUniforms = {
  u_canvas_size: Vec2
  u_pixel_ratio: number
  u_antialias: number
}

export type DashUniforms = {
  u_dash_tex: Texture2D
  u_dash_tex_info: Vec4
  u_dash_scale: number
  u_dash_offset: number
}

export type LineGlyphUniforms = CommonUniforms & {
  u_line_color: Vec4
  u_linewidth: number
  u_miter_limit: number
  u_line_join: number
  u_line_cap: number
}

export type LineDashGlyphUniforms = LineGlyphUniforms & DashUniforms

export type MarkerGlyphUniforms = CommonUniforms & {
  u_border_radius: Vec4
  u_size_hint: number
}

// Attributes are used to pass GLSL attribute values from ReGL functions to shaders.
type LineAttributes = {
  a_linewidth: AttributeConfig
  a_line_color: AttributeConfig
  a_line_cap: AttributeConfig
  a_line_join: AttributeConfig
}

type FillAttributes = {
  a_fill_color: AttributeConfig
}

type HatchAttributes = {
  a_hatch_pattern: AttributeConfig
  a_hatch_scale: AttributeConfig
  a_hatch_weight: AttributeConfig
  a_hatch_color: AttributeConfig
}

export type LineGlyphAttributes = {
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
  a_length_so_far: AttributeConfig
}

export type MarkerGlyphAttributes = LineAttributes & FillAttributes & {
  a_center: AttributeConfig
  a_show: AttributeConfig
  a_position: AttributeConfig
  a_width: AttributeConfig
  a_height: AttributeConfig
  a_angle: AttributeConfig
}

export type MarkerHatchGlyphAttributes = MarkerGlyphAttributes & HatchAttributes
