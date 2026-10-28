import {Widget, WidgetView} from "./widget"
import {dedent, markdown_extensions} from "./markdown_extensions"
import type * as p from "core/properties"
import type {View} from "core/view"
import type {Dict} from "core/types"
import {LayoutDOM, type CSSSizeKeyword, type DOMBoxSizing} from "../layouts/layout_dom"
import type {UIElement, UIElementView} from "../ui/ui_element"
import {logger} from "core/logging"
import {build_views, remove_views} from "core/build_views"
import {dict} from "core/util/object"
import {uuid4} from "core/util/string"
import {div, type StyleSheetLike} from "core/dom"
import {follow_fragment_link, scroll_to_fragment} from "core/util/links"

import {Marked} from "marked"
import Purify from "dompurify"
import hljs from "highlight.js/lib/common"
import markedFootnote from "marked-footnote"
import GithubSlugger from "github-slugger"

import markdown_css from "styles/widgets/markdown.css"

export class MarkdownView extends WidgetView {
  declare model: Markdown

  private readonly _marker_prefix = `data-markdown-${uuid4().toLowerCase()}`

  protected readonly _markdown = new Marked(
    markdown_extensions(this._marker_prefix),
    markedFootnote({headingClass: "", footnoteDivider: true}),
  )

  readonly contents = div({style: {display: "contents"}})

  private _initial_fragment = true
  private _embed_revision = 0
  private _pending_embeds = 0
  private _failed_embeds = new WeakSet<UIElement>()
  private _embed_build_revision = 0
  private readonly _rendered_embeds = new WeakSet<UIElementView>()
  private _parsed: {text: string, dedent: boolean, breaks: boolean, html: string, names: string[]} | null = null
  private readonly _on_hashchange = (event: HashChangeEvent) => scroll_to_fragment(this.shadow_el, event)

  override connect_signals(): void {
    super.connect_signals()
    const {text, disable_math, embeds, dedent, hard_line_break, disable_anchors} = this.model.properties
    this.on_change([text, embeds, dedent, hard_line_break, disable_anchors], () => this._update_markdown())
    this.on_change(disable_math, () => this._render_markdown(this.model.text))
    window.addEventListener("hashchange", this._on_hashchange)
    this.shadow_el.addEventListener("click", (event) => {
      if (event instanceof MouseEvent) {
        follow_fragment_link(event, this.shadow_el)
      }
    })
    this.shadow_el.addEventListener("toggle", () => this.invalidate_layout(), true)
  }

  private _parse_markdown(text: string): {text: string, html: string, names: string[]} {
    const {dedent: use_dedent, hard_line_break: breaks} = this.model
    if (this._parsed?.text != text || this._parsed.dedent != use_dedent || this._parsed.breaks != breaks) {
      const container = div()
      const source = use_dedent ? dedent(text) : text
      container.innerHTML = Purify.sanitize(this._markdown.parse(source, {async: false, breaks}), {
        FORBID_ATTR: ["data-bokeh-embed", "data-heading-id"],
      })
      // Only extension-generated markers may mount models or assign explicit IDs.
      for (const suffix of ["bokeh-embed", "heading-id"]) {
        const attribute = `${this._marker_prefix}-${suffix}`
        for (const element of container.querySelectorAll(`[${attribute}]`)) {
          element.setAttribute(`data-${suffix}`, element.getAttribute(attribute)!)
          element.removeAttribute(attribute)
        }
      }
      const names = [...container.querySelectorAll(".bokeh-embed[data-bokeh-embed]")]
        .map((el) => el.getAttribute("data-bokeh-embed")!)
      this._parsed = {text, dedent: use_dedent, breaks, html: container.innerHTML, names}
    }
    return this._parsed
  }

  private _is_ancestor(model: LayoutDOM): boolean {
    for (let view: View | null = this; view != null; view = view.parent) {
      if (view.model == model) {
        return true
      }
    }
    return false
  }

  protected override _auto_width: CSSSizeKeyword = "fit-content"

  protected override _update_layout(): void {
    this._auto_width = this.child_models.length == 0 ? "fit-content" : "auto"
    super._update_layout()
  }

  override box_sizing(): DOMBoxSizing {
    const sizing = super.box_sizing()
    if (this.model.width == null && this.model.width_policy == "auto" && this.model.sizing_mode == null && this.child_models.length != 0) {
      sizing.width_policy = "max"
    }
    return sizing
  }

  override async build_child_views(): Promise<UIElementView[]> {
    const revision = ++this._embed_build_revision
    const previous = new Set(this._child_views.values())
    const failed = new WeakSet<UIElement>()
    try {
      const {created} = await build_views(this._child_views, this.child_models, {
        parent: this,
        on_error: (error, model) => {
          failed.add(model)
          logger.warn(`Failed to build Markdown embed ${model}`, error)
        },
      })
      if (revision == this._embed_build_revision && !this.is_destroyed) {
        this._failed_embeds = failed
      }
      return created
    } finally {
      for (const view of previous) {
        if (this._child_views.get(view.model) !== view) {
          this._resize_observer.unobserve(view.el)
        }
      }
      for (const view of this._child_views.values()) {
        if (!previous.has(view)) {
          this._resize_observer.observe(view.el, {box: "border-box"})
        }
      }
      this._sig_child_views.value = [...this._child_views.values()]
    }
  }

