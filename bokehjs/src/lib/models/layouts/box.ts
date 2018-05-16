import {EQ, GE, WEAK_EQ, Constraint, Variable} from "core/layout/solver"
import * as p from "core/properties"
import {max, sum, includes} from "core/util/array"

import {LayoutDOM, LayoutDOMView} from "./layout_dom"

export interface Rect {
  x: Variable,
  y: Variable,
  width: Variable,
  height: Variable,
}

export interface Span {
  start: Variable,
  size: Variable,
}

export interface Info {
  span: Span,
  whitespace: {
    before: Variable,
    after: Variable,
  },
}

export class BoxView extends LayoutDOMView {
  model: Box

  connect_signals(): void {
    super.connect_signals()
    this.connect(this.model.properties.children.change, () => this.rebuild_child_views())
  }

  css_classes(): string[] {
    return super.css_classes().concat("bk-grid")
  }

  get_height(): number {
    const children = this.model.get_layoutable_children()
    const child_heights = children.map((child) => child._height.value)
    let height: number
    if (this.model._horizontal)
      height = max(child_heights)
    else
      height = sum(child_heights)
    return height
  }

  get_width(): number {
    const children = this.model.get_layoutable_children()
    const child_widths = children.map((child) => child._width.value)
    let width: number
    if (this.model._horizontal)
      width = sum(child_widths)
    else
      width = max(child_widths)
    return width
  }
}

export namespace Box {
  export interface Attrs extends LayoutDOM.Attrs {
    children: LayoutDOM[]
    spacing: number
  }

  export interface Props extends LayoutDOM.Props {
    children: p.Property<LayoutDOM[]>
    spacing: p.Property<number>
  }
}

export interface Box extends Box.Attrs {}

export class Box extends LayoutDOM {

  properties: Box.Props

  constructor(attrs?: Partial<Box.Attrs>) {
    super(attrs)
  }

  static initClass(): void {
    this.prototype.type = "Box"
    this.prototype.default_view = BoxView

    this.define({
      children: [ p.Array, [] ],
    })

    this.internal({
      spacing: [ p.Number, 6 ],
    })
  }

  _horizontal: boolean

  // for children that want to be the same size
  // as other children, make them all equal to these
  protected _child_equal_size_width: Variable
  protected _child_equal_size_height: Variable

  // these are passed up to our parent after basing
  // them on the child box_equal_size vars
  protected _box_equal_size_top: Variable
  protected _box_equal_size_bottom: Variable
  protected _box_equal_size_left: Variable
  protected _box_equal_size_right: Variable

  // these are passed up to our parent after basing
  // them on the child box_cell_align vars
  protected _box_cell_align_top: Variable
  protected _box_cell_align_bottom: Variable
  protected _box_cell_align_left: Variable
  protected _box_cell_align_right: Variable

  initialize(): void {
    super.initialize()

    this._child_equal_size_width = new Variable(`${this.toString()}.child_equal_size_width`)
    this._child_equal_size_height = new Variable(`${this.toString()}.child_equal_size_height`)

    this._box_equal_size_top = new Variable(`${this.toString()}.box_equal_size_top`)
    this._box_equal_size_bottom = new Variable(`${this.toString()}.box_equal_size_bottom`)
    this._box_equal_size_left = new Variable(`${this.toString()}.box_equal_size_left`)
    this._box_equal_size_right = new Variable(`${this.toString()}.box_equal_size_right`)

    this._box_cell_align_top = new Variable(`${this.toString()}.box_cell_align_top`)
    this._box_cell_align_bottom = new Variable(`${this.toString()}.box_cell_align_bottom`)
    this._box_cell_align_left = new Variable(`${this.toString()}.box_cell_align_left`)
    this._box_cell_align_right = new Variable(`${this.toString()}.box_cell_align_right`)
  }

  get_layoutable_children(): LayoutDOM[] {
    return this.children
  }

