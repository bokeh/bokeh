import {Annotation, AnnotationView} from "./annotation"
import {LegendItem} from "./legend_item"
import {GlyphRendererView} from "../renderers/glyph_renderer"
import {Color} from "core/types"
import {Line, Fill, Text} from "core/visuals"
import {FontStyle, TextAlign, TextBaseline, LineJoin, LineCap} from "core/enums"
import {Orientation, LegendLocation, LegendClickPolicy} from "core/enums"
import * as p from "core/properties"
import {Signal0} from "core/signaling"
import {get_text_height} from "core/util/text"
import {BBox} from "core/util/bbox"
import {max, all} from "core/util/array"
import {values} from "core/util/object"
import {isString, isArray} from "core/util/types"
import {Context2d} from "core/util/canvas"

export type LegendBBox = {x: number, y: number, width: number, height: number}

export class LegendView extends AnnotationView {
  model: Legend
  visuals: Legend.Visuals

  protected max_label_height: number
  protected text_widths: {[key: string]: number}

  cursor(_sx: number, _sy: number): string | null {
    return this.model.click_policy == "none" ? null : "pointer"
  }

  get legend_padding(): number {
    return this.visuals.border_line.line_color.value() != null ? this.model.padding : 0
  }

  connect_signals(): void {
    super.connect_signals()
    this.connect(this.model.change, () => this.plot_view.request_render())
    this.connect(this.model.item_change, () => this.plot_view.request_render())
  }

  compute_legend_bbox(): LegendBBox {
    const legend_names = this.model.get_legend_names()

    const {glyph_height, glyph_width} = this.model
    const {label_height, label_width} = this.model

    this.max_label_height = max(
      [get_text_height(this.visuals.label_text.font_value()).height, label_height, glyph_height],
    )

    // this is to measure text properties
    const { ctx } = this.plot_view.canvas_view
    ctx.save()
    this.visuals.label_text.set_value(ctx)
    this.text_widths = {}
    for (const name of legend_names) {
      this.text_widths[name] = max([ctx.measureText(name).width, label_width])
    }
    ctx.restore()

    const max_label_width = Math.max(max(values(this.text_widths)), 0)

    const legend_margin = this.model.margin
    const {legend_padding} = this
    const legend_spacing = this.model.spacing
    const {label_standoff} =  this.model

    let legend_height: number, legend_width: number
    if (this.model.orientation == "vertical") {
      legend_height = legend_names.length*this.max_label_height + Math.max(legend_names.length - 1, 0)*legend_spacing + 2*legend_padding
      legend_width = max_label_width + glyph_width + label_standoff + 2*legend_padding
    } else {
      legend_width = 2*legend_padding + Math.max(legend_names.length - 1, 0)*legend_spacing
      for (const name in this.text_widths) {
        const width = this.text_widths[name]
        legend_width += max([width, label_width]) + glyph_width + label_standoff
      }
      legend_height = this.max_label_height + 2*legend_padding
    }

    const panel = this.model.panel != null ? this.model.panel : this.plot_view.frame
    const [hr, vr] = panel.bbox.ranges

    const {location} = this.model
    let sx: number, sy: number
    if (isString(location)) {
      switch (location) {
        case 'top_left':
          sx = hr.start + legend_margin
          sy = vr.start + legend_margin
          break
        case 'top_center':
          sx = (hr.end + hr.start)/2 - legend_width/2
          sy = vr.start + legend_margin
          break
        case 'top_right':
          sx = hr.end - legend_margin - legend_width
          sy = vr.start + legend_margin
          break
        case 'bottom_right':
          sx = hr.end - legend_margin - legend_width
          sy = vr.end - legend_margin - legend_height
          break
        case 'bottom_center':
          sx = (hr.end + hr.start)/2 - legend_width/2
          sy = vr.end - legend_margin - legend_height
          break
        case 'bottom_left':
          sx = hr.start + legend_margin
          sy = vr.end - legend_margin - legend_height
          break
        case 'center_left':
          sx = hr.start + legend_margin
          sy = (vr.end + vr.start)/2 - legend_height/2
          break
        case 'center':
          sx = (hr.end + hr.start)/2 - legend_width/2
          sy = (vr.end + vr.start)/2 - legend_height/2
          break
        case 'center_right':
          sx = hr.end - legend_margin - legend_width
          sy = (vr.end + vr.start)/2 - legend_height/2
          break
        default:
          throw new Error("unreachable code")
      }
    } else if (isArray(location) && location.length == 2) {
      const [vx, vy] = location
      sx = panel.xview.compute(vx)
      sy = panel.yview.compute(vy) - legend_height
    } else
      throw new Error("unreachable code")

    return {x: sx, y: sy, width: legend_width, height: legend_height}
  }