  override get child_models(): LayoutDOM[] {
    const {names} = this._parse_markdown(this.model.text)
    const embeds = dict(this.model.embeds)
    const models = names.flatMap((name) => {
      const model = embeds.get(name)
      return model == null || this._is_ancestor(model) ? [] : [model]
    })
    return [...new Set(models)]
  }

  private _update_markdown(): void | Promise<void> {
    const revision = ++this._embed_revision
    const children = this.child_models
    if (this._pending_embeds == 0 && children.length == this._child_views.size && children.every((child) => this._child_views.has(child))) {
      this._render_markdown(this.model.text)
      this.invalidate_layout()
    } else {
      return this._reconcile_embeds(revision)
    }
  }

  private async _reconcile_embeds(revision: number): Promise<void> {
    this._pending_embeds++
    try {
      await this.build_child_views()
    } finally {
      this._pending_embeds--
    }
    if (revision != this._embed_revision || this.is_destroyed) {
      return
    }
    this._render_markdown(this.model.text)
    this.r_after_render()
    this.invalidate_layout()
  }

  private _mount_embeds(): void {
    const used = new Set<LayoutDOM>()
    const embeds = dict(this.model.embeds)
    for (const slot of this.contents.querySelectorAll<HTMLElement>(".bokeh-embed[data-bokeh-embed]")) {
      const name = slot.getAttribute("data-bokeh-embed")!
      const model = embeds.get(name)
      const view = model == null ? undefined : this._child_views.get(model)
      if (model == null || this._is_ancestor(model) || used.has(model) || view == null) {
        slot.classList.add("bokeh-embed-error")
        slot.textContent = model == null ? `Unknown Bokeh embed: ${name}`
          : model == this.model ? `Cannot embed Markdown in itself: ${name}`
          : this._is_ancestor(model) ? `Cannot embed an ancestor layout: ${name}`
          : used.has(model) ? `Bokeh model is already embedded: ${name}` : this._failed_embeds.has(model) ? `Failed to build Bokeh embed: ${name}` : `Loading Bokeh embed: ${name}`
        continue
      }
      used.add(model)
      if (!this._rendered_embeds.has(view)) {
        view.render_to(slot)
        this._rendered_embeds.add(view)
      } else {
        slot.append(view.el)
      }
    }
  }

