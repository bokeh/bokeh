import {LayoutProvider} from "./layout_provider"
import type {NodeLayout} from "./layout_provider"
import type {GraphDataSource} from "../sources/graph_data_source"
import {dict} from "core/util/object"
import type * as p from "core/properties"
import {Float, Unknown, Arrayable as Arr, Dict, Mapping, Or} from "core/kinds"

export const GraphLayout = Or(Dict(Arr(Float)), Mapping(Unknown, Arr(Float)))
export type GraphLayout = typeof GraphLayout["__type__"]

export namespace StaticLayoutProvider {
  export type Attrs = p.AttrsOf<Props>

  export type Props = LayoutProvider.Props & {
    graph_layout: p.Property<GraphLayout>
  }
}

export interface StaticLayoutProvider extends StaticLayoutProvider.Attrs {}

export class StaticLayoutProvider extends LayoutProvider {
  declare properties: StaticLayoutProvider.Props

  static {
    this.define<StaticLayoutProvider.Props>(() => ({
      graph_layout: [ GraphLayout, new Map() ], // TODO: length == 2
    }))
  }

  protected _compute_layout(_source: GraphDataSource): NodeLayout {
    return new Map(dict(this.graph_layout))
  }
}
