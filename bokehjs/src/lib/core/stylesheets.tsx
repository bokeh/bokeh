import type {CSSStyles, CSSStyleSheetDecl} from "./css"
import {compose_stylesheet} from "./css"
import {isString} from "core/util/types"

import type {VNode} from "preact"
import {signal, effect} from "@preact/signals"

export class StyleSheetComposer {
  constructor(public css: string = "") {}

  private _to_css(css: string, styles: CSSStyles | undefined): string {
    if (styles == null) {
      return css
    } else {
      return compose_stylesheet({[css]: styles})
    }
  }

  append(css: string, styles?: CSSStyles): void {
    this.css = `${this.css}\n${this._to_css(css, styles)}`
  }
}

export abstract class StyleSheet {
  protected readonly _dom_stylesheet = new CSSStyleSheet()

  to_native(): CSSStyleSheet {
    return this._dom_stylesheet
  }

  abstract to_vdom(): VNode

  abstract to_element(): HTMLElement

  readonly abstract is_global: boolean
  readonly abstract is_inline: boolean
}

export class InlineStyleSheet extends StyleSheet {
  readonly is_global: boolean = false
  readonly is_inline: boolean = true

  private _css = signal("")
  get css(): string {
    return this._css.value
  }

  constructor(css?: string | CSSStyleSheetDecl, _id?: string) {
    super()
    if (isString(css)) {
      this._update(css)
    } else if (css != null) {
      this._update(compose_stylesheet(css))
    }
    effect(() => {
      this._dom_stylesheet.replaceSync(this.css)
    })
    /*
    if (id != null) {
      this.el.dataset.css = id
    }
    */
  }

  protected _update(css: string): void {
    this._css.value = css
  }

  clear(): void {
    this.replace("")
  }

  private _to_css(css: string, styles: CSSStyles | undefined): string {
    if (styles == null) {
      return css
    } else {
      return compose_stylesheet({[css]: styles})
    }
  }

  replace(css: string, styles?: CSSStyles): void {
    const new_css = this._to_css(css, styles)
    this._update(new_css)
  }

  prepend(css: string, styles?: CSSStyles): void {
    const new_css = `${this._to_css(css, styles)}\n${this.css}`
    this._update(new_css)
  }

  append(css: string, styles?: CSSStyles): void {
    const new_css = `${this.css}\n${this._to_css(css, styles)}`
    this._update(new_css)
  }

  to_vdom(): VNode {
    return <style>{this._css}</style>
  }

  to_element(): HTMLStyleElement {
    const el = document.createElement("style")
    el.textContent = this.css
    return el
  }
}

export class GlobalInlineStyleSheet extends InlineStyleSheet {
  override readonly is_global: boolean = true
}

export class ImportedStyleSheet extends StyleSheet {
  override readonly is_global: boolean = false
  override readonly is_inline: boolean = false

  constructor(readonly url: string) {
    super()
    this._dom_stylesheet.replaceSync(`@import "${this.url}"`)
  }

  to_vdom(): VNode {
    return <link rel="stylesheet" href={this.url}></link>
  }

  to_element(): HTMLLinkElement {
    const el = document.createElement("link")
    el.rel = "stylesheet"
    el.href = this.url
    return el
  }
}

export class GlobalImportedStyleSheet extends ImportedStyleSheet {
  override readonly is_global: boolean = true
}

export type StyleSheetLike = StyleSheet | string

export type GlobalStyleSheet = GlobalImportedStyleSheet | GlobalInlineStyleSheet
