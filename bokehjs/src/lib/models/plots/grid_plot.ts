import type {FullDisplay} from "../layouts/layout_dom"
import {LayoutDOM, LayoutDOMView} from "../layouts/layout_dom"
import {UIElement} from "../ui/ui_element"
import type {GridBoxView} from "../layouts/grid_box"
import {GridBox} from "../layouts/grid_box"
import {TracksSizing, GridChild, GridSpacing} from "../common/kinds"
import type {ToolbarView} from "../tools/toolbar"
import {Toolbar} from "../tools/toolbar"
import {ActionTool} from "../tools/actions/action_tool"
import type {ViewStorage, IterViews} from "core/build_views"
import {build_views, remove_views} from "core/build_views"
import {Location} from "core/enums"
import type * as p from "core/properties"

export class GridPlotView extends LayoutDOMView {
  declare model: GridPlot

  protected _grid_box: GridBox

  get toolbar_view(): ToolbarView {
    return this.child_views.find((v) => v.model == this.model.toolbar) as ToolbarView
  }

  get grid_box_view(): GridBoxView {
    return this.child_views.find((v) => v.model == this._grid_box) as GridBoxView
  }

  protected _update_location(): void {
    const location = this.model.toolbar_location
    if (location == null) {
      this.model.toolbar.visible = false
    } else {
      this.model.toolbar.setv<Toolbar.Attrs>({visible: true, location})
    }
  }

  override initialize(): void {
    super.initialize()
    this._update_location()

    const {children, rows, cols, spacing} = this.model
    this._grid_box = new GridBox({children, rows, cols, spacing, sizing_mode: "inherit"})
  }

  override async lazy_initialize(): Promise<void> {
    await super.lazy_initialize()
    await this.build_tool_views()
  }

  override connect_signals(): void {
    super.connect_signals()

    const {toolbar, toolbar_location, children, rows, cols, spacing} = this.model.properties
    this.on_change(toolbar_location, async () => {
      this._update_location()
      this.invalidate_layout()
    })
    this.on_change(toolbar, async () => {
      await this.update_children()
    })

    this.on_change([children, rows, cols, spacing], async () => {
      const {children, rows, cols, spacing} = this.model
      this._grid_box.setv<GridBox.Attrs>({children, rows, cols, spacing})
      await this.grid_box_view.ready
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

  private readonly _tool_views: ViewStorage<ActionTool> = new Map()

  async build_tool_views(): Promise<void> {
    const tools = this.model.toolbar.tools.filter((tool) => tool instanceof ActionTool)
    await build_views(this._tool_views, tools, {parent: this})
  }

  override *children(): IterViews {
    yield* super.children()
    yield* this._tool_views.values()
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
}

export namespace GridPlot {
  export type Attrs = p.AttrsOf<Props>

  export type Props = LayoutDOM.Props & {
    toolbar: p.Property<Toolbar>
    toolbar_location: p.Property<Location | null>
    children: p.Property<[UIElement, number, number, number?, number?][]>
    rows: p.Property<TracksSizing | null>
    cols: p.Property<TracksSizing | null>
    spacing: p.Property<number | [number, number]>
  }
}

export interface GridPlot extends GridPlot.Attrs {}

export class GridPlot extends LayoutDOM {
  declare properties: GridPlot.Props
  declare __view_type__: GridPlotView

  constructor(attrs?: Partial<GridPlot.Attrs>) {
    super(attrs)
  }

  static {
    this.prototype.default_view = GridPlotView

    this.define<GridPlot.Props>(({List, Ref, Nullable}) => ({
      toolbar: [ Ref(Toolbar), () => new Toolbar() ],
      toolbar_location: [ Nullable(Location), "above" ],
      children: [ List(GridChild(UIElement)), [] ],
      rows: [ Nullable(TracksSizing), null ],
      cols: [ Nullable(TracksSizing), null ],
      spacing: [ GridSpacing, 0 ],
    }))
  }
}
