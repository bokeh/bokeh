import {Model} from "../../model"
import type * as p from "core/properties"
import {keys, values} from "core/util/object"
import {use_strict} from "core/util/string"
import type {BBox} from "core/util/bbox"
import {isIterable} from "core/util/types"
import type {Dict} from "core/types"
import {IndicesMask, GeneratorFunction} from "core/types"

export type DistanceMeasure = (i: number, j: number) => number

export namespace LabelingPolicy {
  export type Attrs = p.AttrsOf<Props>
  export type Props = Model.Props
}

export interface LabelingPolicy extends LabelingPolicy.Attrs {}

export abstract class LabelingPolicy extends Model {
  declare properties: LabelingPolicy.Props

  constructor(attrs?: Partial<LabelingPolicy.Attrs>) {
    super(attrs)
  }

  abstract filter(indices_mask: IndicesMask, bboxes: BBox[], distance: DistanceMeasure): IndicesMask
}

export namespace AllLabels {
  export type Attrs = p.AttrsOf<Props>
  export type Props = LabelingPolicy.Props
}

export interface AllLabels extends AllLabels.Attrs {}

export class AllLabels extends LabelingPolicy {
  declare properties: AllLabels.Props

  constructor(attrs?: Partial<AllLabels.Attrs>) {
    super(attrs)
  }

  filter(indices_mask: IndicesMask, _bboxes: BBox[], _distance: DistanceMeasure): IndicesMask {
    return indices_mask
  }
}

export namespace NoOverlap {
  export type Attrs = p.AttrsOf<Props>
  export type Props = LabelingPolicy.Props & {
    min_distance: p.Property<number>
  }
}

export interface NoOverlap extends NoOverlap.Attrs {}

export class NoOverlap extends LabelingPolicy {
  declare properties: NoOverlap.Props

  constructor(attrs?: Partial<NoOverlap.Attrs>) {
    super(attrs)
  }

  static {
    this.define<NoOverlap.Props>(({Float}) => ({
      min_distance: [ Float, 5 ],
    }))
  }

  filter(indices_mask: IndicesMask, _bboxes: BBox[], distance: DistanceMeasure): IndicesMask {
    const {min_distance} = this
    let k = null
    for (const i of indices_mask) {
      if (k != null && distance(k, i) < min_distance) {
        indices_mask.unset(i)
      } else {
        k = i
      }
    }
    return indices_mask
  }
}

export namespace CustomLabelingPolicy {
  export type Attrs = p.AttrsOf<Props>

  export type Props = LabelingPolicy.Props & {
    args: p.Property<Dict<unknown>>
    code: p.Property<string>
  }
}

export interface CustomLabelingPolicy extends CustomLabelingPolicy.Attrs {}

export class CustomLabelingPolicy extends LabelingPolicy {
  declare properties: CustomLabelingPolicy.Props

  constructor(attrs?: Partial<CustomLabelingPolicy.Attrs>) {
    super(attrs)
  }

  static {
    this.define<CustomLabelingPolicy.Props>(({Unknown, Str, Dict}) => ({
      args: [ Dict(Unknown), {} ],
      code: [ Str, "" ],
    }))
  }

  get names(): string[] {
    return keys(this.args)
  }

  get values(): unknown[] {
    return values(this.args)
  }

  get func(): GeneratorFunction {
    const code = use_strict(this.code)
    return new GeneratorFunction("indices", "bboxes", "distance", ...this.names, code)
  }

  filter(indices_mask: IndicesMask, bboxes: BBox[], distance: DistanceMeasure): IndicesMask {
    const obj = Object.create(null)
    const generator = this.func.call(obj, indices_mask, bboxes, distance, ...this.values)

    let result = generator.next()
    if ((result.done ?? false) && result.value !== undefined) {
      const {value} = result
      if (value instanceof IndicesMask) {
        return value
      } else if (value === undefined) {
        return indices_mask
      } else if (isIterable(value)) {
        return IndicesMask.from_indices(indices_mask.size, value as Iterable<number>)
      } else {
        return IndicesMask.all_unset(indices_mask.size)
      }
    } else {
      const array: number[] = []

      do {
        array.push(result.value)
        result = generator.next()
      } while (!(result.done ?? false))

      return IndicesMask.from_indices(indices_mask.size, array)
    }
  }
}
