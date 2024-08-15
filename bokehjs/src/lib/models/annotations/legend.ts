import {Annotation, AnnotationView} from "./annotation"
import {LegendItem} from "./legend_item"
import type {GlyphRenderer} from "../renderers/glyph_renderer"
import {AlternationPolicy, Orientation, LegendLocation, LegendClickPolicy, Location} from "core/enums"
import type {VAlign, HAlign} from "core/enums"
import type * as visuals from "core/visuals"
import * as mixins from "core/property_mixins"
import type * as p from "core/properties"
import {Signal0} from "core/signaling"
import type {Size} from "core/layout"
import {SideLayout, SidePanel} from "core/layout/side_panel"
import {BBox} from "core/util/bbox"
import {every, some} from "core/util/array"
import {dict} from "core/util/object"
import {isString} from "core/util/types"
import type {Context2d} from "core/util/canvas"
import {LegendItemClick} from "core/bokeh_events"
import {div, bounding_box, px} from "core/dom"
import type {StyleSheetLike} from "core/dom"
import * as legend_css from "styles/legend.css"
import {Padding, BorderRadius} from "../common/kinds"
import * as resolve from "../common/resolve"
import type {XY, LRTB, Corners} from "core/util/bbox"

const {ceil} = Math

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

  protected grid_el: HTMLElement = div()
  protected title_el: HTMLElement = div()

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

  override render(): void {
    super.render()

    this.el.classList.toggle(legend_css.interactive, this.is_interactive)

    const {orientation} = this.model
    const vertical = orientation == "vertical"

    const label_el = div({class: legend_css.label}, this.model.title)
    const label_angle = (() => {
      const panel = new SidePanel(this.model.title_location)
      return panel.get_label_angle_heuristic("parallel")
    })()
    if (label_angle != 0) {
      this.style.append(`
      .bk-title .bk-label {
        rotate: ${label_angle}rad;
      }
      `)
    }

    const title_el = div({class: legend_css.title}, label_el)
    this.title_el.remove()
    this.title_el = title_el

    const title_styles = this.visuals.title_text.computed_values()
    this.style.append(`
    .bk-title .bk-label {
      font: ${title_styles.font};
      color: ${title_styles.color};
      -webkit-text-stroke: 1px ${title_styles.outline_color};
    }
    `)

    const label_styles = this.visuals.label_text.computed_values()
    this.style.append(`
    .bk-item .bk-label {
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
      gap: ${this.model.title_standoff}px;
    }
    .bk-grid {
      gap: ${this.model.spacing}px;
    }
    .bk-item {
      gap: ${this.model.label_standoff}px;
    }
    .bk-item .bk-glyph {
      width: ${this.model.glyph_width}px;
      height: ${this.model.glyph_height}px;
    }
    `)

    const entries: {el: HTMLElement, item: LegendItem, i: number, row: number, col: number}[] = []
    const {click_policy} = this
    let i = 0

    for (const item of this.model.items) {
      // Set a backref on render so that items can later signal item_change
      // updates on the model to trigger a re-render.
      item.legend = this.model

      const field = item.get_field_from_label_prop()
      const labels = item.get_labels_list_from_label_prop()

      for (const label of labels) {
        const {glyph_width, glyph_height} = this.model
        const glyph = this.plot_view.canvas.create_layer()
        glyph.resize(glyph_width, glyph_height)
        glyph.el.classList.add(legend_css.glyph)

        const glyph_el = glyph.el
        const label_el = div({class: legend_css.label}, `${label}`)
        const item_el = div({class: legend_css.item}, glyph_el, label_el)
        item_el.classList.toggle(legend_css.hidden, !item.visible)

        const x0 = 0
        const y0 = 0
        const x1 = glyph_width
        const y1 = glyph_height

        const {ctx} = glyph
        for (const renderer of item.renderers) {
          const view = this.plot_view.views.find_one(renderer)
          view?.draw_legend(ctx, x0, x1, y0, y1, field, label, item.index)
        }

        item_el.addEventListener("pointerdown", () => {
          this.model.trigger_event(new LegendItemClick(this.model, item))
          for (const renderer of item.renderers) {
            click_policy(renderer)
          }
        })

        entries.push({el: item_el, item, i: i++, row: 0, col: 0})
      }
    }

    const {nc: ncols, nr: nrows} = (() => {
      const {ncols, nrows} = this.model
      const n = entries.length
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

    for (const entry of entries) {
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

    if (this.visuals.item_background_fill.doit) {
      const {color} = this.visuals.item_background_fill.computed_values()
      this.style.append(`
      .${legend_css.item} {
        --item-background-color: ${color};
      }
      `)

      for (const {el, i, row, col} of entries) {
        if (this.has_item_background(i, row, col)) {
          el.classList.add(legend_css.styled)
        }
      }
    }

    if (this.visuals.item_background_fill.doit) {
      const {color} = this.visuals.item_background_fill.computed_values()
      this.style.append(`
      .${legend_css.item} {
        --item-background-active-color: ${color};
      }
      `)

      const {is_active} = this
      for (const {el, item} of entries) {
        if (!is_active(item)) {
          el.classList.add(legend_css.active)
        }
      }
    }

    const grid_el = div({class: legend_css.grid}, entries.map(({el}) => el))
    this.grid_el.remove()
    this.grid_el = grid_el

    this.style.append(`
    .bk-grid {
      grid-auto-flow: ${vertical ? "column" : "row"};
      grid-template-rows: repeat(${nrows}, 1fr);
      grid-template-columns: repeat(${ncols}, 1fr);
    }
    `)

    const legend_layout = (() => {
      switch (this.model.title_location) {
        case "above":
        case "below": return "column"
        case "left":
        case "right": return "row"
      }
    })()
    this.style.append(`
      :host {
        --legend-layout: ${legend_layout}
      }
    `)

    this.shadow_el.append(...(() => {
      switch (this.model.title_location) {
        case "above": return [title_el, grid_el]
        case "below": return [grid_el, title_el]
        case "left":  return [title_el, grid_el]
        case "right": return [grid_el, title_el]
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
        default:       return px(panel.bbox.x_view.compute(x))
      }
    })()
    const y_pos = (() => {
      const {y} = location
      switch (y) {
        case "top":    return `calc(0% + ${px(margin)})`
        case "center": return "50%"
        case "bottom": return `calc(100% - ${px(margin)})`
        default:       return px(panel.bbox.y_view.compute(y))
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

    const {left, top, width, height} = bounding_box(this.el)
    this._bbox = new BBox({left, top, width, height})
  }

  override rendering_target(): HTMLElement | ShadowRoot {
    const panel = this.panel ?? this.plot_view.frame
    return panel.shadow_el
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

  protected _paint(): void {
    if (this.model.items.length == 0) {
      return
    }
    if (!some(this.model.items, (item) => item.visible)) {
      return
    }

    const {ctx} = this.layer
    ctx.save()
    //this._draw_legend_box(ctx)
    //this._draw_legend_items(ctx)
    //this._draw_title(ctx)
    ctx.restore()
  }

  protected _draw_legend_box(ctx: Context2d): void {
    const {x, y, width, height} = this.bbox
    ctx.beginPath()
    ctx.rect(x, y, width, height)
    this.visuals.background_fill.apply(ctx)
    this.visuals.border_line.apply(ctx)
  }

  protected _draw_title(_ctx: Context2d): void {
    const {title} = this.model
    if (title == null || title.length == 0 || !this.visuals.title_text.doit) {
      return
    }

    /*
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
    */
  }

  protected _draw_legend_items(_ctx: Context2d): void {
    //const {is_active, has_item_background} = this
    /*
    const {left, top} = this.bbox
    ctx.translate(left, top)
    ctx.translate(this.grid.bbox.left, this.grid.bbox.top)

    for (const [{layout: entry, row, col}, i] of enumerate(this.items)) {
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
    */
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
    label_height: p.Property<number>
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
      glyph_width:      [ Float, 20 ],
      glyph_height:     [ Float, 20 ],
      label_width:      [ Float, 20 ], // TODO deprecate
      label_height:     [ Float, 20 ], // TODO deprecate
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
