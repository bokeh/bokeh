import {Range} from "./range"
import {Renderer} from "../renderers/renderer"
import * as p from "core/properties"

export abstract class DataRange extends Range {

  static initClass() {
    this.prototype.type = "DataRange"

    this.define({
      names:     [ p.Array, [] ],
      renderers: [ p.Array, [] ],
    })
  }

  names: string[]
  renderers: Renderer[]
}

DataRange.initClass()
