import {Range} from "./range"
import type {DataRenderer} from "../renderers/data_renderer"
import * as p from "core/properties"

export namespace DataRange {
  export type Attrs = p.AttrsOf<Props>

  export type Props = Range.Props & {
    /** @deprecated */
    names: p.Property<string[]>
    renderers: p.Property<DataRenderer[] | "auto">
  }
}

export interface DataRange extends DataRange.Attrs {}

export abstract class DataRange extends Range {
  override properties: DataRange.Props

  constructor(attrs?: Partial<DataRange.Attrs>) {
    super(attrs)
  }

  static init_DataRange(): void {
    this.define<DataRange.Props>(({String, Array, AnyRef}) => ({
      names:     [ Array(String), [] ],
      renderers: [ Array(AnyRef(/*DataRenderer*/)), [] ], // TODO: [] -> "auto"
    }))
  }
}
