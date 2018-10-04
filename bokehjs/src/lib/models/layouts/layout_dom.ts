import {Model} from "../../model"
import {SizingMode} from "core/enums"
import {empty, margin, padding} from "core/dom"
import * as p from "core/properties"
import {LayoutCanvas} from "core/layout/layout_canvas"
import {Solver, GE, EQ, Strength, Variable, Constraint} from "core/layout/solver"

import {build_views} from "core/build_views"
import {DOMView} from "core/dom_view"

export type Layoutable = LayoutCanvas | LayoutDOM

export abstract class LayoutDOMView extends DOMView implements EventListenerObject {
  model: LayoutDOM

  protected _solver: Solver

  protected _solver_inited: boolean = false
  protected _idle_notified: boolean = false

  protected _root_width: Variable
  protected _root_height: Variable

  child_views: {[key: string]: LayoutDOMView}

  initialize(options: any): void {
    super.initialize(options)

    // this is a root view
    if (this.is_root)
      this._solver = new Solver()

    this.child_views = {}
    this.build_child_views()
  }

  remove(): void {
    for (const model_id in this.child_views) {
      const view = this.child_views[model_id]
      view.remove()
    }
    this.child_views = {}

    // remove on_resize

    super.remove()
  }

  has_finished(): boolean {
    if (!super.has_finished())
      return false

    for (const model_id in this.child_views) {
      const child = this.child_views[model_id]
      if (!child.has_finished())
        return false
    }

    return true
  }

  notify_finished(): void {
    if (!this.is_root)
      super.notify_finished()
    else {
      if (!this._idle_notified && this.has_finished()) {
        if (this.model.document != null) {
          this._idle_notified = true
          this.model.document.notify_idle(this.model)
        }
      }
    }
  }

  protected _calc_width_height(): [number | null, number | null] {
    let measuring: HTMLElement | null = this.el

    while (measuring = measuring.parentElement) {
      // .bk-root element doesn't bring any value
      if (measuring.classList.contains("bk-root"))
        continue

      // we reached <body> element, so use viewport size
      if (measuring == document.body) {
        const {left, right, top, bottom} = margin(document.body)
        const width  = document.documentElement.clientWidth  - left - right
        const height = document.documentElement.clientHeight - top  - bottom
        return [width, height]
      }

      // stop on first element with sensible dimensions
      const {left, right, top, bottom} = padding(measuring)
      const {width, height} = measuring.getBoundingClientRect()

      const inner_width = width - left - right
      const inner_height = height - top - bottom

      switch (this.model.sizing_mode) {
        case "scale_width": {
          if (inner_width > 0)
            return [inner_width, inner_height > 0 ? inner_height : null]
          break
        }
        case "scale_height": {
          if (inner_height > 0)
            return [inner_width > 0 ? inner_width : null, inner_height]
          break
        }
        case "scale_both":
        case "stretch_both": {
          if (inner_width > 0 || inner_height > 0)
            return [inner_width > 0 ? inner_width : null, inner_height > 0 ? inner_height : null]
          break
        }
        default:
          throw new Error("unreachable")
      }
    }

    // this element is detached from DOM
    return [null, null]
  }

  protected _init_solver(): void {
    this._root_width = new Variable(`${this.toString()}.root_width`)
    this._root_height = new Variable(`${this.toString()}.root_height`)

    // XXX: this relies on the fact that missing `strength` argument results
    // in strength being NaN, which behaves like `Strength.required`. However,
    // this is banned by the API.
    this._solver.add_edit_variable(this._root_width, NaN)
    this._solver.add_edit_variable(this._root_height, NaN)

    const editables = this.model.get_all_editables()
    for (const edit_variable of editables)
      this._solver.add_edit_variable(edit_variable, Strength.strong)

    const constraints = this.model.get_all_constraints()
    for (const constraint of constraints)
      this._solver.add_constraint(constraint)

    const variables = this.model.get_constrained_variables()
    if (variables.width != null)
      this._solver.add_constraint(EQ(variables.width, this._root_width))
    if (variables.height != null)
      this._solver.add_constraint(EQ(variables.height, this._root_height))

    this._solver.update_variables()
    this._solver_inited = true
  }

