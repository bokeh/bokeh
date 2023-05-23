import {Scale} from "./scale"
import type * as p from "core/properties"

export namespace ContinuousScale {
  export type Attrs = p.AttrsOf<Props>

  export type Props = Scale.Props
}

export interface ContinuousScale extends ContinuousScale.Attrs {}

export abstract class ContinuousScale extends Scale<number> {
  declare properties: ContinuousScale.Props

  constructor(attrs?: Partial<ContinuousScale.Attrs>) {
    super(attrs)
  }
}
