import {DOMNode, DOMNodeView} from "./dom_node"
import {StylesLike} from "../ui/styled_element"
import {UIElement} from "../ui/ui_element"
import type {ViewStorage, BuildResult, IterViews} from "core/build_views"
import {build_views, remove_views} from "core/build_views"
import type {RenderingTarget} from "core/dom_view"
import {isString} from "core/util/types"
import {apply_styles} from "core/css"
import {empty, bounding_box} from "core/dom"
import type {BBox} from "core/util/bbox"
import type * as p from "core/properties"

export abstract class DOMElementView extends DOMNodeView {
  declare model: DOMElement
  declare el: HTMLElement

  override get bbox(): BBox {
    return bounding_box(this.el).relative()
  }

  get self_target(): RenderingTarget {
    return this.el
  }

  readonly child_views: ViewStorage<DOMNode | UIElement> = new Map()

  override *children(): IterViews {
    yield* super.children()
    yield* this.child_views.values()
  }

  override async lazy_initialize(): Promise<void> {
    await super.lazy_initialize()
    const children = this.model.children.filter((obj): obj is DOMNode | UIElement => !isString(obj))
    await build_views(this.child_views, children, {parent: this})
  }

  override remove(): void {
    remove_views(this.child_views)
    super.remove()
  }

  override connect_signals(): void {
    super.connect_signals()

    const {children, style} = this.model.properties
    this.on_change(children, async () => {
      await this._update_children()
    })
    this.on_change(style, () => {
      this.el.removeAttribute("style")
      apply_styles(this.el.style, this.model.style)
    })
  }

  protected async _build_children(): Promise<BuildResult<DOMNode | UIElement>> {
    const children = this.model.children.filter((obj): obj is DOMNode | UIElement => !isString(obj))
    return await build_views(this.child_views, children, {parent: this})
  }

  protected async _update_children(): Promise<void> {
    const {created} = await this._build_children()
    const created_elements = new Set(created)

    // First remove and then either reattach existing elements or render and
    // attach new elements, so that the order of children is consistent, while
    // avoiding expensive re-rendering of existing views.
    for (const element_view of this.child_views.values()) {
      element_view.el.remove()
    }

    for (const child of this.model.children) {
      if (isString(child)) {
        const node = document.createTextNode(child)
        this.el.append(node)
      } else {
        const child_view = this.child_views.get(child)
        if (child_view == null) {
          continue
        }

        const is_new = created_elements.has(child_view)

        const target = child_view.rendering_target() ?? this.self_target
        if (is_new) {
          child_view.render_to(target)
        } else {
          target.append(child_view.el)
        }
      }
    }

    this.r_after_render()
  }

  override render(): void {
    empty(this.el)
    apply_styles(this.el.style, this.model.style)

    for (const child of this.model.children) {
      if (isString(child)) {
        const node = document.createTextNode(child)
        this.el.append(node)
      } else {
        const child_view = this.child_views.get(child)
        if (child_view == null) {
          continue
        }

        const target = child_view.rendering_target() ?? this.self_target
        child_view.render_to(target)
      }
    }

    this.finish()
  }
}

export namespace DOMElement {
  export type Attrs = p.AttrsOf<Props>
  export type Props = DOMNode.Props & {
    style: p.Property<StylesLike>
    children: p.Property<(string | DOMNode | UIElement)[]>
  }
}

export interface DOMElement extends DOMElement.Attrs {}

export abstract class DOMElement extends DOMNode {
  declare properties: DOMElement.Props
  declare __view_type__: DOMElementView

  constructor(attrs?: Partial<DOMElement.Attrs>) {
    super(attrs)
  }

  static {
    this.define<DOMElement.Props>(({Str, List, Or, Ref}) => {
      return {
        style: [ StylesLike, {} ],
        children: [ List(Or(Str, Ref(DOMNode), Ref(UIElement))), [] ],
      }
    })
  }
}