  _suggest_dims(width: number | null, height: number | null): void {
    const variables = this.model.get_constrained_variables()

    if (variables.width != null || variables.height != null) {
      if (width == null || height == null)
        [width, height] = this._calc_width_height()

      if (variables.width != null && width != null)
        this._solver.suggest_value(this._root_width, width)
      if (variables.height != null && height != null)
        this._solver.suggest_value(this._root_height, height)

      this._solver.update_variables()
    }
  }

  resize(width: number | null = null, height: number | null = null): void {
    if (!this.is_root)
      (this.root as LayoutDOMView).resize(width, height)
    else
      this._do_layout(false, width, height)
  }

  partial_layout(): void {
    if (!this.is_root)
      (this.root as LayoutDOMView).partial_layout()
    else
      this._do_layout(false)
  }

  layout(): void {
    if (!this.is_root)
      (this.root as LayoutDOMView).layout()
    else
      this._do_layout(true)
  }

  protected _do_layout(full: boolean, width: number | null = null, height: number | null = null): void {
    if (!this._solver_inited || full) {
      this._solver.clear()
      this._init_solver()
    }

    this._suggest_dims(width, height)

    // XXX: do layout twice, because there are interdependencies between views,
    // which currently cannot be resolved with one pass. The third one triggers
    // rendering and (expensive) painting.
    this._layout()     // layout (1)
    this._layout()     // layout (2)
    this._layout(true) // render & paint

    this.notify_finished()
  }

  protected _layout(final: boolean = false): void {
    for (const child of this.model.get_layoutable_children()) {
      const child_view = this.child_views[child.id]
      if (child_view._layout != null)
        child_view._layout(final)
    }

    this.render()

    if (final)
      this._has_finished = true
  }

  rebuild_child_views(): void {
    this.solver.clear()
    this.build_child_views()
    this.layout()
  }

  build_child_views(): void {
    const children = this.model.get_layoutable_children()
    build_views(this.child_views, children, {parent: this})

    empty(this.el)

    for (const child of children) {
      // Look-up the child_view in this.child_views and then append We can't just
      // read from this.child_views because then we don't get guaranteed ordering.
      // Which is a problem in non-box layouts.
      const child_view = this.child_views[child.id]
      this.el.appendChild(child_view.el)
    }
  }

  connect_signals(): void {
    super.connect_signals()

    if (this.is_root)
      window.addEventListener("resize", this)

    // XXX: this.connect(this.model.change, () => this.layout())
    this.connect(this.model.properties.sizing_mode.change, () => this.layout())
  }

  handleEvent(): void {
    this.resize()
  }

  disconnect_signals(): void {
    window.removeEventListener("resize", this)
    super.disconnect_signals()
  }

  _render_classes(): void {
    this.el.className = "" // removes all classes

    for (const name of this.css_classes())
      this.el.classList.add(name)

    this.el.classList.add(`bk-layout-${this.model.sizing_mode}`)

    for (const cls of this.model.css_classes)
      this.el.classList.add(cls)
  }

  render(): void {
    this._render_classes()

    switch (this.model.sizing_mode) {
      case "fixed": {
        // If the width or height is unset:
        // - compute it from children
        // - but then save for future use
        // (for some reason widget boxes keep shrinking if you keep computing
        // but this is more efficient and appropriate for fixed anyway).
        let width: number
        if (this.model.width != null)
          width = this.model.width
        else
          width = this.get_width()
          this.model.setv({width: width}, {silent: true})

        let height: number
        if (this.model.height != null)
          height = this.model.height
        else
          height = this.get_height()
          this.model.setv({height: height}, {silent: true})

        this.solver.suggest_value(this.model._width, width)
        this.solver.suggest_value(this.model._height, height)
        break
      }
      case "scale_width": {
        const height = this.get_height()
        this.solver.suggest_value(this.model._height, height)
        break
      }
      case "scale_height": {
        const width = this.get_width()
        this.solver.suggest_value(this.model._width, width)
        break
      }
      case "scale_both": {
        const [width, height] = this.get_width_height()
        this.solver.suggest_value(this.model._width, width)
        this.solver.suggest_value(this.model._height, height)
        break
      }
    }

    this.solver.update_variables()
    this.position()
  }

