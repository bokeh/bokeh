import {Range} from "./range"
import {Renderer} from "../renderers/renderer"
import * as p from "core/properties"

export namespace DataRange {
  export interface Attrs extends Range.Attrs {
    names: string[]
    renderers: Renderer[]
  }

  export interface Opts extends Range.Opts {}
}

export interface DataRange extends DataRange.Attrs {}

export abstract class DataRange extends Range {

  constructor(attrs?: Partial<DataRange.Attrs>, opts?: DataRange.Opts) {
    super(attrs, opts)
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
