import {Range} from "./range"
import {Renderer} from "../renderers/renderer"
import * as p from "core/properties"

export namespace DataRange {
  export interface Attrs extends Range.Attrs {
    names: string[]
    renderers: Renderer[]
  }
}

export interface DataRange extends Range, DataRange.Attrs {}

export abstract class DataRange extends Range {

  static initClass() {
    this.prototype.type = "DataRange"

    this.define({
      names:     [ p.Array, [] ],
      renderers: [ p.Array, [] ],
    })
  }
}

DataRange.initClass()
