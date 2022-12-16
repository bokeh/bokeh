import {Annotation, AnnotationView} from "./annotation"
import {LegendItem} from "./legend_item"
import {GlyphRenderer} from "../renderers/glyph_renderer"
import {Orientation, LegendLocation, LegendClickPolicy} from "core/enums"
import * as visuals from "core/visuals"
import * as mixins from "core/property_mixins"
import * as p from "core/properties"
import {Signal0} from "core/signaling"
import {Size} from "core/layout"
import {SideLayout} from "core/layout/side_panel"
import {BBox} from "core/util/bbox"
import {every, some} from "core/util/array"
import {isString} from "core/util/types"
import {Context2d} from "core/util/canvas"
import {TextBox} from "core/graphics"
import {Grid, ContentLayoutable, Sizeable} from "core/layout"

type HitTarget = {type: "entry", entry: LegendEntry}

type EntrySettings = {
  glyph_width: number
  glyph_height: number
  label_standoff: number
  label_width: number
  label_height: number
}

class LegendEntry extends ContentLayoutable {

  constructor(readonly item: LegendItem, readonly label: unknown, readonly text: TextBox, readonly settings: EntrySettings) {
    super()
  }

  get field(): string | null {
    return this.item.get_field_from_label_prop()
  }

  _content_size(): Sizeable {
    const text = this.text.size()

    const {glyph_width, glyph_height, label_standoff, label_width, label_height} = this.settings

    const width = glyph_width + label_standoff + Math.max(text.width, label_width)
    const height = Math.max(glyph_height, text.height, label_height)

    return new Sizeable({width, height})
  }
}

export class LegendView extends AnnotationView {
  override model: Legend
  override visuals: Legend.Visuals

  protected override _get_size(): Size {
    const {width, height} = this.bbox
    const {margin} = this.model
    return {
      width: width + 2*margin,
      height: height + 2*margin,
    }
  }

  override update_layout(): void {
    this.update_geometry()

    const {panel} = this
    if (panel != null)
      this.layout = new SideLayout(panel, () => this.get_size())
    else
      this.layout = undefined
  }

  override connect_signals(): void {
    super.connect_signals()

    const rerender = () => {
      this.update_geometry()
      this.request_render()
    }

    this.connect(this.model.change, rerender)
    this.connect(this.model.item_change, rerender)
  }

  protected bbox: BBox = new BBox()
  protected grid: Grid<LegendEntry>

  protected title_box: TextBox
  protected title_height: number
  protected title_width: number

  get padding(): number {
    return this.model.border_line_color != null ? this.model.padding : 0
  }

  override update_geometry(): void {
    super.update_geometry()

    const {spacing, orientation} = this.model
    const vertical = orientation == "vertical"

    const {padding} = this
    const left = padding
    const top = padding

    const {title} = this.model
    const title_box = new TextBox({text: title ?? ""})
    this.title_box = title_box
    title_box.position = {sx: left, sy: top, x_anchor: "left", y_anchor: "top"}
    title_box.visuals = this.visuals.title_text.values()

    if (title == null || title.length == 0) {
      this.title_width = 0
      this.title_height = 0
    } else {
      const {width, height} = title_box.bbox()
      this.title_width = width
      this.title_height = height + this.model.title_standoff
    }

    const entries = []
    let row = 0
    let col = 0
    for (const item of this.model.items) {
      // set a backref on render so that items can later signal item_change
      // upates on the model to trigger a re-render
      item.legend = this.model

      const labels = item.get_labels_list_from_label_prop()

      for (const label of labels) {
        const text_box = new TextBox({text: `${label}`}) // XXX: not always string
        text_box.position = {sx: 0, sy: 0, x_anchor: "left", y_anchor: "center"}
        text_box.visuals = this.visuals.label_text.values()

        const layout = new LegendEntry(item, label, text_box, this.model)
        layout.set_sizing({visible: item.visible})

        entries.push({layout, row, col})
        vertical ? row++ : col++
      }
    }
    const grid = new Grid(entries)
    this.grid = grid

    grid.position = {left, top: top + this.title_height}
    grid.spacing = spacing
    grid.set_sizing({min_width: this.title_width})
    grid.compute()

    const width  = padding +                     grid.bbox.width  + padding
    const height = padding + this.title_height + grid.bbox.height + padding

    // Position will be filled-in in `compute_geometry()`.
    this.bbox = new BBox({left: 0, top: 0, width, height})
  }

  override compute_geometry(): void {
    super.compute_geometry()

    const {margin, location} = this.model
    const {width, height} = this.bbox

    const panel = this.layout != null ? this.layout : this.plot_view.frame
    const [hr, vr] = panel.bbox.ranges

    let sx: number, sy: number
    if (isString(location)) {
      switch (location) {
        case "top_left":
          sx = hr.start + margin
          sy = vr.start + margin
          break
        case "top":
        case "top_center":
          sx = (hr.end + hr.start)/2 - width/2
          sy = vr.start + margin
          break
        case "top_right":
          sx = hr.end - margin - width
          sy = vr.start + margin
          break
        case "bottom_right":
          sx = hr.end - margin - width
          sy = vr.end - margin - height
          break
        case "bottom":
        case "bottom_center":
          sx = (hr.end + hr.start)/2 - width/2
          sy = vr.end - margin - height
          break
        case "bottom_left":
          sx = hr.start + margin
          sy = vr.end - margin - height
          break
        case "left":
        case "center_left":
          sx = hr.start + margin
          sy = (vr.end + vr.start)/2 - height/2
          break
        case "center":
        case "center_center":
          sx = (hr.end + hr.start)/2 - width/2
          sy = (vr.end + vr.start)/2 - height/2
          break
        case "right":
        case "center_right":
          sx = hr.end - margin - width
          sy = (vr.end + vr.start)/2 - height/2
          break
      }
    } else {
      const [vx, vy] = location
      sx = panel.bbox.xview.compute(vx)
      sy = panel.bbox.yview.compute(vy) - height
    }

    this.bbox = new BBox({left: sx, top: sy, width, height})
  }

