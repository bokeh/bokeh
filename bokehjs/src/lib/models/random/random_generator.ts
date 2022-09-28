import {Model} from "../../model"
import {AbstractRandom} from "core/util/random"
import * as p from "core/properties"

export namespace RandomGenerator {
  export type Attrs = p.AttrsOf<Props>
  export type Props = Model.Props
}

export interface RandomGenerator extends RandomGenerator.Attrs {}

export abstract class RandomGenerator extends Model {
  override properties: RandomGenerator.Props

  constructor(attrs?: Partial<RandomGenerator.Attrs>) {
    super(attrs)
  }

  abstract generator(): AbstractRandom
}