  interactive_bbox(): BBox {
    const {x, y, width, height} = this.compute_legend_bbox()
    return new BBox({x, y, width, height})
  }

  interactive_hit(sx: number, sy: number): boolean {
    const bbox = this.interactive_bbox()
    return bbox.contains(sx, sy)
  }

  on_hit(sx: number, sy: number): boolean {
    let yoffset
    const { glyph_width } = this.model
    const { legend_padding } = this
    const legend_spacing = this.model.spacing
    const { label_standoff } = this.model

    let xoffset = (yoffset = legend_padding)

    const legend_bbox = this.compute_legend_bbox()
    const vertical = this.model.orientation == "vertical"

    for (const item of this.model.items) {
      const labels = item.get_labels_list_from_label_prop()

      for (const label of labels) {
        const x1 = legend_bbox.x + xoffset
        const y1 = legend_bbox.y + yoffset

        let w: number, h: number
        if (vertical)
          [w, h] = [legend_bbox.width - 2*legend_padding, this.max_label_height]
        else
          [w, h] = [this.text_widths[label] + glyph_width + label_standoff, this.max_label_height]

        const bbox = new BBox({x: x1, y: y1, width: w, height: h})

        if (bbox.contains(sx, sy)) {
          switch (this.model.click_policy) {
            case "hide": {
              for (const r of item.renderers)
                r.visible = !r.visible
              break
            }
            case "mute": {
              for (const r of item.renderers)
                r.muted = !r.muted
              break
            }
          }
          return true
        }

        if (vertical)
          yoffset += this.max_label_height + legend_spacing
        else
          xoffset += this.text_widths[label] + glyph_width + label_standoff + legend_spacing
      }
    }

    return false
  }

  render(): void {
    if (!this.model.visible)
      return

    if (this.model.items.length == 0)
      return

    // set a backref on render so that items can later signal item_change upates
    // on the model to trigger a re-render
    for (const item of this.model.items) {
      item.legend = this.model
    }

    const {ctx} = this.plot_view.canvas_view
    const bbox = this.compute_legend_bbox()

    ctx.save()
    this._draw_legend_box(ctx, bbox)
    this._draw_legend_items(ctx, bbox)
    ctx.restore()
  }

  protected _draw_legend_box(ctx: Context2d, bbox: LegendBBox): void {
    ctx.beginPath()
    ctx.rect(bbox.x, bbox.y, bbox.width, bbox.height)
    this.visuals.background_fill.set_value(ctx)
    ctx.fill()
    if (this.visuals.border_line.doit) {
      this.visuals.border_line.set_value(ctx)
      ctx.stroke()
    }
  }

  protected _draw_legend_items(ctx: Context2d, bbox: LegendBBox): void {
    const {glyph_width, glyph_height} = this.model
    const {legend_padding} = this
    const legend_spacing = this.model.spacing
    const {label_standoff} = this.model
    let xoffset = legend_padding
    let yoffset = legend_padding
    const vertical = this.model.orientation == "vertical"

    for (const item of this.model.items) {
      const labels = item.get_labels_list_from_label_prop()
      const field = item.get_field_from_label_prop()

      if (labels.length == 0)
        continue

      const active = (() => { switch (this.model.click_policy) {
        case "none": return true
        case "hide": return all(item.renderers, r => r.visible)
        case "mute": return all(item.renderers, r => !r.muted)
      } })()

      for (const label of labels) {
        const x1 = bbox.x + xoffset
        const y1 = bbox.y + yoffset
        const x2 = x1 + glyph_width
        const y2 = y1 + glyph_height

        if (vertical)
          yoffset += this.max_label_height + legend_spacing
        else
          xoffset += this.text_widths[label] + glyph_width + label_standoff + legend_spacing

        this.visuals.label_text.set_value(ctx)
        ctx.fillText(label, x2 + label_standoff, y1 + this.max_label_height/2.0)
        for (const r of item.renderers) {
          const view = this.plot_view.renderer_views[r.id] as GlyphRendererView
          view.draw_legend(ctx, x1, x2, y1, y2, field, label, item.index)
        }

        if (!active) {
          let w: number, h: number
          if (vertical)
            [w, h] = [bbox.width - 2*legend_padding, this.max_label_height]
          else
            [w, h] = [this.text_widths[label] + glyph_width + label_standoff, this.max_label_height]

          ctx.beginPath()
          ctx.rect(x1, y1, w, h)
          this.visuals.inactive_fill.set_value(ctx)
          ctx.fill()
        }
      }
    }
  }