  get_constrained_variables(): {[key: string]: Variable} {
    return {
      ...super.get_constrained_variables(),

      box_equal_size_top   : this._box_equal_size_top,
      box_equal_size_bottom: this._box_equal_size_bottom,
      box_equal_size_left  : this._box_equal_size_left,
      box_equal_size_right : this._box_equal_size_right,

      box_cell_align_top   : this._box_cell_align_top,
      box_cell_align_bottom: this._box_cell_align_bottom,
      box_cell_align_left  : this._box_cell_align_left,
      box_cell_align_right : this._box_cell_align_right,
    }
  }

  get_constraints(): Constraint[] {
    let constraints = super.get_constraints()

    const add = (...new_constraints: Constraint[]): void => {
      constraints.push(...new_constraints)
    }

    const children = this.get_layoutable_children()
    if (children.length == 0)
      // No need to continue further if there are no children. Children sure do
      // make life a lot more complicated.
      return constraints

    for (const child of children) {
      const vars = child.get_constrained_variables()

      // Make total widget sizes fill the orthogonal direction
      // TODO(bird) Can't we make this shorter by using span which has already picked a
      // dominant direction (we'd just also need to set a doc_span)
      const rect = this._child_rect(vars)
      if (this._horizontal) {
        if (vars.height != null)
          add(EQ(rect.height, [-1, this._height]))
      } else {
        if (vars.width != null)
          add(EQ(rect.width, [-1, this._width]))
      }

      // Add equal_size constraint
      // - A child's "interesting area" (like the plot area) is the same size as the previous child
      //   (a child can opt out of this by not returning the box_equal_size variables)
      if (this._horizontal) {
        if (vars.box_equal_size_left != null && vars.box_equal_size_right != null && vars.width != null)
          add(EQ([-1, vars.box_equal_size_left], [-1, vars.box_equal_size_right], vars.width, this._child_equal_size_width))
      } else {
        if (vars.box_equal_size_top != null && vars.box_equal_size_bottom != null && vars.height != null)
          add(EQ([-1, vars.box_equal_size_top], [-1, vars.box_equal_size_bottom], vars.height, this._child_equal_size_height))
      }
    }

    // TODO(bird) - This is the second time we loop through children
    let last = this._info(children[0].get_constrained_variables())
    add(EQ(last.span.start, 0))
    for (let i = 1; i < children.length; i++) {
      const next = this._info(children[i].get_constrained_variables())

      // Each child's start equals the previous child's end (unless we have a fixed layout
      // in which case size may not be available)
      if (last.span.size)
        add(EQ(last.span.start, last.span.size, [-1, next.span.start]))

      // The whitespace at end of one child + start of next must equal the box spacing.
      // This must be a weak constraint because it can conflict with aligning the
      // alignable edges in each child. Alignment is generally more important visually than spacing.
      add(WEAK_EQ(last.whitespace.after, next.whitespace.before, 0 - this.spacing))

      // If we can't satisfy the whitespace being equal to box spacing, we should fix
      // it (align things) by increasing rather than decreasing the whitespace.
      add(GE(last.whitespace.after, next.whitespace.before, 0 - this.spacing))
      last = next
    }

    // Child's side has to stick to the end of the box
    const vars = children[children.length-1].get_constrained_variables()
    if (this._horizontal) {
      if (vars.width != null)
        add(EQ(last.span.start, last.span.size, [-1, this._width]))
    } else {
      if (vars.height != null)
        add(EQ(last.span.start, last.span.size, [-1, this._height]))
    }

    constraints = constraints.concat(
      // align outermost edges in both dimensions
      this._align_outer_edges_constraints(true), // horizontal=true
      this._align_outer_edges_constraints(false),

      // line up edges in same_arity boxes
      this._align_inner_cell_edges_constraints(),

      // build our equal_size bounds from the child ones
      this._box_equal_size_bounds(true), // horizontal=true
      this._box_equal_size_bounds(false),

      // propagate cell alignment (between same_arity boxes) up the hierarchy
      this._box_cell_align_bounds(true), // horizontal=true
      this._box_cell_align_bounds(false),

      // build our whitespace from the child ones
      this._box_whitespace(true), // horizontal=true
      this._box_whitespace(false))

    return constraints
  }

