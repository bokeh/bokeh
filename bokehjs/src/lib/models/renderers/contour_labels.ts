import type {Model} from "../../model"
import {GlyphAttachment, GlyphAttachmentView} from "./glyph_attachment"
import type {PreparedAttachment} from "./glyph_attachment"
import {MultiLineView} from "../glyphs/multi_line"
import type {GlyphView} from "../glyphs/glyph"
import {path_segments, path_length, point_on_path} from "../glyphs/marked_path"
import type {PathNode, PathSegment} from "../glyphs/marked_path"
import {TextBox} from "core/graphics"
import type {Rect} from "core/util/affine"
import type {BBox} from "core/util/bbox"
import type {Context2d} from "core/util/canvas"
import {color2css} from "core/util/color"
import type {Color} from "core/types"
import {TickFormatter} from "../formatters/tick_formatter"
import {PrintfTickFormatter} from "../formatters/printf_tick_formatter"
import {isValue} from "core/vectorization"
import {isArrayable, isNumber, isString} from "core/util/types"
import * as p from "core/properties"
import {Text} from "core/property_mixins"
import * as visuals from "core/visuals"

function trace_rect(ctx: Context2d, {p0, p1, p2, p3}: Rect): void {
  ctx.moveTo(p0.x, p0.y)
  ctx.lineTo(p1.x, p1.y)
  ctx.lineTo(p2.x, p2.y)
  ctx.lineTo(p3.x, p3.y)
  ctx.closePath()
}

type PositionedLabel = {box: TextBox, background_alpha: number}

const preferred_positions = [0.18, 0.43, 0.68, 0.86]

function visible_segment({sx0, sy0, sx1, sy1}: PathSegment, {left, right, top, bottom}: BBox): [number, number] | null {
  let start = 0
  let end = 1
  for (const [from, to, low, high] of [[sx0, sx1, left, right], [sy0, sy1, top, bottom]]) {
    const span = to - from
    if (span == 0) {
      if (from < low || from > high) {
        return null
      }
    } else {
      const a = (low - from)/span
      const b = (high - from)/span
      start = Math.max(start, Math.min(a, b))
      end = Math.min(end, Math.max(a, b))
      if (start >= end) {
        return null
      }
    }
  }
  return [start, end]
}

function visible_midpoint(segments: PathSegment[], frame: BBox): PathNode | null {
  let distance = 0
  let span_start = 0
  let continues = false
  let longest = 0
  let midpoint: number | null = null
  for (const segment of segments) {
    const interval = visible_segment(segment, frame)
    if (interval == null) {
      continues = false
    } else {
      const [start, end] = interval
      if (!continues || segment.move || start != 0) {
        span_start = distance + start*segment.length
      }
      const visible_length = distance + end*segment.length - span_start
      if (visible_length > longest) {
        longest = visible_length
        midpoint = span_start + visible_length/2
      }
      continues = end == 1
    }
    distance += segment.length
  }
  return midpoint != null ? point_on_path(segments, midpoint) : null
}

export class ContourLabelsView extends GlyphAttachmentView {
  declare model: ContourLabels

  private _text_visual: visuals.Text

  override connect_signals(): void {
    super.connect_signals()
    this._text_visual = new visuals.Text(this)
    this._text_visual.update()
    this.on_transitive_change(this.model.properties.formatter, () => this.request_paint(), {recursive: true})
    this.mark_finished()
  }

  private _automatic_position(segments: PathSegment[], length: number, row: number, labels: PositionedLabel[]): PathNode | null {
    const frame = this.parent.plot_view.frame.bbox
    const preferred = preferred_positions[row % preferred_positions.length]
    let best: PathNode | null = null
    let best_score = Infinity

    for (let k = 6; k <= 94; k += 2) {
      const fraction = k/100
      const node = point_on_path(segments, fraction*length)
      const {sx, sy, angle} = node
      if (!frame.contains(sx, sy)) {
        continue
      }
      const edge = Math.min(sx - frame.left, frame.right - sx, sy - frame.top, frame.bottom - sy)
      let separation = 40
      for (const {box: {position}} of labels) {
        separation = Math.min(separation, Math.hypot(sx - position.sx, sy - position.sy))
      }
      const score = 0.6*Math.abs(Math.sin(angle)) + 0.1*Math.abs(fraction - preferred)
        + Math.max(0, 40 - separation)/10 + Math.max(0, 12 - edge)/5
      if (score < best_score) {
        best = node
        best_score = score
      }
    }
    // A zoomed view may fit between all the candidates on the full path.
    return best ?? visible_midpoint(segments, frame)
  }

