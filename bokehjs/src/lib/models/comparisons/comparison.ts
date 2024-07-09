import {Model} from "../../model"
import type * as p from "core/properties"

export namespace Comparison {
  export type Attrs = p.AttrsOf<Props>

  export type Props = Model.Props
}

export interface Comparison extends Comparison.Attrs {}

export abstract class Comparison extends Model {
  declare properties: Comparison.Props

  constructor(attrs?: Partial<Comparison.Attrs>) {
    super(attrs)
  }

  override initialize(): void {
    super.initialize()
  }

  protected abstract compute(_x: any, _y: any): number
}