  protected _child_rect(vars: {[key: string]: Variable}): Rect {
    return {
      x: vars.origin_x,
      y: vars.origin_y,
      width: vars.width,
      height: vars.height,
    }
  }

  protected _span(rect: Rect): Span {
    // return [coordinate, size] pair in box_aligned direction
    if (this._horizontal)
      return {start: rect.x, size: rect.width}
    else
      return {start: rect.y, size: rect.height}
  }

  protected _info(vars: {[key: string]: Variable}): Info {
    let whitespace: {before: Variable, after: Variable}
    if (this._horizontal)
      whitespace = {before: vars.whitespace_left, after: vars.whitespace_right}
    else
      whitespace = {before: vars.whitespace_top, after: vars.whitespace_bottom}
    const span = this._span(this._child_rect(vars))
    return {span: span, whitespace: whitespace}
  }

  protected _flatten_cell_edge_variables(horizontal: boolean): {[key: string]: Variable[]} {
    /*
     * All alignment happens in terms of the
     * box_cell_align_{left,right,top,bottom} variables. We add
     * "path" information to variables so we know which ones align,
     * where the "path" includes the box arity and box cell we went
     * through.
     *
     * If we have a row of three plots, we should align the top and
     * bottom variables between the three plots.
     *
     * The flattened dictionary in this case (for the top and left
     * only) should be:
     *
     *   box_cell_align_top : [ 3 vars ]
     *   box_cell_align_bottom : [ 3 vars ]
     *
     * We don't do left/right starting from a row, and left/right
     * edges have nothing to align with here.
     *
     * Now say we have a row of three columns, each with three
     * plots (3x3 = 9). We should align the top/bottom variables
     * across the top three, middle three, and bottom three plots,
     * as if those groupings were rows. We do this by flattening
     * starting from the row first, which gets us a dictionary only
     * of top/bottom variables.
     *
     *   box_cell_align_top col-3-0- : [ 3 plots from top of columns ]
     *   box_cell_align_top col-3-1- : [ 3 plots from middle of columns ]
     *   box_cell_align_top col-3-2- : [ 3 plots from bottom of columns ]
     *
     * "col-3-1-" = 3-cell column, cell index 1.
     *
     * In three later, separate calls to
     * _align_inner_cell_edges_constraints() on each column, we'll
     * get the left/right variables:
     *
     *   box_cell_align_left : [ 3 left-column plots ]
     *   box_cell_align_left : [ 3 middle-column plots ]
     *   box_cell_align_left : [ 3 right-column plots ]
     *
     * Now add another nesting - we have a row of three columns,
     * each with three rows, each with three plots. This is
     * arranged 3x9 = 27.
     *
     *   box_cell_align_top col-3-0- : [ 9 plots from top rows of columns ]
     *   box_cell_align_top col-3-1- : [ 9 plots from middle rows of columns ]
     *   box_cell_align_top col-3-2- : [ 9 plots from bottom rows of columns ]
     *
     * When we make the _align_inner_cell_edges_constraints() calls on each of the three
     * columns, each column will return row-pathed values
     *
     *   box_cell_align_left row-3-0-: [  3 plots in left column of left column ]
     *   box_cell_align_left row-3-1-: [  3 plots in middle column of left column ]
     *   box_cell_align_left row-3-2-: [  3 plots in right column of left column ]
     *   ... same for the middle and right columns
     *
     * Anyway in essence what we do is that we add only rows to the
     * path to left/right variables, and only columns to the path
     * to top/bottom variables.
     *
     * If we nest yet another level we would finally get paths with
     * multiple rows or multiple columns in them.
     */

    let relevant_edges: string[]
    if (horizontal)
      relevant_edges = Box._top_bottom_inner_cell_edge_variables
    else
      relevant_edges = Box._left_right_inner_cell_edge_variables

    const add_path = horizontal != this._horizontal

    const children = this.get_layoutable_children()
    const arity = children.length
    const flattened: {[key: string]: Variable[]} = {}
    let cell = 0
    for (const child of children) {
      let cell_vars: {[key: string]: Variable[]}
      if (child instanceof Box)
        cell_vars = child._flatten_cell_edge_variables(horizontal)
      else
        cell_vars = {}

      const all_vars = child.get_constrained_variables()
      for (const name of relevant_edges) {
        if (name in all_vars)
          cell_vars[name] = [all_vars[name]]
      }

      for (const key in cell_vars) {
        const variables = cell_vars[key]
        let new_key: string
        if (add_path) {
          const parsed = key.split(" ")
          const kind = parsed[0]
          const path = parsed.length > 1 ? parsed[1] : ""
          const direction = this._horizontal ?  "row" : "col"
          // TODO should we "ignore" arity-1 boxes potentially by not adding a path suffix?
          new_key = `${kind} ${direction}-${arity}-${cell}-${path}`
        } else
          new_key = key
        if (new_key in flattened)
          flattened[new_key] = flattened[new_key].concat(variables)
        else
          flattened[new_key] = variables
      }

      cell++
    }
    return flattened
  }

