import {DOMNode, DOMNodeView} from "./dom_node"
import {Styles} from "./styles"
import {UIElement} from "../ui/ui_element"
import type {ViewStorage, IterViews} from "core/build_views"
import {build_views, remove_views} from "core/build_views"
import {entries} from "core/util/object"
import {isString} from "core/util/types"
import type * as p from "core/properties"

export abstract class DOMElementView extends DOMNodeView {
  declare model: DOMElement
  declare el: HTMLElement

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

  override render(): void {
    const {style} = this.model
    if (style != null) {
      /*
      type IsString<T> = T extends string ? T : never
      type Key = Exclude<IsString<keyof CSSStyleDeclaration>,
        "length" | "parentRule" | "getPropertyPriority" | "getPropertyValue" | "item" | "removeProperty" | "setProperty">
      //this.el.style[key as Key] = value
      */

      if (style instanceof Styles) {
        for (const prop of style) {
          const value = prop.get_value()
          if (isString(value)) {
            const name = prop.attr.replace(/_/g, "-")
            if (this.el.style.hasOwnProperty(name)) {
              this.el.style.setProperty(name, value)
            }
          }
        }
      } else {
        for (const [key, value] of entries(style)) {
          const name = key.replace(/_/g, "-")
          if (this.el.style.hasOwnProperty(name)) {
            this.el.style.setProperty(name, value)
          }
        }
      }
    }

    for (const child of this.model.children) {
      if (isString(child)) {
        const node = document.createTextNode(child)
        this.el.appendChild(node)
      } else {
        const child_view = this.child_views.get(child)!
        child_view.render_to(this.el)
      }
    }

    this.finish()
  }
}

export namespace DOMElement {
  export type Attrs = p.AttrsOf<Props>
  export type Props = DOMNode.Props & {
    style: p.Property<Styles | {[key: string]: string} | null>
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
    this.define<DOMElement.Props>(({String, Array, Dict, Or, Nullable, Ref}) => ({
      style: [ Nullable(Or(Ref(Styles), Dict(String))), null ],
      children: [ Array(Or(String, Ref(DOMNode), Ref(UIElement))), [] ],
    }))
  }
}
