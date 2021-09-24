import {View} from "../view"
import {CanvasLayer} from "../util/canvas"
import * as p from "../properties"

export type NameOf<Key extends string> = Key extends `text_${infer Name}` ? Name : never
export type ValuesOf<T> = {[Key in keyof T & string as NameOf<Key>]: T[Key] extends p.Property<infer V> ? V : never}

export interface Renderable {
  request_render(): void
  readonly canvas: {
    create_layer(): CanvasLayer
  }
}

export abstract class VisualProperties {
  /** @prototype */
  type: string
  attrs: string[]

  private readonly _props: p.Property<unknown>[]

  *[Symbol.iterator](): Generator<p.Property<unknown>, void, undefined> {
    yield* this._props
  }

  constructor(readonly obj: View & Renderable, readonly prefix: string = "") {
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
}

export abstract class VisualUniforms {
  /** @prototype */
  type: string
  attrs: string[]

  *[Symbol.iterator](): Generator<p.Property<unknown>, void, undefined> {
    for (const attr of this.attrs) {
      yield this.obj.model.properties[this.prefix + attr]
    }
  }

  constructor(readonly obj: View & Renderable, readonly prefix: string = "") {
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
