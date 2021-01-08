import {Model} from "../../model"
import * as p from "core/properties"
import {keys, values} from "core/util/object"
import {use_strict} from "core/util/string"
import {BBox} from "core/util/bbox"
import {isIterable} from "core/util/types"
import {Indices, GeneratorFunction} from "core/types"

export type DistanceMeasure = (i: number, j: number) => number

export namespace LabelingPolicy {
  export type Attrs = p.AttrsOf<Props>
  export type Props = Model.Props
}

export interface LabelingPolicy extends LabelingPolicy.Attrs {}

export abstract class LabelingPolicy extends Model {
  properties: LabelingPolicy.Props

  constructor(attrs?: Partial<LabelingPolicy.Attrs>) {
    super(attrs)
  }

  abstract filter(indices: Indices, bboxes: BBox[], distance: DistanceMeasure): Indices
}

export namespace AllLabels {
  export type Attrs = p.AttrsOf<Props>
  export type Props = LabelingPolicy.Props
}

export interface AllLabels extends AllLabels.Attrs {}

export class AllLabels extends LabelingPolicy {
  properties: AllLabels.Props

  constructor(attrs?: Partial<AllLabels.Attrs>) {
    super(attrs)
  }

  filter(indices: Indices, _bboxes: BBox[], _distance: DistanceMeasure): Indices {
    return indices
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
  properties: NoOverlap.Props

  constructor(attrs?: Partial<NoOverlap.Attrs>) {
    super(attrs)
  }

  static init_NoOverlap(): void {
    this.define<NoOverlap.Props>(({Number}) => ({
      min_distance: [ Number, 5 ],
    }))
  }

  filter(indices: Indices, _bboxes: BBox[], distance: DistanceMeasure): Indices {
    const {min_distance} = this
    let k = null
    for (const i of indices) {
      if (k != null && distance(k, i) < min_distance)
        indices.unset(i)
      else
        k = i
    }
    return indices
  }
}

export namespace CustomLabelingPolicy {
  export type Attrs = p.AttrsOf<Props>

  export type Props = LabelingPolicy.Props & {
    args: p.Property<{[key: string]: unknown}>
    code: p.Property<string>
  }
}

export interface CustomLabelingPolicy extends CustomLabelingPolicy.Attrs {}

export class CustomLabelingPolicy extends LabelingPolicy {
  properties: CustomLabelingPolicy.Props

  constructor(attrs?: Partial<CustomLabelingPolicy.Attrs>) {
    super(attrs)
  }

  static init_CustomLabelingPolicy(): void {
    this.define<CustomLabelingPolicy.Props>(({Unknown, String, Dict}) => ({
      args: [ Dict(Unknown), {} ],
      code: [ String, "" ],
    }))
  }

  get names(): string[] {
    return keys(this.args)
  }

  get values(): any[] {
    return values(this.args)
  }

  get func(): GeneratorFunction {
    const code = use_strict(this.code)
    return new GeneratorFunction("indices", "bboxes", "distance", ...this.names, code)
  }

  filter(indices: Indices, bboxes: BBox[], distance: DistanceMeasure): Indices {
    const obj = Object.create(null)
    const generator = this.func.call(obj, indices, bboxes, distance, ...this.values)

    let result = generator.next()
    if (result.done && result.value !== undefined) {
      const {value} = result
      if (value instanceof Indices)
        return value
      else if (value === undefined)
        return indices
      else if (isIterable(value))
        return Indices.from_indices(indices.size, value as Iterable<number>)
      else
        return Indices.all_unset(indices.size)
    } else {
      const array: number[] = []

      do {
        array.push(result.value)
        result = generator.next()
      } while (!result.done)

      return Indices.from_indices(indices.size, array)
    }
  }
}
