import {DOMElement, DOMElementView} from "./dom_element"
import {CustomJS} from "../callbacks/customjs"
import {CustomJSHover} from "../tools/inspectors/customjs_hover"
import type {ColumnarDataSource} from "../sources/columnar_data_source"
import type {Index as DataIndex} from "core/util/templating"
import type * as p from "core/properties"
import type {Dict, PlainObject} from "core/types"
import {BuiltinFormatter} from "core/enums"
import {Or, Ref} from "core/kinds"

export const Formatter = Or(BuiltinFormatter, Ref(CustomJS), Ref(CustomJSHover))
export type Formatter = typeof Formatter["__type__"]

export type Formatters = Dict<Formatter>

export abstract class PlaceholderView extends DOMElementView {
  declare model: Placeholder

  static override tag_name = "span" as const

  abstract update(source: ColumnarDataSource, i: DataIndex | null, vars: PlainObject<unknown>, formatters?: Formatters): void
}

export namespace Placeholder {
  export type Attrs = p.AttrsOf<Props>
  export type Props = DOMElement.Props
}

export interface Placeholder extends Placeholder.Attrs {}

export abstract class Placeholder extends DOMElement {
  declare properties: Placeholder.Props
  declare __view_type__: PlaceholderView

  constructor(attrs?: Partial<Placeholder.Attrs>) {
    super(attrs)
  }
}
