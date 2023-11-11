import {UIElement, UIElementView} from "./ui_element"
import * as p from "core/properties"
import {HasProps} from "core/has_props"
import type {StyleSheetLike} from "core/dom"
import {div, span, input, empty} from "core/dom"
import {to_string} from "core/util/pretty"
import {Model} from "model"
import type {Document} from "document"
import {isBoolean, isNumber, isString, isSymbol, isArray, isIterable, isObject, isPlainObject} from "core/util/types"
import type {PlainObject} from "core/types"
import {entries, keys} from "core/util/object"
import {clear} from "core/util/array"
import {interleave} from "core/util/iterator"
import {receivers_for_sender} from "core/signaling"
import {diagnostics} from "core/diagnostics"

import examiner_css from "styles/examiner.css"
import pretty_css, * as pretty from "styles/pretty.css"

export class HTMLPrinter {
  protected readonly visited = new WeakSet()
  protected depth = 0

  constructor(readonly click?: (obj: unknown) => void, readonly max_items: number = 5, readonly max_depth: number = 3) {}

  to_html(obj: unknown): HTMLElement {
    if (isObject(obj)) {
      if (this.visited.has(obj)) {
        return span("<circular>")
      } else {
        this.visited.add(obj)
      }
    }

    if (obj == null) {
      return this.null()
    } else if (isBoolean(obj)) {
      return this.boolean(obj)
    } else if (isNumber(obj)) {
      return this.number(obj)
    } else if (isString(obj)) {
      return this.string(obj)
    } else if (isSymbol(obj)) {
      return this.symbol(obj)
    } else if (obj instanceof Model) {
      return this.model(obj)
    } else if (obj instanceof p.Property) {
      return this.property(obj)
    } else if (isPlainObject(obj)) {
      return this.object(obj)
    } else if (isArray(obj)) {
      return this.array(obj)
    } else if (isIterable(obj)) {
      return this.iterable(obj)
    } else {
      return span(to_string(obj))
    }
  }

  null(): HTMLElement {
    return span({class: pretty.nullish}, "null")
  }

  token(val: string): HTMLElement {
    return span({class: pretty.token}, val)
  }

  boolean(val: boolean): HTMLElement {
    return span({class: pretty.boolean}, `${val}`)
  }

  number(val: number): HTMLElement {
    return span({class: pretty.number}, `${val}`)
  }

  string(val: string): HTMLElement {
    const sq = val.includes("'")
    const dq = val.includes('"')

    const str = (() => {
      if (sq && dq) {
        return `\`${val.replace(/`/g, "\\`")}\``
      } else if (dq) {
        return `'${val}'`
      } else {
        return `"${val}"`
      }
    })()

    return span({class: pretty.string}, str)
  }

  symbol(val: symbol): HTMLElement {
    return span({class: pretty.symbol}, val.toString())
  }

  array(obj: unknown[]): HTMLElement {
    const T = this.token
    const items: HTMLElement[] = []
    let i = 0
    for (const entry of obj) {
      items.push(this.to_html(entry))
      if (i++ > this.max_items) {
        items.push(span("\u2026"))
        break
      }
    }
    return span({class: pretty.array}, T("["), ...interleave(items, () => T(", ")), T("]"))
  }

  iterable(obj: Iterable<unknown>): HTMLElement {
    const T = this.token
    const tag = Object(obj)[Symbol.toStringTag] ?? "Object"
    const items = this.array([...obj])
    return span({class: pretty.iterable}, `${tag}`, T("("), items, T(")"))
  }

  object(obj: PlainObject): HTMLElement {
    const T = this.token
    const items: HTMLElement[] = []
    let i = 0
    for (const [key, val] of entries(obj)) {
      items.push(span(`${key}`, T(": "), this.to_html(val)))
      if (i++ > this.max_items) {
        items.push(span("\u2026"))
        break
      }
    }
    return span({class: pretty.object}, T("{"), ...interleave(items, () => T(", ")), T("}"))
  }

  model(obj: Model): HTMLElement {
    const T = this.token
    const el = span({class: pretty.model}, obj.constructor.__qualified__, T("("), this.to_html(obj.id), T(")"))
    const {click} = this
    if (click != null) {
      el.classList.add("ref")
      el.addEventListener("click", () => click(obj))
    }
    return el
  }

  property(obj: p.Property): HTMLElement {
    const model = this.model(obj.obj as Model)
    const attr = span({class: pretty.attr}, obj.attr)
    return span(model, this.token("."), attr)
  }
}

export class ExaminerView extends UIElementView {
  declare model: Examiner

  override stylesheets(): StyleSheetLike[] {
    return [...super.stylesheets(), pretty_css, examiner_css]
  }

  private prev_listener: ((obj: unknown) => void) | null = null

  private watched_props: Set<p.Property> = new Set()