  protected _get_size(): number {
    const bbox = this.compute_legend_bbox()
    switch (this.model.panel!.side) {
      case "above":
      case "below":
        return bbox.height + 2*this.model.margin
      case "left":
      case "right":
        return bbox.width + 2*this.model.margin
    }
  }
}

export namespace Legend {
  // text:label_
  export interface LabelText {
    label_text_font: string
    label_text_font_size: string
    label_text_font_style: FontStyle
    label_text_color: Color
    label_text_alpha: number
    label_text_align: TextAlign
    label_text_baseline: TextBaseline
    label_text_line_height: number
  }

  // fill:inactive_
  export interface InactiveFill {
    inactive_fill_color: Color
    inactive_fill_alpha: number
  }

  // line:border_
  export interface BorderLine {
    border_line_color: Color
    border_line_width: number
    border_line_alpha: number
    border_line_join: LineJoin
    border_line_cap: LineCap
    border_line_dash: number[]
    border_line_dash_offset: number
  }

  // fill:background_
  export interface BackgroundFill {
    background_fill_color: Color
    background_fill_alpha: number
  }

  export interface Mixins extends LabelText, InactiveFill, BorderLine, BackgroundFill {}

  export interface Attrs extends Annotation.Attrs, Mixins {
    orientation: Orientation
    location: LegendLocation | [number, number]
    label_standoff: number
    glyph_height: number
    glyph_width: number
    label_height: number
    label_width: number
    margin: number
    padding: number
    spacing: number
    items: LegendItem[]
    click_policy: LegendClickPolicy
  }

  export interface Props extends Annotation.Props {}

  export type Visuals = Annotation.Visuals & {
    label_text: Text
    inactive_fill: Fill
    border_line: Line
    background_fill: Fill
  }
}

export interface Legend extends Legend.Attrs {}

export class Legend extends Annotation {

  properties: Legend.Props

  item_change: Signal0<this>

  constructor(attrs?: Partial<Legend.Attrs>) {
    super(attrs)
  }

  initialize(): void {
    super.initialize()
    this.item_change = new Signal0(this, "item_change")
  }

  static initClass(): void {
    this.prototype.type = 'Legend'
    this.prototype.default_view = LegendView

    this.mixins(['text:label_', 'fill:inactive_', 'line:border_', 'fill:background_'])

    this.define({
      orientation:      [ p.Orientation,    'vertical'  ],
      location:         [ p.Any,            'top_right' ], // TODO (bev)
      label_standoff:   [ p.Number,         5           ],
      glyph_height:     [ p.Number,         20          ],
      glyph_width:      [ p.Number,         20          ],
      label_height:     [ p.Number,         20          ],
      label_width:      [ p.Number,         20          ],
      margin:           [ p.Number,         10          ],
      padding:          [ p.Number,         10          ],
      spacing:          [ p.Number,         3           ],
      items:            [ p.Array,          []          ],
      click_policy:     [ p.Any,            "none"      ],
    })

    this.override({
      border_line_color: "#e5e5e5",
      border_line_alpha: 0.5,
      border_line_width: 1,
      background_fill_color: "#ffffff",
      background_fill_alpha: 0.95,
      inactive_fill_color: "white",
      inactive_fill_alpha: 0.7,
      label_text_font_size: "10pt",
      label_text_baseline: "middle",
    })
  }

  get_legend_names(): string[] {
    const legend_names: string[] = []
    for (const item of this.items) {
      const labels = item.get_labels_list_from_label_prop()
      legend_names.push(...labels)
    }
    return legend_names
  }
}
Legend.initClass()
