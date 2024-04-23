import type {DOMComponentView} from "../dom_view"
import type {CanvasLayer} from "../util/canvas"
import type * as p from "../properties"

const global_css_prefix = "--bk-"

export type NameOf<Key extends string> = Key extends `text_${infer Name}` ? Name : never
export type ValuesOf<T> = {[Key in keyof T & string as NameOf<Key>]: T[Key] extends p.Property<infer V> ? V : never}

export interface Paintable {
  request_paint(): void
  readonly canvas: {
    create_layer(): CanvasLayer
  }
}

export abstract class VisualProperties {
  /** @prototype */
  declare type: string
  declare attrs: string[]

  private readonly _props: p.Property<unknown>[]

  *[Symbol.iterator](): Generator<p.Property<unknown>, void, undefined> {
    yield* this._props
  }

  readonly css_prefix: string

  constructor(readonly obj: DOMComponentView & Paintable, readonly prefix: string = "") {
    this.css_prefix = `${global_css_prefix}${prefix.replaceAll("_", "-")}`
    const self = this as any
    this._props = []
    for (const attr of this.attrs) {
      const prop = obj.model.properties[prefix + attr]
      prop.change.connect(() => this.update())
      self[attr] = prop
      this._props.push(prop)
    }
  }

  abstract get doit(): boolean

  update(): void {}

  protected _get_css_value(name: string): string {
    const style = getComputedStyle(this.obj.el)
    return style.getPropertyValue(`${this.css_prefix}${name}`)
  }
}

export abstract class VisualUniforms {
  /** @prototype */
  declare type: string
  declare attrs: string[]

  *[Symbol.iterator](): Generator<p.Property<unknown>, void, undefined> {
    for (const attr of this.attrs) {
      yield this.obj.model.properties[this.prefix + attr]
    }
  }

  constructor(readonly obj: DOMComponentView & Paintable, readonly prefix: string = "") {
    for (const attr of this.attrs) {
      Object.defineProperty(this, attr, {
        get() {
          return (obj as any)[prefix + attr]
        },
      })
    }
  }

  abstract get doit(): boolean

  update(): void {}
}