  position(): void {
    switch (this.model.sizing_mode) {
      case "fixed":
      case "scale_width":
      case "scale_height": {
        this.el.style.position = "relative"
        this.el.style.left = ""
        this.el.style.top = ""
        break
      }
      case "scale_both":
      case "stretch_both": {
        this.el.style.position = "absolute"
        this.el.style.left = `${this.model._dom_left.value}px`
        this.el.style.top = `${this.model._dom_top.value}px`
        break
      }
    }

    this.el.style.width = `${this.model._width.value}px`
    this.el.style.height = `${this.model._height.value}px`
  }

  // Subclasses should implement this to explain
  // what their height should be in sizing_mode mode.
  abstract get_height(): number

  // Subclasses should implement this to explain
  // what their width should be in sizing_mode mode.
  abstract get_width(): number

  get_width_height(): [number, number] {
    /**
     * Fit into enclosing DOM and preserve original aspect.
     */
    const [parent_width, parent_height] = this._calc_width_height()

    if (parent_width == null && parent_height == null)
      throw new Error("detached element")

    const ar = this.model.get_aspect_ratio()

    if (parent_width != null && parent_height == null)
      return [parent_width, parent_width / ar]

    if (parent_width == null && parent_height != null)
      return [parent_height * ar, parent_height]

    const new_width_1 = parent_width!
    const new_height_1 = parent_width! / ar

    const new_width_2 = parent_height! * ar
    const new_height_2 = parent_height!

    let width: number
    let height: number

    if (new_width_1 < new_width_2) {
      width = new_width_1
      height = new_height_1
    } else {
      width = new_width_2
      height = new_height_2
    }

    return [width, height]
  }
}

export namespace LayoutDOM {
  export interface Attrs extends Model.Attrs {
    height: number
    width: number
    disabled: boolean
    sizing_mode: SizingMode
    css_classes: string[]
  }

  export interface Props extends Model.Props {
    height: p.Property<number>
    width: p.Property<number>
    disabled: p.Property<boolean>
    sizing_mode: p.Property<SizingMode>
    css_classes: p.Property<string[]>
  }
}

export interface LayoutDOM extends LayoutDOM.Attrs {}

export abstract class LayoutDOM extends Model {

  properties: LayoutDOM.Props

  constructor(attrs?: Partial<LayoutDOM.Attrs>) {
    super(attrs)
  }

  static initClass(): void {
    this.prototype.type = "LayoutDOM"

    this.define({
      height:      [ p.Number              ],
      width:       [ p.Number              ],
      disabled:    [ p.Bool,       false   ],
      sizing_mode: [ p.SizingMode, "fixed" ],
      css_classes: [ p.Array,      []      ],
    })
  }

  _width: Variable
  _height: Variable
  // These are the COORDINATES of the four plot sides
  _left: Variable
  _right: Variable
  _top: Variable
  _bottom: Variable
  // This is the dom position
  _dom_top: Variable
  _dom_left: Variable
  // This is the distance from the side of the right and bottom,
  _width_minus_right: Variable
  _height_minus_bottom: Variable
  // Whitespace variables
  _whitespace_top: Variable
  _whitespace_bottom: Variable
  _whitespace_left: Variable
  _whitespace_right: Variable

  initialize(): void {
    super.initialize()
    this._width = new Variable(`${this.toString()}.width`)
    this._height = new Variable(`${this.toString()}.height`)
    this._left = new Variable(`${this.toString()}.left`)
    this._right = new Variable(`${this.toString()}.right`)
    this._top = new Variable(`${this.toString()}.top`)
    this._bottom = new Variable(`${this.toString()}.bottom`)
    this._dom_top = new Variable(`${this.toString()}.dom_top`)
    this._dom_left = new Variable(`${this.toString()}.dom_left`)
    this._width_minus_right = new Variable(`${this.toString()}.width_minus_right`)
    this._height_minus_bottom = new Variable(`${this.toString()}.height_minus_bottom`)
    this._whitespace_top = new Variable(`${this.toString()}.whitespace_top`)
    this._whitespace_bottom = new Variable(`${this.toString()}.whitespace_bottom`)
    this._whitespace_left = new Variable(`${this.toString()}.whitespace_left`)
    this._whitespace_right = new Variable(`${this.toString()}.whitespace_right`)
  }

