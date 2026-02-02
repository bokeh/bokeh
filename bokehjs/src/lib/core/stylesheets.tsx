import type {CSSStyles, CSSStyleSheetDecl} from "./css"
import {compose_stylesheet} from "./css"
import {isString} from "core/util/types"

import type {VNode} from "preact"
import {signal} from "@preact/signals"

export abstract class StyleSheet {
  protected readonly el: HTMLStyleElement | HTMLLinkElement

  install(el: HTMLElement | ShadowRoot): void {
    el.append(this.el)
  }

  uninstall(): void {
    this.el.remove()
  }

  abstract to_native(): CSSStyleSheet

  abstract to_vdom(): VNode
}

export class InlineStyleSheet extends StyleSheet {
  protected override readonly el = document.createElement("style")

  protected vdom_css = signal("")

  constructor(css?: string | CSSStyleSheetDecl, id?: string, readonly persistent: boolean = false) {
    super()
    if (isString(css)) {
      this._update(css)
    } else if (css != null) {
      this._update(compose_stylesheet(css))
    }
    if (id != null) {
      this.el.dataset.css = id
    }
  }

  get css(): string {
    return this.el.textContent
  }

  protected _update(css: string): void {
    this.el.textContent = css
    this.vdom_css.value = css
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
    this._update(this._to_css(css, styles))
  }

  prepend(css: string, styles?: CSSStyles): void {
    this._update(`${this._to_css(css, styles)}\n${this.css}`)
  }

  append(css: string, styles?: CSSStyles): void {
    this._update(`${this.css}\n${this._to_css(css, styles)}`)
  }

  remove(): void {
    this.el.remove()
  }

  to_native(): CSSStyleSheet {
    const sheet = new CSSStyleSheet()
    sheet.replaceSync(this.css)
    return sheet
  }

  to_vdom(): VNode {
    return <style>{this.vdom_css}</style>
  }
}

export class GlobalInlineStyleSheet extends InlineStyleSheet {
  override install(): void {
    if (!this.el.isConnected) {
      document.head.appendChild(this.el)
    }
  }
}

export class ImportedStyleSheet extends StyleSheet {
  protected override readonly el: HTMLLinkElement

  constructor(url: string) {
    super()
    this.el = document.createElement("link")
    this.el.rel = "stylesheet"
    this.el.href = url
  }

  replace(url: string): void {
    this.el.href = url
  }

  remove(): void {
    this.el.remove()
  }

  to_native(): CSSStyleSheet {
    const sheet = new CSSStyleSheet()
    sheet.replaceSync(`@import "${this.el.href}"`)
    return sheet
  }

  to_vdom(): VNode {
    return <link rel="stylesheet" href={this.el.href}></link>
  }
}

export class GlobalImportedStyleSheet extends ImportedStyleSheet {
  override install(): void {
    if (!this.el.isConnected) {
      document.head.appendChild(this.el)
    }
  }
}

export type StyleSheetLike = StyleSheet | string
