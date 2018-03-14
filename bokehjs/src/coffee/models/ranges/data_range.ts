import {Range} from "./range"
import {Renderer} from "../renderers/renderer"
import * as p from "core/properties"

export namespace DataRange {
  export interface Attrs extends Range.Attrs {
    names: string[]
    renderers: Renderer[]
  }

  export interface Props extends Range.Props {}
}

export interface DataRange extends DataRange.Attrs {}

export abstract class DataRange extends Range {

  properties: DataRange.Props

  constructor(attrs?: Partial<DataRange.Attrs>) {
    super(attrs)
  }

  static initClass(): void {
    this.prototype.type = "DataRange"

    this.define({
      names:     [ p.Array, [] ],
      renderers: [ p.Array, [] ],
    })
  }
}

DataRange.initClass()
