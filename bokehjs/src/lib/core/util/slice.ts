import type {Serializable, Serializer, SliceRep} from "../serialization"
import {serialize} from "../serialization"

export class Slice implements Serializable {
  readonly start: number | null
  readonly stop: number | null
  readonly step: number | null

  constructor({start, stop, step}: {start?: number | null, stop?: number | null, step?: number | null} = {}) {
    this.start = start ?? null
    this.stop = stop ?? null
    this.step = step ?? null
  }

  [serialize](serializer: Serializer): SliceRep {
    return {
      type: "slice",
      start: serializer.encode(this.start) as number | null,
      stop: serializer.encode(this.stop) as number | null,
      step: serializer.encode(this.step) as number | null,
    }
  }
}
