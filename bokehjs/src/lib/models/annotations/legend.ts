import {Annotation, AnnotationView} from "./annotation"
import {LegendItem} from "./legend_item"
import {GlyphRendererView} from "../renderers/glyph_renderer"
import {Orientation, LegendLocation, LegendClickPolicy} from "core/enums"
import * as visuals from "core/visuals"
import * as mixins from "core/property_mixins"
import * as p from "core/properties"
import {Signal0} from "core/signaling"
import {Size} from "core/layout"
import {measure_font} from "core/util/text"
import {BBox} from "core/util/bbox"
import {max, every} from "core/util/array"
import {isString, isArray} from "core/util/types"
import {Context2d} from "core/util/canvas"
import {unreachable} from "core/util/assert"

export class LegendView extends AnnotationView {
  model: Legend
  visuals: Legend.Visuals

  protected max_label_height: number
  protected text_widths: Map<string, number>
  protected title_height: number
  protected title_width: number

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

  compute_legend_bbox(): BBox {
    const legend_names = this.model.get_legend_names()

    const {glyph_height, glyph_width} = this.model
    const {label_height, label_width} = this.model

    this.max_label_height = max(
      [measure_font(this.visuals.label_text.font_value()).height, label_height, glyph_height],
    )

    // this is to measure text properties
    const {ctx} = this.layer
    ctx.save()
    this.visuals.label_text.set_value(ctx)
    this.text_widths = new Map()
    for (const name of legend_names) {
      this.text_widths.set(name, max([ctx.measureText(name).width, label_width]))
    }

    this.visuals.title_text.set_value(ctx)
    this.title_height = this.model.title ? measure_font(this.visuals.title_text.font_value()).height + this.model.title_standoff : 0
    this.title_width = this.model.title ? ctx.measureText(this.model.title).width : 0

    ctx.restore()

    const max_label_width = Math.max(max([...this.text_widths.values()]), 0)

    const legend_margin = this.model.margin
    const {legend_padding} = this
    const legend_spacing = this.model.spacing
    const {label_standoff} =  this.model

    let legend_height: number, legend_width: number
    if (this.model.orientation == "vertical") {
      legend_height = legend_names.length*this.max_label_height + Math.max(legend_names.length - 1, 0)*legend_spacing + 2*legend_padding + this.title_height
      legend_width = max([(max_label_width + glyph_width + label_standoff + 2*legend_padding), this.title_width + 2*legend_padding])
    } else {
      let item_width = 2*legend_padding + Math.max(legend_names.length - 1, 0)*legend_spacing
      for (const [, width] of this.text_widths) {
        item_width += max([width, label_width]) + glyph_width + label_standoff
      }
      legend_width = max([this.title_width + 2*legend_padding, item_width])
      legend_height = this.max_label_height + this.title_height + 2*legend_padding
    }

    const panel = this.panel != null ? this.panel : this.plot_view.frame
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
      }
    } else if (isArray(location) && location.length == 2) {
      const [vx, vy] = location
      sx = panel.xview.compute(vx)
      sy = panel.yview.compute(vy) - legend_height
    } else
      unreachable()

    return new BBox({left: sx, top: sy, width: legend_width, height: legend_height})
  }

  interactive_bbox(): BBox {
    return this.compute_legend_bbox()
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
        const y1 = legend_bbox.y + yoffset + this.title_height

        let w: number, h: number
        if (vertical)
          [w, h] = [legend_bbox.width - 2*legend_padding, this.max_label_height]
        else
          [w, h] = [this.text_widths.get(label)! + glyph_width + label_standoff, this.max_label_height]

        const bbox = new BBox({left: x1, top: y1, width: w, height: h})

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
          xoffset += this.text_widths.get(label)! + glyph_width + label_standoff + legend_spacing
      }
    }

    return false
  }

  protected _render(): void {
    if (this.model.items.length == 0)
      return

    // set a backref on render so that items can later signal item_change upates
    // on the model to trigger a re-render
    for (const item of this.model.items) {
      item.legend = this.model
    }

    const {ctx} = this.layer
    const bbox = this.compute_legend_bbox()

    ctx.save()
    this._draw_legend_box(ctx, bbox)
    this._draw_legend_items(ctx, bbox)

    if (this.model.title)
      this._draw_title(ctx, bbox)

    ctx.restore()
  }

  protected _draw_legend_box(ctx: Context2d, bbox: BBox): void {
    ctx.beginPath()
    ctx.rect(bbox.x, bbox.y, bbox.width, bbox.height)
    this.visuals.background_fill.set_value(ctx)
    ctx.fill()
    if (this.visuals.border_line.doit) {
      this.visuals.border_line.set_value(ctx)
      ctx.stroke()
    }
  }

  protected _draw_legend_items(ctx: Context2d, bbox: BBox): void {
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

      const active = (() => {
        switch (this.model.click_policy) {
          case "none": return true
          case "hide": return every(item.renderers, r => r.visible)
          case "mute": return every(item.renderers, r => !r.muted)
        }
      })()

      for (const label of labels) {
        const x1 = bbox.x + xoffset
        const y1 = bbox.y + yoffset + this.title_height
        const x2 = x1 + glyph_width
        const y2 = y1 + glyph_height

        if (vertical)
          yoffset += this.max_label_height + legend_spacing
        else
          xoffset += this.text_widths.get(label)! + glyph_width + label_standoff + legend_spacing

        this.visuals.label_text.set_value(ctx)
        ctx.fillText(label, x2 + label_standoff, y1 + this.max_label_height/2.0)
        for (const r of item.renderers) {
          const view = this.plot_view.renderer_views.get(r)! as GlyphRendererView
          view.draw_legend(ctx, x1, x2, y1, y2, field, label, item.index)
        }

        if (!active) {
          let w: number, h: number
          if (vertical)
            [w, h] = [bbox.width - 2*legend_padding, this.max_label_height]
          else
            [w, h] = [this.text_widths.get(label)! + glyph_width + label_standoff, this.max_label_height]

          ctx.beginPath()
          ctx.rect(x1, y1, w, h)
          this.visuals.inactive_fill.set_value(ctx)
          ctx.fill()
        }
      }
    }
  }

  protected _draw_title(ctx: Context2d, bbox: BBox): void {
    if (!this.visuals.title_text.doit)
      return

    ctx.save()
    ctx.translate(bbox.x0, bbox.y0 + this.title_height)
    this.visuals.title_text.set_value(ctx)
    ctx.fillText(this.model.title, this.legend_padding, this.legend_padding-this.model.title_standoff)
    ctx.restore()
  }

  protected _get_size(): Size {
    const {width, height} = this.compute_legend_bbox()
    return {
      width: width + 2*this.model.margin,
      height: height + 2*this.model.margin,
    }
  }
}