  prepare(glyph: GlyphView, indices: Int32Array): PreparedAttachment | null {
    const {model} = this
    if (!model.visible || !(glyph instanceof MultiLineView) || !glyph.visuals.line.doit || indices.length == 0) {
      return null
    }

    const {data_source, view} = this.parent.model
    const auto_text = isValue(model.text) && model.text.value == null && model.text.transform == null
    const levels = auto_text ? data_source.get_field("levels") : null
    const text = auto_text ? null : model.properties.text.uniform(data_source)
    const formatted_levels = new Map<number, string>()
    if (levels != null) {
      const rows: number[] = []
      const finite_levels: number[] = []
      for (let row = 0; row < levels.length; row++) {
        const level = levels[row]
        if (isNumber(level) && Number.isFinite(level)) {
          rows.push(row)
          finite_levels.push(level)
        }
      }
      if (finite_levels.length != 0) {
        const formatted = model.formatter.v_compute(finite_levels)
        for (const [i, row] of rows.entries()) {
          formatted_levels.set(row, formatted[i])
        }
      }
    }
    const {positions, inline_gap, gap_padding, background_fill_color, background_fill_alpha} = model
    const fractions = isString(positions) ? data_source.get_field(positions) : null
    const style = this._text_visual
    if (!style.doit) {
      return null
    }
    const values = style.values()
    const labels: PositionedLabel[] = []

    for (const i of indices) {
      const row = view.indices_array[i]
      const {alpha, color, width} = glyph.visuals.line.values(i)
      if (alpha == 0 || color == null || width == 0) {
        continue
      }
      const label = text != null ? text.get(row) : formatted_levels.get(row)
      if (label == null || label == "") {
        continue
      }
      const segments = path_segments(glyph.sxs.get(i), glyph.sys.get(i))
      if (segments.length == 0) {
        continue
      }
      const length = path_length(segments)
      const nodes = (() => {
        if (positions == null) {
          const node = this._automatic_position(segments, length, row, labels)
          return node != null ? [node] : []
        }
        const path_positions = isString(positions) ? fractions?.[row] : positions
        return isArrayable(path_positions) ? Array.from(path_positions).flatMap((fraction) =>
          isNumber(fraction) && fraction >= 0 && fraction <= 1 ? [point_on_path(segments, fraction*length)] : []) : []
      })()
      for (const {sx, sy, angle} of nodes) {
        const box = new TextBox({text: label})
        box.position = {sx, sy}
        box.angle = angle > Math.PI/2 ? angle - Math.PI : angle < -Math.PI/2 ? angle + Math.PI : angle
        box.visuals = {...values, alpha: values.alpha*alpha}
        labels.push({box, background_alpha: background_fill_alpha*alpha})
      }
    }

    if (labels.length == 0) {
      return null
    }

    return {
      clip(ctx) {
        if (inline_gap && ctx.layer.backend != "svg") {
          // Intersect inverse clips so overlapping labels don't reopen a gap.
          for (const {box} of labels) {
            ctx.beginPath()
            ctx.rect_bbox(ctx.layer.bbox)
            trace_rect(ctx, box.rect(gap_padding))
            ctx.clip("evenodd")
          }
        }
      },
      paint(ctx) {
        for (const {box, background_alpha} of labels) {
          if (background_fill_color != null && background_alpha != 0) {
            ctx.beginPath()
            trace_rect(ctx, box.rect(1))
            ctx.fillStyle = color2css(background_fill_color, background_alpha)
            ctx.fill()
          }
          box.paint(ctx)
        }
      },
    }
  }
}

export namespace ContourLabels {
  export type Attrs = p.AttrsOf<Props>
  export type Props = Model.Props & Text & {
    text: p.NullStringSpec
    formatter: p.Property<TickFormatter>
    positions: p.Property<number[] | string | null>
    visible: p.Property<boolean>
    inline_gap: p.Property<boolean>
    gap_padding: p.Property<number>
    background_fill_color: p.Property<Color | null>
    background_fill_alpha: p.Property<number>
  }
}

export interface ContourLabels extends ContourLabels.Attrs {}

export class ContourLabels extends GlyphAttachment {
  declare properties: ContourLabels.Props
  declare __view_type__: ContourLabelsView

  static {
    this.prototype.default_view = ContourLabelsView
    this.mixins<ContourLabels.Props>(Text)
    this.define<ContourLabels.Props>(({List, Percent, Str, Nullable, Or, Bool, NonNegative, Float, Color, Ref}) => ({
      text:                  [ p.NullStringSpec, null ],
      formatter:             [ Ref(TickFormatter), () => PrintfTickFormatter.create({format: "%.3g"}) ],
      positions:             [ Nullable(Or(List(Percent), Str)), null ],
      visible:               [ Bool, true ],
      inline_gap:            [ Bool, false ],
      gap_padding:           [ NonNegative(Float), 2 ],
      background_fill_color: [ Nullable(Color), null ],
      background_fill_alpha: [ Percent, 1 ],
    }))
    this.override<ContourLabels.Props>({
      text_font_size: "9pt",
      text_align: "center",
      text_baseline: "middle",
    })
  }
}
