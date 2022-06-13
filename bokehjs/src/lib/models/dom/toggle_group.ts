import {Action, ActionView} from "./action"
import {RendererGroup} from "../renderers/renderer"
import {ColumnarDataSource} from "../sources/columnar_data_source"
import {Index as DataIndex} from "core/util/templating"
import {enumerate} from "core/util/iterator"
import * as p from "core/properties"

export class ToggleGroupView extends ActionView {
  override model: ToggleGroup

  update(_source: ColumnarDataSource, i: DataIndex | null, _vars: object/*, formatters?: Formatters*/): void {
    for (const [group, j] of enumerate(this.model.groups)) {
      group.visible = i == j
    }
  }
}

export namespace ToggleGroup {
  export type Attrs = p.AttrsOf<Props>
  export type Props = Action.Props & {
    groups: p.Property<RendererGroup[]>
  }
}

export interface ToggleGroup extends ToggleGroup.Attrs {}

export class ToggleGroup extends Action {
  override properties: ToggleGroup.Props
  override __view_type__: ToggleGroupView

  constructor(attrs?: Partial<ToggleGroup.Attrs>) {
    super(attrs)
  }

  static {
    this.prototype.default_view = ToggleGroupView
    this.define<ToggleGroup.Props>(({Array, Ref}) => ({
      groups: [ Array(Ref(RendererGroup)), [] ],
    }))
  }
}
