import {Model} from "../../model"
import type {ColumnarDataSource} from "../sources/columnar_data_source"
import type {Index as DataIndex} from "core/util/templating"
import {View} from "core/view"
import type * as p from "core/properties"

export abstract class ActionView extends View {
  declare model: Action

  abstract update(source: ColumnarDataSource, i: DataIndex | null, vars: object/*, formatters?: Formatters*/): void
}

export namespace Action {
  export type Attrs = p.AttrsOf<Props>
  export type Props = Model.Props
}

export interface Action extends Action.Attrs {}

export abstract class Action extends Model {
  declare properties: Action.Props
  declare __view_type__: ActionView
  static override __module__ = "bokeh.models.dom"

  constructor(attrs?: Partial<Action.Attrs>) {
    super(attrs)
  }
}
