import {Range} from "./range"
import {Renderer} from "../renderers/renderer"
import * as p from "core/properties"

export abstract class DataRange extends Range {
  names: string[]
  renderers: Renderer[]
}

DataRange.prototype.type = "DataRange"

DataRange.define({
  names:     [ p.Array, [] ],
  renderers: [ p.Array, [] ],
})
