import {Annotation, AnnotationView} from "./annotation"
import {LegendItem} from "./legend_item"
import type {GlyphRenderer} from "../renderers/glyph_renderer"
import {AlternationPolicy, Orientation, LegendLocation, LegendClickPolicy, Location} from "core/enums"
import type * as visuals from "core/visuals"
import * as mixins from "core/property_mixins"
import type * as p from "core/properties"
import {Signal0} from "core/signaling"
import type {Size} from "core/layout"
import {SideLayout, SidePanel} from "core/layout/side_panel"
import {BBox} from "core/util/bbox"
import {every, some} from "core/util/array"
import {dict} from "core/util/object"
import {enumerate} from "core/util/iterator"
import {isString} from "core/util/types"
import type {Context2d} from "core/util/canvas"
import {TextBox} from "core/graphics"
import {Column, Row, Grid, ContentLayoutable, Sizeable, TextLayout} from "core/layout"
import {LegendItemClick} from "core/bokeh_events"

const {max, ceil} = Math

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

    const width = glyph_width + label_standoff + max(text.width, label_width)
    const height = max(glyph_height, text.height, label_height)

    return new Sizeable({width, height})
  }
}

export class LegendView extends AnnotationView {
  declare model: Legend
  declare visuals: Legend.Visuals

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
    if (panel != null) {
      this.layout = new SideLayout(panel, () => this.get_size())
    } else {
      this.layout = undefined
    }
  }

  override connect_signals(): void {
    super.connect_signals()

    const repaint = () => this.request_paint()
    this.connect(this.model.change, repaint)
    this.connect(this.model.item_change, repaint)
  }

  protected _bbox: BBox = new BBox()
  override get bbox(): BBox {
    return this._bbox
  }

  protected grid: Grid<LegendEntry>
  protected border_box: Column | Row
  protected title_panel: TextLayout

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
    title_box.position = {sx: 0, sy: 0, x_anchor: "left", y_anchor: "top"}
    title_box.visuals = this.visuals.title_text.values()
    const _title_panel = new SidePanel(this.model.title_location)
    title_box.angle = _title_panel.get_label_angle_heuristic("parallel")

    const entries = []
    for (const item of this.model.items) {
      // Set a backref on render so that items can later signal item_change
      // upates on the model to trigger a re-render.
      item.legend = this.model

      const labels = item.get_labels_list_from_label_prop()
      for (const label of labels) {
        const text_box = new TextBox({text: `${label}`}) // XXX: not always string
        text_box.position = {sx: 0, sy: 0, x_anchor: "left", y_anchor: "center"}
        text_box.visuals = this.visuals.label_text.values()

        const layout = new LegendEntry(item, label, text_box, this.model)
        layout.set_sizing({visible: item.visible})

        entries.push({layout, row: 0, col: 0})
      }
    }

    const {ncols, nrows} = (() => {
      let {ncols, nrows} = this.model
      const n = entries.length
      if (vertical) {
        if (nrows != "auto") {
        } else if (ncols != "auto") {
          nrows = ceil(n / ncols)
        } else {
          nrows = Infinity
        }
        ncols = Infinity
      } else {
        if (ncols != "auto") {
        } else if (nrows != "auto") {
          ncols = ceil(n / nrows)
        } else {
          ncols = Infinity
        }
        nrows = Infinity
      }
      return {ncols, nrows}
    })()

    let row = 0
    let col = 0

    for (const entry of entries) {
      entry.row = row
      entry.col = col

      if (vertical) {
        row += 1
        if (row >= nrows) {
          row = 0
          col += 1
        }
      } else {
        col += 1
        if (col >= ncols) {
          col = 0
          row += 1
        }
      }
    }

    const grid = new Grid(entries)
    this.grid = grid

    grid.spacing = spacing
    grid.set_sizing()

    const title_panel = new TextLayout(title_box)
    this.title_panel = title_panel
    const title_visible = title_box.text != "" && this.visuals.title_text.doit
    title_panel.set_sizing({visible: title_visible}) // doesn't work

    const border_box = (() => {
      if (!title_visible) {
        return new Column([grid])
      }
      switch (this.model.title_location) {
        case "above": return new Column([title_panel, grid])
        case "below": return new Column([grid, title_panel])
        case "left":  return new Row([title_panel, grid])
        case "right": return new Row([grid, title_panel])
      }
    })()
    this.border_box = border_box
    border_box.position = {left, top}

    border_box.spacing = this.model.title_standoff
    border_box.set_sizing()
    border_box.compute()

    const width  = padding + border_box.bbox.width  + padding
    const height = padding + border_box.bbox.height + padding

    // Position will be filled-in in `compute_geometry()`.
    this._bbox = new BBox({left: 0, top: 0, width, height})
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

    this._bbox = new BBox({left: sx, top: sy, width, height})
  }

  override interactive_hit(sx: number, sy: number): boolean {
    return this.bbox.contains(sx, sy)
  }

  protected _hit_test(sx: number, sy: number): HitTarget | null {
    const {left, top} = this.bbox
    sx -= left + this.grid.bbox.left
    sy -= top + this.grid.bbox.top

    for (const entry of this.grid) {
      if (entry.bbox.contains(sx, sy)) {
        return {type: "entry", entry}
      }
    }

    return null
  }

  override cursor(sx: number, sy: number): string | null {
    if (this.model.click_policy == "none" && !dict(this.model.js_event_callbacks).has("legend_item_click")) { // this doesn't cover server callbacks
      return null
    }
    if (this._hit_test(sx, sy) != null) {
      return "pointer"
    }
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
      const {item} = target.entry
      this.model.trigger_event(new LegendItemClick(this.model, item))
      for (const renderer of item.renderers) {
        fn(renderer)
      }
      return true
    }

    return false
  }

  protected _paint(): void {
    if (this.model.items.length == 0) {
      return
    }
    if (!some(this.model.items, (item) => item.visible)) {
      return
    }

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
    if (title == null || title.length == 0 || !this.visuals.title_text.doit) {
      return
    }

    const {left, top} = this.bbox
    ctx.save()
    ctx.translate(left, top)
    ctx.translate(this.title_panel.bbox.left, this.title_panel.bbox.top)

    switch (this.model.title_location) {
      case "left": {
        ctx.translate(0, this.title_panel.bbox.height)
        break
      }
      case "right": {
        ctx.translate(this.title_panel.bbox.width, 0)
        break
      }
      case "above":
      case "below": {
        break
      }
    }

    this.title_panel.text.paint(ctx)
    ctx.restore()
  }

  protected _draw_legend_items(ctx: Context2d): void {
    const is_active = (() => {
      switch (this.model.click_policy) {
        case "none": return (_item: LegendItem) => true
        case "hide": return (item: LegendItem)  => every(item.renderers, (r) => r.visible)
        case "mute": return (item: LegendItem)  => every(item.renderers, (r) => !r.muted)
      }
    })()

    const has_item_background = (_i: number, row: number, col: number) => {
      if (!this.visuals.item_background_fill.doit) {
        return false
      }
      switch (this.model.item_background_policy) {
        case "every": return true
        case "even":  return (row % 2 == 0) == (col % 2 == 0)
        case "odd":   return (row % 2 == 0) != (col % 2 == 0)
        case "none":  return false
      }
    }

    const {left, top} = this.bbox
    ctx.translate(left, top)
    ctx.translate(this.grid.bbox.left, this.grid.bbox.top)

    for (const [{layout: entry, row, col}, i] of enumerate(this.grid.items)) {
      const {bbox, text, item, label, field, settings} = entry
      const {glyph_width, glyph_height, label_standoff} = settings

      const {left, top, width, height} = bbox
      ctx.translate(left, top)

      if (has_item_background(i, row, col)) {
        ctx.beginPath()
        ctx.rect(0, 0, width, height)
        this.visuals.item_background_fill.apply(ctx)
      }

      const vcenter = height/2
      const x0 = 0
      const y0 = vcenter - glyph_height/2
      const x1 = x0 + glyph_width
      const y1 = y0 + glyph_height

      for (const renderer of item.renderers) {
        const view = this.plot_view.views.find_one(renderer)
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

    ctx.translate(-this.grid.bbox.left, -this.grid.bbox.top)
    ctx.translate(-left, -top)
  }
}

export namespace Legend {
  export type Attrs = p.AttrsOf<Props>

  export type Props = Annotation.Props & {
    orientation: p.Property<Orientation>
    ncols: p.Property<number | "auto">
    nrows: p.Property<number | "auto">
    location: p.Property<LegendLocation | [number, number]>
    title: p.Property<string | null>
    title_location: p.Property<Location>
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
    item_background_policy: p.Property<AlternationPolicy>
  } & Mixins

  export type Mixins =
    mixins.LabelText      &
    mixins.TitleText      &
    mixins.InactiveFill   &
    mixins.BorderLine     &
    mixins.BackgroundFill &
    mixins.ItemBackgroundFill

  export type Visuals = Annotation.Visuals & {
    label_text: visuals.Text
    title_text: visuals.Text
    inactive_fill: visuals.Fill
    border_line: visuals.Line
    background_fill: visuals.Fill
    item_background_fill: visuals.Fill
  }
}

export interface Legend extends Legend.Attrs {}

export class Legend extends Annotation {
  declare properties: Legend.Props
  declare __view_type__: LegendView

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
      ["label_",           mixins.Text],
      ["title_",           mixins.Text],
      ["inactive_",        mixins.Fill],
      ["border_",          mixins.Line],
      ["background_",      mixins.Fill],
      ["item_background_", mixins.Fill],
    ])

    this.define<Legend.Props>(({Float, Int, Str, List, Tuple, Or, Ref, Nullable, Positive, Auto}) => ({
      orientation:      [ Orientation, "vertical" ],
      ncols:            [ Or(Positive(Int), Auto), "auto" ],
      nrows:            [ Or(Positive(Int), Auto), "auto" ],
      location:         [ Or(LegendLocation, Tuple(Float, Float)), "top_right" ],
      title:            [ Nullable(Str), null ],
      title_location:   [ Location, "above" ],
      title_standoff:   [ Float, 5 ],
      label_standoff:   [ Float, 5 ],
      glyph_height:     [ Float, 20 ],
      glyph_width:      [ Float, 20 ],
      label_height:     [ Float, 20 ],
      label_width:      [ Float, 20 ],
      margin:           [ Float, 10 ],
      padding:          [ Float, 10 ],
      spacing:          [ Float, 3 ],
      items:            [ List(Ref(LegendItem)), [] ],
      click_policy:     [ LegendClickPolicy, "none" ],
      item_background_policy: [ AlternationPolicy, "none" ],
    }))

    this.override<Legend.Props>({
      border_line_color: "#e5e5e5",
      border_line_alpha: 0.5,
      border_line_width: 1,
      background_fill_color: "#ffffff",
      background_fill_alpha: 0.95,
      item_background_fill_color: "#f1f1f1",
      item_background_fill_alpha: 0.8,
      inactive_fill_color: "white",
      inactive_fill_alpha: 0.7,
      label_text_font_size: "13px",
      label_text_baseline: "middle",
      title_text_font_size: "13px",
      title_text_font_style: "italic",
    })
  }
}