  override render(): void {
    super.render()

    if (this.prev_listener != null) {
      diagnostics.disconnect(this.prev_listener)
    }

    const models_list: [HasProps, HTMLElement][] = []
    const props_list: [p.Property, HTMLElement][] = []
    const watches_list: [p.Property, HTMLElement][] = []

    const animations = new WeakMap<Element, Animation>()
    const listener = (obj: unknown): void => {
      if (!(obj instanceof p.Property)) {
        return
      }

      function highlight(el: Element) {
        const prev = animations.get(el)
        if (prev != null) {
          prev.cancel()
        }
        const anim = el.animate([
          {backgroundColor: "#def189"},
          {backgroundColor: "initial"},
        ], {duration: 2000})
        animations.set(el, anim)
      }

      function update(prop: p.Property, prop_el: Element, value_el: Element) {
        prop_el.classList.toggle("dirty", prop.dirty)

        empty(value_el)
        const value = prop.is_unset ? span("unset") : to_html(prop.get_value())
        value_el.appendChild(value)

        highlight(value_el)
      }

      for (const [model, model_el] of models_list) {
        if (model == obj.obj) {
          highlight(model_el)
        }
      }

      for (const [prop, prop_el] of props_list) {
        if (prop == obj) {
          const [,,, value_el] = prop_el.children
          update(prop, prop_el, value_el)
          break
        }
      }

      for (const [prop, prop_el] of watches_list) {
        if (prop == obj) {
          const [, value_el] = prop_el.children
          update(prop, prop_el, value_el)
          break
        }
      }
    }
    diagnostics.connect(listener)

    const models_tb_el = (() => {
      const filter_el = input({class: "filter", type: "text", placeholder: "Filter"})
      filter_el.addEventListener("keyup", () => {
        const text = filter_el.value
        for (const [model, el] of models_list) {
          const show = model.constructor.__qualified__.includes(text)
          el.classList.toggle("hidden", !show)
        }
      })
      return div({class: "toolbar"}, filter_el)
    })()

    const initial_cb_el = input({type: "checkbox", checked: true})
    const internal_cb_el = input({type: "checkbox", checked: true})

    const update_prop_visibility = () => {
      for (const [prop, prop_el] of props_list) {
        const show_initial = initial_cb_el.checked
        const show_internal = internal_cb_el.checked
        const hidden = !prop.dirty && !show_initial || prop.internal && !show_internal
        prop_el.classList.toggle("hidden", hidden)
      }
    }

    initial_cb_el.addEventListener("change", () => update_prop_visibility())
    internal_cb_el.addEventListener("change", () => update_prop_visibility())

    const props_tb_el = (() => {
      const filter_el = input({class: "filter", type: "text", placeholder: "Filter"})
      const group_el = span({class: "checkbox"}, input({type: "checkbox", checked: true}), span("Group"))
      const initial_el = span({class: "checkbox"}, initial_cb_el, span("Initial?"))
      const internal_el = span({class: "checkbox"}, internal_cb_el, span("Internal?"))

      filter_el.addEventListener("keyup", () => {
        const text = filter_el.value
        for (const [prop, el] of props_list) {
          const show = prop.attr.includes(text)
          el.classList.toggle("hidden", !show)
        }
      })

      return div({class: "toolbar"}, filter_el, group_el, initial_el, internal_el)
    })()

    const watches_tb_el = (() => {
      const filter_el = input({class: "filter", type: "text", placeholder: "Filter"})
      filter_el.addEventListener("keyup", () => {
        const text = filter_el.value
        for (const [prop, el] of watches_list) {
          const show = prop.attr.includes(text)
          el.classList.toggle("hidden", !show)
        }
      })
      return div({class: "toolbar"}, filter_el)
    })()

    const models_list_el = div({class: "models-list"})
    const props_list_el = div({class: "props-list"})
    const watches_list_el = div({class: "watches-list"})

    const models_panel_el = div({class: "models-panel"}, models_tb_el, models_list_el)
    const props_panel_el = div({class: "props-panel"}, props_tb_el, props_list_el)
    const watches_panel_el = div({class: "watches-panel"}, watches_tb_el, watches_list_el)

    const column_el = div({class: "col", style: {width: "100%"}}, watches_panel_el, props_panel_el)
    const examiner_el = div({class: "examiner"}, models_panel_el, column_el)

    function click(obj: unknown) {
      if (obj instanceof Model) {
        render_props(obj)
      }
    }

    function to_html(obj: unknown) {
      const printer = new HTMLPrinter(click)
      return printer.to_html(obj)
    }

    const render_models = (models: Iterable<HasProps>, doc: Document | null) => {
      clear(models_list)
      empty(models_list_el)

      const roots = doc != null ? new Set(doc.roots()) : new Set()
      for (const model of models) {
        const root = roots.has(model) ? span({class: "tag"}, "root") : null
        const ref_el = span({class: "model-ref", tabIndex: 0}, to_html(model), root)
        ref_el.addEventListener("keydown", (event) => {
          if (event.key == "Enter") {
            render_props(model)
          }
        })
        models_list.push([model, ref_el])
        models_list_el.appendChild(ref_el)
      }
    }

    const render_props = (model: HasProps) => {
      clear(props_list)
      empty(props_list_el)

      for (const [item, el] of models_list) {
        el.classList.toggle("active", model == item)
      }

      const bases = (() => {
        const bases: [typeof HasProps, string[]][] = []
        let proto = Object.getPrototypeOf(model)

        do {
          bases.push([proto.constructor, keys(proto._props)])
          proto = Object.getPrototypeOf(proto)
        } while (proto.constructor != HasProps)

        bases.reverse()

        const cumulative: string[] = []
        for (const [, attrs] of bases) {
          attrs.splice(0, cumulative.length)
          cumulative.push(...attrs)
        }

        return bases
      })()

      const connections = receivers_for_sender.get(model) ?? []

      for (const [base, attrs] of bases) {
        if (attrs.length == 0) {
          continue
        }

        const expander_el = span({class: ["expander"]})
        const base_el = div({class: "base"}, expander_el, "inherited from", " ", span({class: "monospace"}, base.__qualified__))
        props_list_el.appendChild(base_el)

        const props_group: HTMLElement[] = []
        for (const attr of attrs) {
          const prop = model.property(attr)

          const kind = prop.kind.toString()
          const value = prop.is_unset ? span("unset") : to_html(prop.get_value())

          const internal_el = prop.internal ? span({class: "tag"}, "internal") : null

          const listeners = connections.filter((connection) => connection.signal == prop.change).length
          const listeners_el = listeners != 0 ? span({class: "tag"}, `${listeners}`) : null

          const watched = this.watched_props.has(prop)
          const watch_el = input({type: "checkbox", checked: watched})
          const attr_el = div({class: "prop-attr", tabIndex: 0}, watch_el, span({class: "attr"}, attr), internal_el)
          const conns_el = div({class: "prop-conns"}, listeners_el)
          const kind_el = div({class: "prop-kind"}, kind)
          const value_el = div({class: "prop-value"}, value)

          const dirty = prop.dirty ? "dirty" : null
          const internal = prop.internal ? "internal" : null
          const show_initial = initial_cb_el.checked
          const show_internal = internal_cb_el.checked
          const hidden = !prop.dirty && !show_initial || prop.internal && !show_internal ? "hidden" : null
          const prop_el = div({class: ["prop", dirty, internal, hidden]}, attr_el, conns_el, kind_el, value_el)
          props_group.push(prop_el)
          props_list.push([prop, prop_el])
          props_list_el.appendChild(prop_el)

          watch_el.addEventListener("change", () => {
            this.watched_props[watch_el.checked ? "add" : "delete"](prop)
            render_watches()
          })
        }

        base_el.addEventListener("click", () => {
          expander_el.classList.toggle("closed")
          for (const el of props_group) {
            el.classList.toggle("closed")
          }
        })
      }
    }

    const render_watches = () => {
      clear(watches_list)
      empty(watches_list_el)

      if (this.watched_props.size == 0) {
        const empty_el = div({class: "nothing"}, "No watched properties")
        watches_list_el.appendChild(empty_el)
      } else {
        for (const prop of this.watched_props) {
          const attr_el = span(to_html(prop))
          const value_el = span(prop.is_unset ? span("unset") : to_html(prop.get_value()))
          const prop_el = div({class: ["prop", prop.dirty ? "dirty" : null]}, attr_el, value_el)
          watches_list.push([prop, prop_el])
          watches_list_el.appendChild(prop_el)
        }
      }
    }

    this.shadow_el.appendChild(examiner_el)

    const {target} = this.model
    if (target != null) {
      const models = target.references()
      const {document} = target

      render_models(models, document)
      render_props(target)
    } else {
      const {document} = this.model
      if (document != null) {
        const models = document._all_models.values()
        render_models(models, document)

        const roots = document.roots()
        if (roots.length != 0) {
          const [root] = roots
          render_props(root)
        }
      }
    }

    render_watches()
  }
}

export namespace Examiner {
  export type Attrs = p.AttrsOf<Props>
  export type Props = UIElement.Props & {
    target: p.Property<HasProps | null>
  }
}

export interface Examiner extends Examiner.Attrs {}

export class Examiner extends UIElement {
  declare properties: Examiner.Props
  declare __view_type__: ExaminerView

  constructor(attrs?: Partial<Examiner.Attrs>) {
    super(attrs)
  }

  static {
    this.prototype.default_view = ExaminerView

    this.define<Examiner.Props>(({Ref, Nullable}) => ({
      target: [ Nullable(Ref(HasProps)), null ],
    }))
  }
}
