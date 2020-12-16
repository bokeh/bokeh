import {View} from "../view"
import * as p from "../properties"

export abstract class VisualProperties {
  /** @prototype */
  type: string
  attrs: string[]

  private readonly _props: p.Property<unknown>[]

  *[Symbol.iterator](): Generator<p.Property<unknown>, void, undefined> {
    yield* this._props
  }

  constructor(readonly obj: View, readonly prefix: string = "") {
    const self = this as any
    this._props = []
    for (const attr of this.attrs) {
      const prop = obj.model.properties[prefix + attr]
      self[attr] = prop
      this._props.push(prop)
    }
  }

  abstract get doit(): boolean
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

  constructor(readonly obj: View, readonly prefix: string = "") {
    for (const attr of this.attrs) {
      Object.defineProperty(this, attr, {
        get() {
          return (obj as any)[prefix + attr]
        },
      })
    }
  }

  abstract get doit(): boolean
}