  // This should only be called on the toplevel box (twice,
  // once with horizontal=true and once with horizontal=false)
  protected _align_inner_cell_edges_constraints(): Constraint[] {
    const constraints: Constraint[] = []

    // XXX: checking for `this.document?` is a temporary hack, because document isn't always
    // attached properly. However, if document is not attached then we know it can't be
    // a root, because otherwise add_root() would attach it. All this layout logic should
    // be part of views instead of models and use is_root, etc.
    if (this.document != null && includes(this.document.roots(), this)) {
      const flattened = this._flatten_cell_edge_variables(this._horizontal)

      for (const key in flattened) {
        const variables = flattened[key]

        if (variables.length > 1) {
          //console.log("constraining ", key, " ", variables)
          const last = variables[0]
          for (let i = 1; i < variables.length; i++)
            constraints.push(EQ(variables[i], [-1, last]))
        }
      }
    }

    return constraints
  }

  // returns a two-item array where each item is a list of edge
  // children from the start and end respectively
  protected _find_edge_leaves(horizontal: boolean): [LayoutDOM[], LayoutDOM[]] {
    const children = this.get_layoutable_children()

    // console.log(`  finding edge leaves in ${children.length}-${this.type}, ` +
    //  `our orientation ${this._horizontal} finding ${horizontal} children `, children)

    const leaves: [LayoutDOM[], LayoutDOM[]] = [[] , []]
    if (children.length > 0) {
      if (this._horizontal == horizontal) {
        // note start and end may be the same
        const start = children[0]
        const end = children[children.length - 1]

        if (start instanceof Box)
          leaves[0] = leaves[0].concat(start._find_edge_leaves(horizontal)[0])
        else
          leaves[0].push(start)

        if (end instanceof Box)
          leaves[1] = leaves[1].concat(end._find_edge_leaves(horizontal)[1])
        else
          leaves[1].push(end)
      } else {
        // if we are a column and someone wants the horizontal edges,
        // we return the horizontal edges from all of our children
        for (const child of children) {
          if (child instanceof Box) {
            const child_leaves = child._find_edge_leaves(horizontal)
            leaves[0] = leaves[0].concat(child_leaves[0])
            leaves[1] = leaves[1].concat(child_leaves[1])
          } else {
            leaves[0].push(child)
            leaves[1].push(child)
          }
        }
      }
    }

    // console.log("  start leaves ", leaves[0].map((leaf) -> leaf.id)
    // console.log("  end leaves ", leaves[1].map((leaf) -> leaf.id)

    return leaves
  }