  get layout_bbox(): {[key: string]: number} {
    return {
      top: this._top.value,
      left: this._left.value,
      width: this._width.value,
      height: this._height.value,
      right: this._right.value,
      bottom: this._bottom.value,
      dom_top: this._dom_top.value,
      dom_left: this._dom_left.value,
    }
  }

  dump_layout(): void {
    const layoutables: {[key: string]: {[key: string]: number}} = {}
    const pending: Layoutable[] = [this]

    let obj: Layoutable | undefined
    while (obj = pending.shift()) {
      pending.push(...obj.get_layoutable_children())
      layoutables[obj.toString()] = obj.layout_bbox
    }

    console.table(layoutables)
  }

  get_all_constraints(): Constraint[] {
    let constraints = this.get_constraints()

    for (const child of this.get_layoutable_children()) {
      if (child instanceof LayoutCanvas)
        constraints = constraints.concat(child.get_constraints())
      else
        constraints = constraints.concat(child.get_all_constraints())
    }

    return constraints
  }

  get_all_editables(): Variable[] {
    let editables = this.get_editables()

    for (const child of this.get_layoutable_children()) {
      if (child instanceof LayoutCanvas)
        editables = editables.concat(child.get_editables())
      else
        editables = editables.concat(child.get_all_editables())
    }

    return editables
  }

  get_constraints(): Constraint[] {
    return [
      // Make sure things dont squeeze out of their bounding box
      GE(this._dom_left),
      GE(this._dom_top),

      // Plot has to be inside the width/height
      GE(this._left),
      GE(this._width, [-1, this._right]),
      GE(this._top),
      GE(this._height, [-1, this._bottom]),

      // Declare computed constraints
      EQ(this._width_minus_right, [-1, this._width], this._right),
      EQ(this._height_minus_bottom, [-1, this._height], this._bottom),
    ]
  }

  get_layoutable_children(): LayoutDOM[] {
    return []
  }

  get_editables(): Variable[] {
    switch (this.sizing_mode) {
      case "fixed":
        return [this._height, this._width]
      case "scale_width":
        return [this._height]
      case "scale_height":
        return [this._width]
      case "scale_both":
        return [this._width, this._height]
      default:
        return []
    }
  }

  get_constrained_variables(): {[key: string]: Variable} {
    /*
     * THE FOLLOWING ARE OPTIONAL VARS THAT
     * YOU COULD ADD INTO SUBCLASSES
     *
     *  # When this widget is on the edge of a box visually,
     *  # align these variables down that edge. Right/bottom
     *  # are an inset from the edge.
     *  on_edge_align_top    : this._top
     *  on_edge_align_bottom : this._height_minus_bottom
     *  on_edge_align_left   : this._left
     *  on_edge_align_right  : this._width_minus_right
     *  # When this widget is in a box cell with the same "arity
     *  # path" as a widget in another cell, align these variables
     *  # between the two box cells. Right/bottom are an inset from
     *  # the edge.
     *  box_cell_align_top   : this._top
     *  box_cell_align_bottom: this._height_minus_bottom
     *  box_cell_align_left  : this._left
     *  box_cell_align_right : this._width_minus_right
     *  # When this widget is in a box, make these the same distance
     *  # apart in every widget. Right/bottom are inset from the edge.
     *  box_equal_size_top   : this._top
     *  box_equal_size_bottom: this._height_minus_bottom
     *  box_equal_size_left  : this._left
     *  box_equal_size_right : this._width_minus_right
     */

    const vars: {[key: string]: Variable} = {
      origin_x          : this._dom_left,
      origin_y          : this._dom_top,
      whitespace_top    : this._whitespace_top,
      whitespace_bottom : this._whitespace_bottom,
      whitespace_left   : this._whitespace_left,
      whitespace_right  : this._whitespace_right,
    }

    switch (this.sizing_mode) {
      case "stretch_both":
        vars.width  = this._width
        vars.height = this._height
        break
      case "scale_width":
        vars.width  = this._width
        break
      case "scale_height":
        vars.height = this._height
        break
    }

    return vars
  }

  get_aspect_ratio(): number {
    return this.width / this.height
  }
}

LayoutDOM.initClass()