export namespace Legend {
  export type Attrs = p.AttrsOf<Props>

  export type Props = Annotation.Props & {
    orientation: p.Property<Orientation>
    location: p.Property<LegendLocation | [number, number]>
    title: p.Property<string>
    title_standoff: p.Property<number>
    label_standoff: p.Property<number>
    glyph_height: p.Property<number>
    glyph_width: p.Property<number>
    label_height: p.Property<number>
    label_width: p.Property<number>
    margin: p.Property<number>
    padding: p.Property<number>
    spacing: p.Property<number>
    items: p.Property<LegendItem[]>
    click_policy: p.Property<LegendClickPolicy>
  } & Mixins

  export type Mixins =
    mixins.LabelText      &
    mixins.InactiveFill   &
    mixins.BorderLine     &
    mixins.BackgroundFill

  export type Visuals = Annotation.Visuals & {
    label_text: visuals.Text
    title_text: visuals.Text
    inactive_fill: visuals.Fill
    border_line: visuals.Line
    background_fill: visuals.Fill
  }
}

export interface Legend extends Legend.Attrs {}

export class Legend extends Annotation {
  properties: Legend.Props
  __view_type__: LegendView

  item_change: Signal0<this>

  constructor(attrs?: Partial<Legend.Attrs>) {
    super(attrs)
  }

  initialize(): void {
    super.initialize()
    this.item_change = new Signal0(this, "item_change")
  }

  static init_Legend(): void {
    this.prototype.default_view = LegendView

    this.mixins<Legend.Mixins>([
      ["label_",      mixins.Text],
      ["title_",      mixins.Text],
      ["inactive_",   mixins.Fill],
      ["border_",     mixins.Line],
      ["background_", mixins.Fill],
    ])

    this.define<Legend.Props>({
      orientation:      [ p.Orientation,    'vertical'  ],
      location:         [ p.Any,            'top_right' ], // TODO (bev)
      title:            [ p.String                      ],
      title_standoff:   [ p.Number,         5           ],
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
      label_text_font_size: "13px",
      label_text_baseline: "middle",
      title_text_font_size: "13px",
      title_text_font_style: "italic",
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