  protected _align_outer_edges_constraints(horizontal: boolean): Constraint[] {
    // console.log(`${if horizontal then 'horizontal' else 'vertical'} outer edge constraints in ${this.get_layoutable_children().length}-${this.type}`)

    const [start_leaves, end_leaves] = this._find_edge_leaves(horizontal)

    let start_variable: string
    let end_variable: string
    if (horizontal) {
      start_variable = 'on_edge_align_left'
      end_variable = 'on_edge_align_right'
    } else {
      start_variable = 'on_edge_align_top'
      end_variable = 'on_edge_align_bottom'
    }

    const collect_vars = (leaves: LayoutDOM[], name: string): Variable[] => {
      //console.log(`collecting ${name} in `, leaves)
      const edges: Variable[] = []
      for (const leaf of leaves) {
        const vars = leaf.get_constrained_variables()
        if (name in vars)
          edges.push(vars[name])
          //vars[name]['_debug'] = `${name} from ${leaf.id}`
      }
      return edges
    }

    const start_edges = collect_vars(start_leaves, start_variable)
    const end_edges = collect_vars(end_leaves, end_variable)

    const result: Constraint[] = []
    const add_all_equal = (edges: Variable[]): void => {
      if (edges.length > 1) {
        const [first] = edges
        for (let i = 1; i < edges.length; i++) {
          const edge = edges[i]
          //console.log(`  constraining ${first._debug} == ${edge._debug}`)
          result.push(EQ([-1, first], edge))
        }
      }
    }

    add_all_equal(start_edges)
    add_all_equal(end_edges)

    // console.log("computed constraints ", result)

    return result
  }

  protected _box_insets_from_child_insets(horizontal: boolean,
      child_variable_prefix: string, our_variable_prefix: string, minimum: boolean): Constraint[] {
    const [start_leaves, end_leaves] = this._find_edge_leaves(horizontal)

    let start_variable: string
    let end_variable: string
    let our_start: Variable
    let our_end: Variable
    if (horizontal) {
      start_variable = `${child_variable_prefix}_left`
      end_variable = `${child_variable_prefix}_right`
      our_start = (this as any)[`${our_variable_prefix}_left`]
      our_end = (this as any)[`${our_variable_prefix}_right`]
    } else {
      start_variable = `${child_variable_prefix}_top`
      end_variable = `${child_variable_prefix}_bottom`
      our_start = (this as any)[`${our_variable_prefix}_top`]
      our_end = (this as any)[`${our_variable_prefix}_bottom`]
    }

    const result: Constraint[] = []
    const add_constraints = (ours: Variable, leaves: LayoutDOM[], name: string): void => {
      for (const leaf of leaves) {
        const vars = leaf.get_constrained_variables()
        if (name in vars) {
          if (minimum)
            result.push(GE([-1, ours], vars[name]))
          else
            result.push(EQ([-1, ours], vars[name]))
        }
      }
    }

    add_constraints(our_start, start_leaves, start_variable)
    add_constraints(our_end, end_leaves, end_variable)

    return result
  }

  protected _box_equal_size_bounds(horizontal: boolean): Constraint[] {
    // false = box bounds equal all outer child bounds exactly
    return this._box_insets_from_child_insets(horizontal, 'box_equal_size', '_box_equal_size', false)
  }

  protected _box_cell_align_bounds(horizontal: boolean): Constraint[] {
    // false = box bounds equal all outer child bounds exactly
    return this._box_insets_from_child_insets(horizontal, 'box_cell_align', '_box_cell_align', false)
  }

  protected _box_whitespace(horizontal: boolean): Constraint[] {
    // true = box whitespace must be the minimum of child
    // whitespaces (i.e. distance from box edge to the outermost
    // child pixels)
    return this._box_insets_from_child_insets(horizontal, 'whitespace', '_whitespace', true)
  }

  static _left_right_inner_cell_edge_variables = ['box_cell_align_left', 'box_cell_align_right']
  static _top_bottom_inner_cell_edge_variables = ['box_cell_align_top', 'box_cell_align_bottom' ]
}

Box.initClass()
