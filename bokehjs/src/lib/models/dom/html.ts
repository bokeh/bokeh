import {DOMNode, DOMNodeView} from "./dom_node"
import {UIElement} from "../ui/ui_element"
import type {ViewStorage, IterViews} from "core/build_views"
import {build_views, remove_views} from "core/build_views"
import {empty, span} from "core/dom"
import {assert} from "core/util/assert"
import {isString, isArray} from "core/util/types"
import type * as p from "core/properties"
import {String, Ref, Or} from "../../core/kinds"

const HTMLRef = Or(Ref(DOMNode), Ref(UIElement))
type HTMLRef = typeof HTMLRef["__type__"]

const RawHTML = String
type RawHTML = typeof RawHTML["__type__"]

export class HTMLView extends DOMNodeView {
  declare model: HTML
  declare el: HTMLElement

  protected readonly _refs: ViewStorage<HTMLRef> = new Map()

  get refs(): HTMLRef[] {
    const {html, refs} = this.model
    return [
      ...isArray(html) ? html.filter((item): item is HTMLRef => !isString(item)) : [],
      ...refs,
    ]
  }

  override *children(): IterViews {
    yield* super.children()
    yield* this._refs.values()
  }

  override async lazy_initialize(): Promise<void> {
    await super.lazy_initialize()
    await build_views(this._refs, this.refs)
  }

  override remove(): void {
    remove_views(this._refs)
    super.remove()
  }

  render(): void {
    empty(this.el)
    this.el.style.display = "contents"

    const html = (() => {
      const {html} = this.model
      if (isArray(html)) {
        return html.map((item) => isString(item) ? item : `<ref id="${item.id}"></ref>`).join("")
      } else {
        return html
      }
    })()

    const nodes = this.parse_html(html)
    this.el.append(...nodes)
  }

  parse_html(html: string): Node[] {
    const parser = new DOMParser()
    const document = parser.parseFromString(html, "text/html")

    const iter = document.createNodeIterator(document, NodeFilter.SHOW_ELEMENT, (node) => {
      return node.nodeName.toLowerCase() == "ref" ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT
    })

    let node: Node | null
    next_node: while ((node = iter.nextNode()) != null) {
      assert(node instanceof Element)

      const id = node.getAttribute("id")
      if (id != null) {
        for (const [model, view] of this._refs) {
          if (model.id == id) {
            view.render()
            node.replaceWith(view.el)
            continue next_node
          }
        }
        node.replaceWith(span(`<not found: id=${id}>`))
        continue
      }

      const name = node.getAttribute("name")
      if (name != null) {
        for (const [model, view] of this._refs) {
          if (model.name == name) {
            view.render()
            node.replaceWith(view.el)
            continue next_node
          }
        }
        node.replaceWith(span(`<not found: name=${name}>`))
        continue
      }
    }

    return [...document.body.childNodes]
  }
}

export namespace HTML {
  export type Attrs = p.AttrsOf<Props>

  export type Props = DOMNode.Props & {
    html: p.Property<RawHTML | (RawHTML | HTMLRef)[]>
    refs: p.Property<HTMLRef[]>
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

    this.define<HTML.Props>(({Array, Or}) => ({
      html: [ Or(RawHTML, Array(Or(RawHTML, HTMLRef))) ],
      refs: [ Array(HTMLRef), [] ],
    }))
  }
}
