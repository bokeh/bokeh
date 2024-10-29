import {Annotation, AnnotationView} from "./annotation"
import {LegendItem} from "./legend_item"
import type {GlyphRenderer} from "../renderers/glyph_renderer"
import {AlternationPolicy, Orientation, LegendLocation, LegendClickPolicy, Location} from "core/enums"
import type {VAlign, HAlign} from "core/enums"
import type * as visuals from "core/visuals"
import * as mixins from "core/property_mixins"
import type * as p from "core/properties"
import type {Size} from "core/layout"
import {SideLayout, SidePanel} from "core/layout/side_panel"
import {BBox} from "core/util/bbox"
import {every, some} from "core/util/array"
import {dict} from "core/util/object"
import {isString} from "core/util/types"
import {zip} from "core/util/iterator"
import type {Context2d, CanvasLayer} from "core/util/canvas"
import {LegendItemClick} from "core/bokeh_events"
import {div, bounding_box, px, empty} from "core/dom"
import type {StyleSheetLike} from "core/dom"
import {TextBox} from "core/graphics"
import * as legend_css from "styles/legend.css"
import {Padding, BorderRadius} from "../common/kinds"
import {round_rect} from "../common/painting"
import * as resolve from "../common/resolve"
import type {XY, LRTB, Corners} from "core/util/bbox"

const {ceil} = Math

type Entry = {
  el: HTMLElement
  glyph: CanvasLayer
  label_el: HTMLElement
  item: LegendItem
  label: string
  i: number
  row: number
  col: number
}

export class LegendView extends AnnotationView {
  declare model: Legend
  declare visuals: Legend.Visuals

  override get is_dual_renderer(): boolean {
    return true
  }

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

  protected _resize_observer: ResizeObserver

  override initialize(): void {
    super.initialize()
    this._resize_observer = new ResizeObserver((_entries) => this.request_layout())
    this._resize_observer.observe(this.el, {box: "border-box"})
  }

  override remove(): void {
    this._resize_observer.disconnect()
    super.remove()
  }

  override connect_signals(): void {
    super.connect_signals()
    this.connect(this.model.change, () => this.rerender())

    const {items} = this.model.properties
    this.on_transitive_change(items, () => this._render_items())
  }

  protected _bbox: BBox = new BBox()
  override get bbox(): BBox {
    return this._bbox
  }

  protected readonly grid_el: HTMLElement = div({class: legend_css.grid})
  protected title_el: HTMLElement = div()

  protected entries: Entry[] = []

  get padding(): LRTB<number> {
    const padding = this.model.border_line_color != null ? this.model.padding : 0
    return resolve.padding(padding)
  }

  get border_radius(): Corners<number> {
    return resolve.border_radius(this.model.border_radius)
  }

  override stylesheets(): StyleSheetLike[] {
    return [...super.stylesheets(), legend_css.default]
  }

  protected _paint_glyphs(): void {
    const {glyph_width, glyph_height} = this.model

    const x0 = 0
    const y0 = 0
    const x1 = glyph_width
    const y1 = glyph_height

    for (const {glyph, item, label} of this.entries) {
      const field = item.get_field_from_label_prop()
      glyph.resize(glyph_width, glyph_height)

      const ctx = glyph.prepare()
      for (const renderer of item.renderers) {
        const view = this.plot_view.views.find_one(renderer)
        view?.draw_legend(ctx, x0, x1, y0, y1, field, label, item.index)
      }
      glyph.finish()
    }
  }

  get labels(): {item: LegendItem, label: string}[] {
    const collected = []
    for (const item of this.model.items) {
      const labels = item.get_labels_list_from_label_prop()
      for (const label of labels) {
        collected.push({item, label})
      }
    }
    return collected
  }

  protected get _should_rerender_items(): boolean {
    const {entries, labels} = this
    if (entries.length != labels.length) {
      return true
    }
    for (const [entry, {item, label}] of zip(entries, labels)) {
      if (entry.item != item || entry.label != label) {
        return true
      }
    }
    return false
  }

