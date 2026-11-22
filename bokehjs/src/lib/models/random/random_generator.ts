import {Model} from "../../model"
import type {AbstractRandom} from "core/util/random"
import type * as p from "core/properties"

export namespace RandomGenerator {
  export type Attrs = p.AttrsOf<Props>
  export type Props = Model.Props
}

export interface RandomGenerator extends RandomGenerator.Attrs {}

export abstract class RandomGenerator extends Model {
  declare properties: RandomGenerator.Props

  abstract generator(): AbstractRandom
}
