import {LayoutDOM, LayoutDOMView, FullDisplay} from "../layouts/layout_dom"
import {GridBox, GridBoxView} from "../layouts/grid_box"
import {TracksSizing} from "../layouts/css_grid_box"
import {Toolbar, ToolbarView} from "../tools/toolbar"
import {UIElement} from "../ui/ui_element"
import {ActionTool} from "../tools/actions/action_tool"
import {CanvasLayer} from "core/util/canvas"
import {build_views, remove_views, ViewStorage} from "core/build_views"
import {Location} from "core/enums"
import * as p from "core/properties"

export class GridPlotView extends LayoutDOMView {
  override model: GridPlot

  protected _grid_box: GridBox

  get toolbar_view(): ToolbarView {
    return this.child_views.find((v) => v.model == this.model.toolbar) as ToolbarView
  }

  get grid_box_view(): GridBoxView {
    return this.child_views.find((v) => v.model == this._grid_box) as GridBoxView
  }

  protected _update_location(): void {
    const location = this.model.toolbar_location
    if (location == null)
      this.model.toolbar.visible = false
    else
      this.model.toolbar.setv({visible: true, location})
  }

  override initialize(): void {
    super.initialize()
    this._update_location()

    const {children, rows, cols, spacing} = this.model
    this._grid_box = new GridBox({children, rows, cols, spacing})
  }

  override async lazy_initialize(): Promise<void> {
    await super.lazy_initialize()
    await this.build_tool_views()
  }

  override connect_signals(): void {
    super.connect_signals()

    const {toolbar, toolbar_location, children, rows, cols, spacing} = this.model.properties
    this.on_change(toolbar_location, () => {
      this._update_location()
      this.rebuild()
    })
    this.on_change([toolbar, children, rows, cols, spacing], () => {
      this.rebuild()
    })

    this.on_change(this.model.toolbar.properties.tools, async () => {
      await this.build_tool_views()
    })

    this.mouseenter.connect(() => {
      this.toolbar_view.set_visibility(true)
    })
    this.mouseleave.connect(() => {
      this.toolbar_view.set_visibility(false)
    })
  }

  override remove(): void {
    remove_views(this._tool_views)
    super.remove()
  }

  private _tool_views: ViewStorage<ActionTool> = new Map()

  async build_tool_views(): Promise<void> {
    const tools = this.model.toolbar.tools.filter((tool): tool is ActionTool => tool instanceof ActionTool)
    await build_views(this._tool_views, tools, {parent: this})
  }

  get child_models(): UIElement[] {
    return [this.model.toolbar, this._grid_box]
  }

  protected override _intrinsic_display(): FullDisplay {
    return {inner: this.model.flow_mode, outer: "flex"}
  }

  override _update_layout(): void {
    super._update_layout()

    const {location} = this.model.toolbar
    const flex_direction = (() => {
      switch (location) {
        case "above": return "column"
        case "below": return "column-reverse"
        case "left":  return "row"
        case "right": return "row-reverse"
      }
    })()
    this.style.append(":host", {flex_direction})
  }

  override export(type: "auto" | "png" | "svg" = "auto", hidpi: boolean = true): CanvasLayer {
    const output_backend = (() => {
      switch (type) {
        case "auto": // TODO: actually infer the best type
        case "png": return "canvas"
        case "svg": return "svg"
      }
    })()

    const composite = new CanvasLayer(output_backend, hidpi)

    const {x, y, width, height} = this.grid_box_view.bbox.relative()
    composite.resize(width, height)
    composite.ctx.save()

    const bg_color = getComputedStyle(this.el).backgroundColor
    composite.ctx.fillStyle = bg_color
    composite.ctx.fillRect(x, y, width, height)

    for (const view of this.child_views) {
      const region = view.export(type, hidpi)
      const {x, y} = view.bbox
      composite.ctx.drawImage(region.canvas, x, y)
    }

    composite.ctx.restore()
    return composite
  }
}

export namespace GridPlot {
  export type Attrs = p.AttrsOf<Props>

  export type Props = LayoutDOM.Props & {
    toolbar: p.Property<Toolbar>
    toolbar_location: p.Property<Location | null>
    children: p.Property<[LayoutDOM, number, number, number?, number?][]>
    rows: p.Property<TracksSizing | null>
    cols: p.Property<TracksSizing | null>
    spacing: p.Property<number | [number, number]>
  }
}

export interface GridPlot extends GridPlot.Attrs {}

export class GridPlot extends LayoutDOM {
  override properties: GridPlot.Props
  override __view_type__: GridPlotView

  constructor(attrs?: Partial<GridPlot.Attrs>) {
    super(attrs)
  }

  static {
    this.prototype.default_view = GridPlotView

    this.define<GridPlot.Props>(({Int, Number, Tuple, Array, Ref, Or, Opt, Nullable}) => ({
      toolbar: [ Ref(Toolbar), () => new Toolbar() ],
      toolbar_location: [ Nullable(Location), "above" ],
      children: [ Array(Tuple(Ref(LayoutDOM), Int, Int, Opt(Int), Opt(Int))), [] ],
      rows: [ Nullable(TracksSizing), null ],
      cols: [ Nullable(TracksSizing), null ],
      spacing: [ Or(Number, Tuple(Number, Number)), 0 ],
    }))
  }
}
