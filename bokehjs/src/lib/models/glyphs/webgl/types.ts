import {AttributeConfig, Texture2D, Vec2, Vec4} from "regl"


interface CommonProps {
  canvas_size: Vec2
  pixel_ratio: number
  antialias: number
}

interface LineProps {
  linewidth: number[] | Float32Array
  line_color: Uint8Array
  line_join: number[] | Float32Array
}

interface LinePropsNoJoin {  // Only needed until Markers support line joins.
  linewidth: number[] | Float32Array
  line_color: Uint8Array
}

interface FillProps {
  fill_color: Uint8Array
}

interface DashProps {
  length_so_far: Float32Array
  dash_tex: Texture2D
  dash_tex_info: number[]
  dash_scale: number
  dash_offset: number
}

interface HatchProps {
  hatch_pattern: number[] | Float32Array
  hatch_scale: number[] | Float32Array
  hatch_weight: number[] | Float32Array
  hatch_color: Uint8Array
}

export interface LineGlyphProps extends CommonProps {
  line_color: number[]
  linewidth: number
  miter_limit: number
  points: Float32Array
  nsegments: number
  line_cap: number
  line_join: number
}

export interface LineDashGlyphProps extends LineGlyphProps, DashProps {}

export interface MarkerGlyphProps extends CommonProps, LinePropsNoJoin, FillProps {
  center: Float32Array
  nmarkers: number
  size: number[] | Float32Array
  angle: number[] | Float32Array
  show: Uint8Array
}

export interface RectGlyphProps extends CommonProps, LineProps, FillProps {
  center: Float32Array
  nmarkers: number
  width: Float32Array
  height: Float32Array
  angle: number[] | Float32Array
  show: Uint8Array
}

export interface RectHatchGlyphProps extends RectGlyphProps, HatchProps {}


export interface CommonUniforms {
  u_canvas_size: Vec2
  u_pixel_ratio: number
  u_antialias: number
}

export interface DashUniforms {
  u_dash_tex: Texture2D
  u_dash_tex_info: Vec4
  u_dash_scale: number
  u_dash_offset: number
}

export interface LineGlyphUniforms extends CommonUniforms {
  u_line_color: Vec4
  u_linewidth: number
  u_miter_limit: number
  u_line_join: number
  u_line_cap: number
}

export interface LineDashGlyphUniforms extends LineGlyphUniforms, DashUniforms {}


interface LineAttributes {
  a_linewidth: AttributeConfig
  a_line_color: AttributeConfig
  a_line_join: AttributeConfig
}

interface LineAttributesNoJoin {  // Only needed until Markers support line joins.
  a_linewidth: AttributeConfig
  a_line_color: AttributeConfig
}

interface FillAttributes {
  a_fill_color: AttributeConfig
}

interface HatchAttributes {
  a_hatch_pattern: AttributeConfig
  a_hatch_scale: AttributeConfig
  a_hatch_weight: AttributeConfig
  a_hatch_color: AttributeConfig
}

export interface LineGlyphAttributes {
  a_position: AttributeConfig
  a_point_prev: AttributeConfig
  a_point_start: AttributeConfig
  a_point_end: AttributeConfig
  a_point_next: AttributeConfig
}

export interface LineDashGlyphAttributes extends LineGlyphAttributes {
  a_length_so_far: AttributeConfig
}

export interface MarkerGlyphAttributes extends LineAttributesNoJoin, FillAttributes {
  a_position: AttributeConfig
  a_center: AttributeConfig
  a_size: AttributeConfig
  a_angle: AttributeConfig
  a_show: AttributeConfig
}

export interface RectGlyphAttributes extends LineAttributes, FillAttributes {
  a_center: AttributeConfig
  a_show: AttributeConfig
  a_position: AttributeConfig
  a_width: AttributeConfig
  a_height: AttributeConfig
  a_angle: AttributeConfig
}

export interface RectHatchGlyphAttributes extends RectGlyphAttributes, HatchAttributes {}


export interface EmptyContext {}  // Needed for callback.
