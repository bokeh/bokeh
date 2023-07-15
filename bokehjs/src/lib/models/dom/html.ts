import {DOMNode, DOMNodeView} from "./dom_node"
import {UIElement} from "../ui/ui_element"
import type {ViewStorage, IterViews} from "core/build_views"
import {build_views, remove_views} from "core/build_views"
import {empty} from "core/dom"
import {assert} from "core/util/assert"
import {isString} from "core/util/types"
import type * as p from "core/properties"

export class HTMLView extends DOMNodeView {
  declare model: HTML
  declare el: HTMLElement

  protected readonly _refs: ViewStorage<DOMNode | UIElement> = new Map()

  override *children(): IterViews {
    yield* super.children()
    yield* this._refs.values()
  }

  override async lazy_initialize(): Promise<void> {
    await super.lazy_initialize()
    await build_views(this._refs, this.model.refs)
  }

  override remove(): void {
    remove_views(this._refs)
    super.remove()
  }

  render(): void {
    empty(this.el)
    this.el.style.display = "contents"

    const parser = new DOMParser()

    const nodes = (() => {
      const {html} = this.model
      if (isString(html)) {
        const document = parser.parseFromString(html, "text/html")

        const iter = document.createNodeIterator(document, NodeFilter.SHOW_ELEMENT, (node) => {
          return node.nodeName.toLowerCase() == "ref" ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT
        })

        let node: Node | null
        while ((node = iter.nextNode()) != null) {
          assert(node instanceof Element)

          const id = node.getAttribute("id")
          if (id != null) {
            for (const [model, view] of this._refs) {
              if (model.id == id) {
                view.render()
                node.replaceWith(view.el)
                break
              }
            }
          }
        }

        return [...document.body.childNodes]
      } else {
        return [] // TODO
      }
    })()

    for (const node of nodes) {
      this.el.appendChild(node)
    }
  }
}

export namespace HTML {
  export type Attrs = p.AttrsOf<Props>

  export type Props = DOMNode.Props & {
    html: p.Property<string | (string | DOMNode | UIElement)[]>
    refs: p.Property<(DOMNode | UIElement)[]>
  }
}

export interface HTML extends HTML.Attrs {}

export class HTML extends DOMNode {
  declare properties: HTML.Props
  declare __view_type__: HTMLView

  constructor(attrs?: Partial<HTML.Attrs>) {
    super(attrs)
  }

  static {
    this.prototype.default_view = HTMLView

    this.define<HTML.Props>(({String, Array, Or, Ref}) => ({
      html: [ Or(String, Array(Or(String, Ref(DOMNode), Ref(UIElement)))) ],
      refs: [ Array(Or(Ref(DOMNode), Ref(UIElement))), [] ],
    }))
  }
}