  protected _render_items(): void {
    this.entries = []

    const {click_policy} = this
    let i = 0

    for (const item of this.model.items) {
      const labels = item.get_labels_list_from_label_prop()

      for (const label of labels) {
        const glyph = this.plot_view.canvas.create_layer()
        glyph.el.classList.add(legend_css.glyph)

        const glyph_el = glyph.canvas
        const label_el = div({class: legend_css.label}, `${label}`)
        const item_el = div({class: legend_css.item}, glyph_el, label_el)
        item_el.classList.toggle(legend_css.hidden, !item.visible)

        item_el.addEventListener("pointerdown", () => {
          this.model.trigger_event(new LegendItemClick(this.model, item))
          for (const renderer of item.renderers) {
            click_policy(renderer)
          }
        })

        this.entries.push({el: item_el, glyph, label_el, item, label, i: i++, row: 0, col: 0})
      }
    }

    const vertical = this.model.orientation == "vertical"

    const {nc: ncols, nr: nrows} = (() => {
      const {ncols, nrows} = this.model
      const n = this.entries.length
      let nc: number
      let nr: number
      if (ncols != "auto" && nrows != "auto") {
        nc = ncols
        nr = nrows
      } else if (ncols != "auto") {
        nc = ncols
        nr = ceil(n / ncols)
      } else if (nrows != "auto") {
        nc = ceil(n / nrows)
        nr = nrows
      } else {
        if (vertical) {
          nc = 1
          nr = n
        } else {
          nc = n
          nr = 1
        }
      }
      return {nc, nr}
    })()

    let row = 0
    let col = 0

    for (const entry of this.entries) {
      entry.el.id = `item_${row}_${col}`

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

    const {is_active} = this
    for (const {el, item} of this.entries) {
      if (!is_active(item)) {
        el.classList.add(legend_css.active)
      }
    }

    for (const {el, i, row, col} of this.entries) {
      if (this.has_item_background(i, row, col)) {
        el.classList.add(legend_css.styled)
      }
    }

    empty(this.grid_el)
    this.grid_el.style.setProperty("--ncols", `${ncols}`)
    this.grid_el.style.setProperty("--nrows", `${nrows}`)
    this.grid_el.append(...this.entries.map(({el}) => el))
  }

  override render(): void {
    super.render()

    const {orientation} = this.model
    const vertical = orientation == "vertical"

    this.el.classList.toggle(legend_css.interactive, this.is_interactive)
    this.el.classList.toggle(legend_css.vertical, vertical)

    const title_el = div({class: legend_css.title}, this.model.title)
    this.title_el.remove()
    this.title_el = title_el

    // can't simply use `rotate`, because rotation doesn't affect layout
    const {writing_mode, rotate} = (() => {
      const label_panel = new SidePanel(this.model.title_location)
      switch (label_panel.face_adjusted_side) {
        case "above": return {writing_mode: "horizontal-tb", rotate: 0}
        case "below": return {writing_mode: "horizontal-tb", rotate: 0}
        case "left":  return {writing_mode: "vertical-rl",   rotate: 180}
        case "right": return {writing_mode: "vertical-rl",   rotate: 0}
      }
    })()

    const title_styles = this.visuals.title_text.computed_values()
    this.style.append(`
    .${legend_css.title} {
      font: ${title_styles.font};
      color: ${title_styles.color};
      -webkit-text-stroke: 1px ${title_styles.outline_color};
      writing-mode: ${writing_mode};
      rotate: ${rotate}deg;
    }
    `)

    const label_styles = this.visuals.label_text.computed_values()
    this.style.append(`
    .${legend_css.item} .${legend_css.label} {
      font: ${label_styles.font};
      color: ${label_styles.color};
      -webkit-text-stroke: 1px ${label_styles.outline_color};
    }
    `)

    const {anchor} = this
    this.style.append(`
    :host {
      transform: translate(-${anchor.x*100}%, -${anchor.y*100}%);
    }
    `)

    this.style.append(`
    :host {
      gap: ${px(this.model.title_standoff)};
    }
    .${legend_css.grid} {
      gap: ${px(this.model.spacing)};
    }
    .${legend_css.item} {
      gap: ${px(this.model.label_standoff)};
    }
    .${legend_css.item} .${legend_css.glyph} {
      width: ${px(this.model.glyph_width)};
      height: ${px(this.model.glyph_height)};
    }
    .${legend_css.item} .${legend_css.label} {
      min-width: ${px(this.model.label_width)};
      min-height: ${px(this.model.label_height)};
    }
    `)

    if (this.visuals.item_background_fill.doit) {
      const {color} = this.visuals.item_background_fill.computed_values()
      this.style.append(`
      .${legend_css.item} {
        --item-background-color: ${color};
      }
      `)
    }

    if (this.visuals.item_background_fill.doit) {
      const {color} = this.visuals.item_background_fill.computed_values()
      this.style.append(`
      .${legend_css.item} {
        --item-background-active-color: ${color};
      }
      `)
    }

    const grid_auto_flow = (() => {
      switch (this.model.title_location) {
        case "above":
        case "below": return "row"
        case "left":
        case "right": return "column"
      }
    })()
    this.style.append(`
      :host {
        grid-auto-flow: ${grid_auto_flow};
      }
    `)

    this.shadow_el.append(...(() => {
      switch (this.model.title_location) {
        case "above": return [title_el, this.grid_el]
        case "below": return [this.grid_el, title_el]
        case "left":  return [title_el, this.grid_el]
        case "right": return [this.grid_el, title_el]
      }
    })())

    const {padding, border_radius} = this
    this.style.append(`
    :host {
      padding-left: ${padding.left}px;
      padding-right: ${padding.right}px;
      padding-top: ${padding.top}px;
      padding-bottom: ${padding.bottom}px;

      border-top-left-radius: ${border_radius.top_left}px;
      border-top-right-radius: ${border_radius.top_right}px;
      border-bottom-right-radius: ${border_radius.bottom_right}px;
      border-bottom-left-radius: ${border_radius.bottom_left}px;
    }
    `)

    if (this.visuals.background_fill.doit) {
      const {color} = this.visuals.background_fill.computed_values()
      this.style.append(`
      :host {
        background-color: ${color};
      }
      `)
    }

    if (this.visuals.border_line.doit) {
      // TODO use background-image to replicate number[] dash patterns
      const {color, width, dash} = this.visuals.border_line.computed_values()
      this.style.append(`
      :host {
        border-color: ${color};
        border-width: ${width}px;
        border-style: ${isString(dash) ? dash : (dash.length < 2 ? "solid" : "dashed")};
      }
      `)
    }

    this._render_items()
  }

  override after_render(): void {
    super.after_render()
    this.update_position()
  }

  get location(): {x: HAlign | number, y: VAlign | number} {
    const {location} = this.model
    if (isString(location)) {
      const normal_location = (() => {
        switch (location) {
          case "top":    return "top_center"
          case "bottom": return "bottom_center"
          case "left":   return "center_left"
          case "center": return "center_center"
          case "right":  return "center_right"
          default:       return location
        }
      })()
      const [v_loc, h_loc] = normal_location.split("_") as [VAlign, HAlign]
      return {x: h_loc, y: v_loc}
    } else {
      const [x_loc, y_loc] = location
      return {x: x_loc, y: y_loc}
    }
  }

  get anchor(): XY<number> {
    const {location} = this
    const x_anchor = (() => {
      switch (location.x) {
        case "left":   return 0.0
        case "center": return 0.5
        case "right":  return 1.0
        default:       return 0.0
      }
    })()
    const y_anchor = (() => {
      switch (location.y) {
        case "top":    return 0.0
        case "center": return 0.5
        case "bottom": return 1.0
        default:       return 1.0
      }
    })()
    return {x: x_anchor, y: y_anchor}
  }

  get css_position(): XY<string> {
    const {location} = this
    const {margin} = this.model
    const panel = this.layout ?? this.plot_view.frame
    const x_pos = (() => {
      const {x} = location
      switch (x) {
        case "left":   return `calc(0% + ${px(margin)})`
        case "center": return "50%"
        case "right":  return `calc(100% - ${px(margin)})`
        default:       return px(panel.bbox.relative().x_view.compute(x))
      }
    })()
    const y_pos = (() => {
      const {y} = location
      switch (y) {
        case "top":    return `calc(0% + ${px(margin)})`
        case "center": return "50%"
        case "bottom": return `calc(100% - ${px(margin)})`
        default:       return px(panel.bbox.relative().y_view.compute(y))
      }
    })()
    return {x: x_pos, y: y_pos}
  }

  get is_visible(): boolean {
    const {visible, items} = this.model
    return visible && items.length != 0 && some(items, (item) => item.visible)
  }

  override update_position(): void {
    if (this.is_visible) {
      const {x, y} = this.css_position
      this.position.replace(`
      :host {
        position: ${this.layout != null ? "relative" : "absolute"};
        left: ${x};
        top:  ${y};
      }
      `)
    } else {
      this.position.replace(`
      :host {
        display: none;
      }
      `)
    }

    const legend_bbox = bounding_box(this.el)
    const canvas_bbox = bounding_box(this.plot_view.canvas.el)
    this._bbox = legend_bbox.relative_to(canvas_bbox)
  }

  get is_interactive(): boolean {
    // this doesn't cover server callbacks
    return this.model.click_policy != "none" || dict(this.model.js_event_callbacks).has("legend_item_click")
  }

  get click_policy(): (r: GlyphRenderer) => void {
    switch (this.model.click_policy) {
      case "hide": return (r) => r.visible = !r.visible
      case "mute": return (r) => r.muted = !r.muted
      case "none": return (_) => {}
    }
  }

  get is_active(): (item: LegendItem) => boolean {
    switch (this.model.click_policy) {
      case "none": return (_item) => true
      case "hide": return (item)  => every(item.renderers, (r) => r.visible)
      case "mute": return (item)  => every(item.renderers, (r) => !r.muted)
    }
  }

  has_item_background(_i: number, row: number, col: number): boolean {
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

  protected _paint(ctx: Context2d): void {
    if (!this.is_visible) {
      return
    }

    if (this.is_dual_renderer && !this.parent.is_forcing_paint) {
      if (this._should_rerender_items) {
        this._render_items()
      }
      this._paint_glyphs()
    } else {
      ctx.save()
      const canvas_bbox = bounding_box(this.plot_view.canvas.el)
      this._draw_legend_box(ctx, canvas_bbox)
      this._draw_title(ctx, canvas_bbox)
      this._draw_legend_items(ctx, canvas_bbox)
      ctx.restore()
    }
  }

  protected _draw_legend_box(ctx: Context2d, canvas_bbox: BBox): void {
    ctx.beginPath()
    const bbox = bounding_box(this.el).relative_to(canvas_bbox)
    round_rect(ctx, bbox, this.border_radius)

    this.visuals.background_fill.apply(ctx)
    this.visuals.border_line.apply(ctx)
  }

  protected _draw_title(ctx: Context2d, canvas_bbox: BBox): void {
    const {title} = this.model
    if (title == null || title.length == 0 || !this.visuals.title_text.doit) {
      return
    }

    const text = this.title_el.textContent
    if (text != null) {
      const text_box = new TextBox({text})
      const title_bbox = bounding_box(this.title_el).relative_to(canvas_bbox)
      let {x: sx, y: sy} = title_bbox
      switch (this.model.title_location) {
        case "left": {
          sy += title_bbox.height
          break
        }
        case "right": {
          sx += title_bbox.width
          break
        }
        default:
      }
      text_box.position = {sx, sy, x_anchor: "left", y_anchor: "top"}
      text_box.visuals = this.visuals.title_text.values()
      const panel = new SidePanel(this.model.title_location)
      text_box.angle = panel.get_label_angle_heuristic("parallel")
      text_box.paint(ctx)
    }
  }

  protected _draw_legend_items(ctx: Context2d, canvas_bbox: BBox): void {
    const {is_active} = this

    for (const {el: item_el, glyph, label_el, item, i, row, col} of this.entries) {
      const item_bbox = bounding_box(item_el).relative_to(canvas_bbox)

      if (this.has_item_background(i, row, col)) {
        ctx.beginPath()
        ctx.rect_bbox(item_bbox)
        this.visuals.item_background_fill.apply(ctx)
      }

      ctx.layer.undo_transform(() => {
        const glyph_el = glyph.canvas
        const glyph_bbox = bounding_box(glyph_el).relative_to(canvas_bbox)
        ctx.drawImage(glyph_el, glyph_bbox.x, glyph_bbox.y)
      })

      const text = label_el.textContent
      if (text != null) {
        const text_box = new TextBox({text})
        const {x: sx, vcenter: sy} = bounding_box(label_el).relative_to(canvas_bbox)
        text_box.position = {sx, sy, x_anchor: "left", y_anchor: "center"}
        text_box.visuals = this.visuals.label_text.values()
        text_box.paint(ctx)
      }

      if (!is_active(item)) {
        ctx.beginPath()
        ctx.rect_bbox(item_bbox)
        this.visuals.inactive_fill.apply(ctx)
      }
    }
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
    glyph_width: p.Property<number>
    glyph_height: p.Property<number>
    label_width: p.Property<number>
    label_height: p.Property<number | "auto">
    margin: p.Property<number>
    padding: p.Property<Padding>
    border_radius: p.Property<BorderRadius>
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

  constructor(attrs?: Partial<Legend.Attrs>) {
    super(attrs)
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
      glyph_width:      [ Float, 20 ],
      glyph_height:     [ Float, 20 ],
      label_width:      [ Float, 20 ],
      label_height:     [ Or(Float, Auto), "auto" ],
      margin:           [ Float, 10 ],
      padding:          [ Padding, 10 ],
      border_radius:    [ BorderRadius, 0 ],
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
