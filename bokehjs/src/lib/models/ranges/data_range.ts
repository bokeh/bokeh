import {Range} from "./range"
import {Renderer} from "../renderers/renderer"
import * as p from "core/properties"

export namespace DataRange {
  export type Attrs = p.AttrsOf<Props>

  export type Props = Range.Props & {
    names: p.Property<string[]>
    renderers: p.Property<Renderer[]>
  }
}

export interface DataRange extends DataRange.Attrs {}

export abstract class DataRange extends Range {
  properties: DataRange.Props

  constructor(attrs?: Partial<DataRange.Attrs>) {
    super(attrs)
  }

  static initClass(): void {
    this.define<DataRange.Props>({
      names:     [ p.Array, [] ],
      renderers: [ p.Array, [] ],
    })
  }
}
DataRange.initClass()