  protected _render_markdown(text: string): void {
    this.contents.innerHTML = this._parse_markdown(text).html

    const headings = this.contents.querySelectorAll<HTMLElement>("h1, h2, h3, h4, h5, h6")
    const occupied = new Set([...this.contents.querySelectorAll("[id], a[name]")]
      .flatMap((el) => [el.id, el.getAttribute("name") ?? ""]))
    const explicit_ids = new Set([...headings].map((heading) => heading.getAttribute("data-heading-id")))
    for (const heading of headings) {
      const id = heading.getAttribute("data-heading-id")
      if (id != null) {
        let unique = id
        let suffix = 1
        while (occupied.has(unique) || (unique != id && explicit_ids.has(unique))) {
          unique = `${id}-${suffix++}`
        }
        heading.id = unique
        occupied.add(unique)
        heading.removeAttribute("data-heading-id")
      }
    }

    for (const quote of this.contents.querySelectorAll("blockquote")) {
      const paragraph = quote.firstElementChild
      const first = paragraph?.firstChild
      if (paragraph?.tagName != "P" || !(first instanceof Text)) {
        continue
      }
      const match = /^\[!(NOTE|TIP|IMPORTANT|WARNING|CAUTION)\](?:\n|$)/i.exec(first.data)
      if (match == null) {
        continue
      }
      const kind = match[1].toLowerCase()
      first.deleteData(0, match[0].length)
      if (first.length == 0 && first.nextSibling instanceof HTMLBRElement) {
        first.nextSibling.remove()
      }
      if (paragraph.childNodes.length == 1 && first.length == 0) {
        paragraph.remove()
      }
      quote.classList.add("admonition", `admonition-${kind}`)
      const title = document.createElement("p")
      title.className = "admonition-title"
      title.textContent = kind[0].toUpperCase() + kind.slice(1)
      quote.prepend(title)
    }

    const slugger = new GithubSlugger()
    const reserved = new Set([...this.contents.querySelectorAll("[id], a[name]")]
      .flatMap((el) => [el.id, el.getAttribute("name") ?? ""]))
    for (const heading of headings) {
      if (this.model.disable_anchors || heading.closest(".footnotes") != null) {
        continue
      }
      if (heading.id.length == 0) {
        // Reserve HTML and footnote targets before allocating generated IDs.
        const text = heading.textContent.trim().toLowerCase()
        let id: string
        do {
          id = slugger.slug(text.length == 0 ? "section" : text)
        } while (reserved.has(id))
        heading.id = id
        reserved.add(id)
      }
      const anchor = document.createElement("a")
      anchor.className = "heading-anchor"
      anchor.href = `#${encodeURIComponent(heading.id)}`
      anchor.setAttribute("aria-label", `Link to ${heading.textContent}`)
      anchor.textContent = " #"
      heading.append(anchor)
    }

    // Process math in prose only, preserving literal TeX in code blocks and inline code.
    const mathjax = this.provider.MathJax
    if (!this.model.disable_math && mathjax != null) {
      const walker = document.createTreeWalker(this.contents, NodeFilter.SHOW_TEXT, {
        acceptNode: (node) => node.parentElement?.closest("pre, code") != null ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_ACCEPT,
      })
      const nodes: Text[] = []
      while (walker.nextNode() != null) {
        nodes.push(walker.currentNode as Text)
      }
      const parents = new Set(nodes.map((node) => node.parentElement!))
      for (const parent of parents) {
        let run: (Text | HTMLBRElement)[] = []
        const render_math = () => {
          let text = ""
          const segments = run.map((node) => {
            const start = text.length
            text += node instanceof Text ? node.data : "\n"
            return {node, start, end: text.length}
          })
          const boundary = (offset: number): [Node, number] => {
            for (const segment of segments) {
              if (offset <= segment.end) {
                const {node, start} = segment
                if (node instanceof Text) {
                  return [node, offset - start]
                }
                const parent = node.parentNode!
                const index = [...parent.childNodes].indexOf(node)
                return [parent, index + (offset == start ? 0 : 1)]
              }
            }
            throw new Error("Invalid MathJax text boundary")
          }
          // Work backwards so earlier text offsets remain valid after replacement.
          for (const part of mathjax.find_tex(text).reverse()) {
            const range = document.createRange()
            range.setStart(...boundary(part.start.n ?? 0))
            range.setEnd(...boundary(part.end.n ?? text.length))
            const container = div()
            const svg = mathjax.tex2svg(part.math, {display: part.display}).outerHTML
            container.innerHTML = Purify.sanitize(svg, {ADD_TAGS: ["use"]})
            const fragment = document.createDocumentFragment()
            fragment.append(...container.childNodes)
            range.deleteContents()
            range.insertNode(fragment)
          }
          run = []
        }
        // Hard breaks inside TeX belong to the equation. Keep all other <br>
        // elements, and never combine text across formatting elements or code.
        for (const child of [...parent.childNodes]) {
          if (child instanceof Text || child instanceof HTMLBRElement) {
            run.push(child)
          } else {
            render_math()
          }
        }
        render_math()
      }
    }

    for (const code of this.contents.querySelectorAll("pre code")) {
      const language = [...code.classList].find((cls) => cls.startsWith("language-"))?.slice(9)
      if (language != null && hljs.getLanguage(language) != null) {
        const result = hljs.highlight(code.textContent, {language})
        code.innerHTML = Purify.sanitize(result.value)
        code.classList.add("hljs")
      }
    }
    this._mount_embeds()
  }

  override stylesheets(): StyleSheetLike[] {
    return [...super.stylesheets(), markdown_css]
  }

  override render(): void {
    super.render()
    for (const view of this.child_views) {
      this._rendered_embeds.add(view)
    }
    this.shadow_el.append(this.contents)
    this._render_markdown(this.model.text)
  }

  override _after_layout(): void {
    super._after_layout()
    if (this._initial_fragment) {
      this._initial_fragment = false
      scroll_to_fragment(this.shadow_el)
    }
  }

  override remove(): void {
    this._embed_revision++
    remove_views(this._child_views)
    window.removeEventListener("hashchange", this._on_hashchange)
    super.remove()
  }
}

export namespace Markdown {
  export type Attrs = p.AttrsOf<Props>

  export type Props = Widget.Props & {
    text: p.Property<string>
    disable_math: p.Property<boolean>
    embeds: p.Property<Dict<LayoutDOM>>
    dedent: p.Property<boolean>
    hard_line_break: p.Property<boolean>
    disable_anchors: p.Property<boolean>
  }
}

export interface Markdown extends Markdown.Attrs {}

export class Markdown extends Widget {
  declare properties: Markdown.Props
  declare __view_type__: MarkdownView

  static {
    this.prototype.default_view = MarkdownView

    this.define<Markdown.Props>(({Str, Bool, Dict, Ref}) => ({
      text: [ Str, "" ],
      disable_math: [ Bool, false ],
      embeds: [ Dict(Ref(LayoutDOM)), {} ],
      dedent: [ Bool, true ],
      hard_line_break: [ Bool, false ],
      disable_anchors: [ Bool, false ],
    }))
  }
}
