import {Vec4} from "regl"
import {BaseGLGlyph, Transform} from "./base"
import {Float32Buffer, NormalizedUint8Buffer, Uint8Buffer} from "./buffer"
import {ReglWrapper} from "./regl_wrap"
import {MarkerGlyphProps, GLMarkerType} from "./types"
import {marker_type_to_size_hint} from "./webgl_utils"
import {GlyphView} from "../glyph"
import * as visuals from "core/visuals"

export type MarkerVisuals = {
  readonly line: visuals.LineVector
  readonly fill: visuals.FillVector
  readonly hatch: visuals.HatchVector
}

// Abstract base class for markers. All markers share the same GLSL, except for
// one function in the fragment shader that defines the marker geometry and is
// enabled through a #define.
export abstract class BaseMarkerGL extends BaseGLGlyph {
  private _antialias: number

  // data properties, either all or none are set.
  protected _centers?: Float32Buffer
  protected _widths?: Float32Buffer
  protected _heights?: Float32Buffer
  protected _angles?: Float32Buffer

  // used by RectGL
  protected _border_radius: Vec4 = [0.0, 0.0, 0.0, 0.0]

  // indices properties.
  protected readonly _show = new Uint8Buffer(this.regl_wrapper)
  protected _show_all: boolean

  // visual properties, either all or none are set.
  private _linewidths?: Float32Buffer
  private _line_rgba: NormalizedUint8Buffer
  private _fill_rgba: NormalizedUint8Buffer
  private _line_caps: Uint8Buffer
  private _line_joins: Uint8Buffer

  // Only needed if have hatch pattern, either all or none of the buffers are set.
  private _have_hatch: boolean
  private _hatch_patterns?: Uint8Buffer
  private _hatch_scales?: Float32Buffer
  private _hatch_weights?: Float32Buffer
  private _hatch_rgba?: NormalizedUint8Buffer

  // Avoiding use of nan or inf to represent missing data in webgl as shaders may
  // have reduced floating point precision.  So here using a large-ish negative
  // value instead.
  protected static readonly missing_point = -10000

  constructor(regl_wrapper: ReglWrapper, override readonly glyph: GlyphView) {
    super(regl_wrapper, glyph)

    this._antialias = 1.5
    this._show_all = false
  }

  abstract override draw(indices: number[], mainglyph: GlyphView, trans: Transform): void

  protected _draw_one_marker_type(marker_type: GLMarkerType, transform: Transform, main_gl_glyph: BaseMarkerGL): void {
    const props_no_hatch: MarkerGlyphProps = {
      scissor: this.regl_wrapper.scissor,
      viewport: this.regl_wrapper.viewport,
      canvas_size: [transform.width, transform.height],
      pixel_ratio: transform.pixel_ratio,
      center: main_gl_glyph._centers!,
      width: main_gl_glyph._widths!,
      height: main_gl_glyph._heights!,
      angle: main_gl_glyph._angles!,
      border_radius: main_gl_glyph._border_radius,
      size_hint: marker_type_to_size_hint(marker_type),
      nmarkers: main_gl_glyph.nvertices,
      antialias: this._antialias,
      linewidth: this._linewidths!,
      line_color: this._line_rgba,
      fill_color: this._fill_rgba,
      line_cap: this._line_caps,
      line_join: this._line_joins,
      show: this._show,
    }

    if (this._have_hatch) {
      const props_hatch = {
        ...props_no_hatch,
        hatch_pattern: this._hatch_patterns!,
        hatch_scale: this._hatch_scales!,
        hatch_weight: this._hatch_weights!,
        hatch_color: this._hatch_rgba!,
      }

      const draw = this.regl_wrapper.marker_hatch(marker_type)
      draw(props_hatch)
    } else {
      const draw = this.regl_wrapper.marker_no_hatch(marker_type)
      draw(props_no_hatch)
    }
  }

  protected abstract _get_visuals(): MarkerVisuals

  protected abstract _set_data(): void

  protected _set_visuals(): void {
    const visuals = this._get_visuals()
    const fill = visuals.fill
    const line = visuals.line

    if (this._linewidths == null) {
      // Either all or none are set.
      this._linewidths = new Float32Buffer(this.regl_wrapper)
      this._line_caps = new Uint8Buffer(this.regl_wrapper)
      this._line_joins = new Uint8Buffer(this.regl_wrapper)
      this._line_rgba = new NormalizedUint8Buffer(this.regl_wrapper)
      this._fill_rgba = new NormalizedUint8Buffer(this.regl_wrapper)
    }

    this._linewidths.set_from_prop(line.line_width)
    this._line_caps.set_from_line_cap(line.line_cap)
    this._line_joins.set_from_line_join(line.line_join)
    this._line_rgba.set_from_color(line.line_color, line.line_alpha)
    this._fill_rgba.set_from_color(fill.fill_color, fill.fill_alpha)

    this._have_hatch = visuals.hatch.doit
    if (this._have_hatch) {
      const hatch = visuals.hatch

      if (this._hatch_patterns == null) {
        // Either all or none are set.
        this._hatch_patterns = new Uint8Buffer(this.regl_wrapper)
        this._hatch_scales = new Float32Buffer(this.regl_wrapper)
        this._hatch_weights = new Float32Buffer(this.regl_wrapper)
        this._hatch_rgba = new NormalizedUint8Buffer(this.regl_wrapper)
      }

      this._hatch_patterns.set_from_hatch_pattern(hatch.hatch_pattern)
      this._hatch_scales!.set_from_prop(hatch.hatch_scale)
      this._hatch_weights!.set_from_prop(hatch.hatch_weight)
      this._hatch_rgba!.set_from_color(hatch.hatch_color, hatch.hatch_alpha)
    }
  }
}
