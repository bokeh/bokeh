import {Model} from "../../model"
import {ColumnarDataSource} from "../sources/columnar_data_source"
import {Index as DataIndex} from "core/util/templating"
import {View} from "core/view"
import * as p from "core/properties"

export abstract class ActionView extends View {
  override model: Action

  abstract update(source: ColumnarDataSource, i: DataIndex | null, vars: object/*, formatters?: Formatters*/): void
}

export namespace Action {
  export type Attrs = p.AttrsOf<Props>
  export type Props = Model.Props
}

export interface Action extends Action.Attrs {}

export abstract class Action extends Model {
  override properties: Action.Props
  override __view_type__: ActionView
  static override __module__ = "bokeh.models.dom"

  constructor(attrs?: Partial<Action.Attrs>) {
    super(attrs)
  }
}
