import {RandomGenerator} from "./random_generator"
import {AbstractRandom, LCGRandom} from "core/util/random"
import * as p from "core/properties"

export namespace ParkMillerLCG {
  export type Attrs = p.AttrsOf<Props>

  export type Props = RandomGenerator.Props & {
    seed: p.Property<number | null>
  }
}

export interface ParkMillerLCG extends ParkMillerLCG.Attrs {}

export class ParkMillerLCG extends RandomGenerator {
  override properties: ParkMillerLCG.Props

  constructor(attrs?: Partial<ParkMillerLCG.Attrs>) {
    super(attrs)
  }

  static {
    this.define<ParkMillerLCG.Props>(({Int, Nullable}) => ({
      seed: [ Nullable(Int), null ],
    }))
  }

  generator(): AbstractRandom {
    return new LCGRandom(this.seed ?? Date.now())
  }
}
