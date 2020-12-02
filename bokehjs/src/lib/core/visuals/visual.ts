import {View} from "../view"
import * as p from "../properties"

export type Paintable = {request_paint(): void}

export abstract class VisualProperties {
  /** @prototype */
  attrs: string[]

  private readonly _props: p.Property<unknown>[]

  *[Symbol.iterator](): Generator<p.Property<unknown>, void, undefined> {
    yield* this._props
  }

  constructor(readonly obj: View & Paintable, readonly prefix: string = "") {
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
