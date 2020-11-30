import {View} from "../view"
import * as p from "../properties"
import {Arrayable} from "../types"

export abstract class VisualProperties {
  /** @prototype */
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

  cache_select(prop: p.Property<unknown>, i: number): any {
    if (prop.is_value)
      return prop.spec.value
    else
      return (this.obj as any)[`_${prop.attr}`][i]
  }

  get_array(prop: p.Property<unknown>): Arrayable {
    return (this.obj as any)[`_${prop.attr}`]
  }

  abstract get doit(): boolean
}