  override interactive_hit(sx: number, sy: number): boolean {
    return this.bbox.contains(sx, sy)
  }

  protected _hit_test(sx: number, sy: number): HitTarget | null {
    const {left, top} = this.bbox
    sx -= left
    sy -= top

    for (const entry of this.grid) {
      if (entry.bbox.contains(sx, sy)) {
        return {type: "entry", entry}
      }
    }

    return null
  }

  override cursor(sx: number, sy: number): string | null {
    if (this.model.click_policy == "none")
      return null
    if (this._hit_test(sx, sy) != null)
      return "pointer"
    return null
  }

  override on_hit(sx: number, sy: number): boolean {
    const fn = (() => {
      switch (this.model.click_policy) {
        case "hide": return (r: GlyphRenderer) => r.visible = !r.visible
        case "mute": return (r: GlyphRenderer) => r.muted = !r.muted
        case "none": return (_: GlyphRenderer) => {}
      }
    })()

    const target = this._hit_test(sx, sy)
    if (target != null) {
      const {renderers} = target.entry.item
      for (const renderer of renderers) {
        fn(renderer)
      }
      return true
    }

    return false
  }

  protected _render(): void {
    this.compute_geometry()

    if (this.model.items.length == 0)
      return
    if (!some(this.model.items, (item) => item.visible))
      return

    const {ctx} = this.layer
    ctx.save()
    this._draw_legend_box(ctx)
    this._draw_legend_items(ctx)
    this._draw_title(ctx)
    ctx.restore()
  }

  protected _draw_legend_box(ctx: Context2d): void {
    const {x, y, width, height} = this.bbox
    ctx.beginPath()
    ctx.rect(x, y, width, height)
    this.visuals.background_fill.apply(ctx)
    this.visuals.border_line.apply(ctx)
  }

  protected _draw_title(ctx: Context2d): void {
    const {title} = this.model
    if (title == null || title.length == 0 || !this.visuals.title_text.doit)
      return

    const {left, top} = this.bbox
    ctx.translate(left, top)
    this.title_box.paint(ctx)
    ctx.translate(-left, -top)
  }

  protected _draw_legend_items(ctx: Context2d): void {
    const is_active = (() => {
      switch (this.model.click_policy) {
        case "none": return (_item: LegendItem) => true
        case "hide": return (item: LegendItem)  => every(item.renderers, (r) => r.visible)
        case "mute": return (item: LegendItem)  => every(item.renderers, (r) => !r.muted)
      }
    })()

    const {left, top} = this.bbox
    ctx.translate(left, top)

    for (const entry of this.grid) {
      const {bbox, text, item, label, field, settings} = entry
      const {glyph_width, glyph_height, label_standoff} = settings

      const {left, top, width, height} = bbox
      ctx.translate(left, top)

      const vcenter = height/2
      const x0 = 0
      const y0 = vcenter - glyph_height/2
      const x1 = x0 + glyph_width
      const y1 = y0 + glyph_height

      for (const renderer of item.renderers) {
        const view = this.plot_view.renderer_view(renderer)
        view?.draw_legend(ctx, x0, x1, y0, y1, field, label, item.index)
      }

      ctx.translate(x1 + label_standoff, vcenter)
      text.paint(ctx)
      ctx.translate(-x1 - label_standoff, -vcenter)

      if (!is_active(item)) {
        ctx.beginPath()
        ctx.rect(0, 0, width, height)
        this.visuals.inactive_fill.set_value(ctx)
        ctx.fill()
      }

      ctx.translate(-left, -top)
    }

    ctx.translate(-left, -top)
  }
}

export namespace Legend {
  export type Attrs = p.AttrsOf<Props>

  export type Props = Annotation.Props & {
    orientation: p.Property<Orientation>
    location: p.Property<LegendLocation | [number, number]>
    title: p.Property<string | null>
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
    mixins.TitleText      &
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
  override properties: Legend.Props
  override __view_type__: LegendView

  item_change: Signal0<this>

  constructor(attrs?: Partial<Legend.Attrs>) {
    super(attrs)
  }

  override initialize(): void {
    super.initialize()
    this.item_change = new Signal0(this, "item_change")
  }

  static {
    this.prototype.default_view = LegendView

    this.mixins<Legend.Mixins>([
      ["label_",      mixins.Text],
      ["title_",      mixins.Text],
      ["inactive_",   mixins.Fill],
      ["border_",     mixins.Line],
      ["background_", mixins.Fill],
    ])

    this.define<Legend.Props>(({Number, String, Array, Tuple, Or, Ref, Nullable}) => ({
      orientation:      [ Orientation, "vertical" ],
      location:         [ Or(LegendLocation, Tuple(Number, Number)), "top_right" ],
      title:            [ Nullable(String), null ],
      title_standoff:   [ Number, 5 ],
      label_standoff:   [ Number, 5 ],
      glyph_height:     [ Number, 20 ],
      glyph_width:      [ Number, 20 ],
      label_height:     [ Number, 20 ],
      label_width:      [ Number, 20 ],
      margin:           [ Number, 10 ],
      padding:          [ Number, 10 ],
      spacing:          [ Number, 3 ],
      items:            [ Array(Ref(LegendItem)), [] ],
      click_policy:     [ LegendClickPolicy, "none" ],
    }))

    this.override<Legend.Props>({
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
