import {Range} from "./range"
import type {DataRenderer} from "../renderers/data_renderer"
import type * as p from "core/properties"

export namespace DataRange {
  export type Attrs = p.AttrsOf<Props>

  export type Props = Range.Props & {
    renderers: p.Property<DataRenderer[] | "auto">
  }
}

export interface DataRange extends DataRange.Attrs {}

export abstract class DataRange extends Range {
  declare properties: DataRange.Props

  constructor(attrs?: Partial<DataRange.Attrs>) {
    super(attrs)
  }

  static {
    this.define<DataRange.Props>(({Array, AnyRef, Or, Auto}) => ({
      renderers: [ Or(Array(AnyRef<DataRenderer>()), Auto), [] ],
    }))
  }
}
