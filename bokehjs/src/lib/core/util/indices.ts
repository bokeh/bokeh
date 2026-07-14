import type {Arrayable} from "core/types"

/**
 * Allows to efficiently map back and forth between superset and subset indices.
 * E.g. with superset indices = [0, 1, 2, 3] the subset [1, 3] has subset indices [0, 1].
*/
export class SubsetIndexMapper {
  private readonly superset_to_subset: Int32Array
  private readonly subset_to_superset: Int32Array
  readonly size: number
  private size_subset: number

  constructor(size: number) {
    this.superset_to_subset = new Int32Array(size)
    this.subset_to_superset = new Int32Array(size)
    this.superset_to_subset.fill(-1)
    this.size = size
    this.size_subset = 0
  }

  set_subset(superset_indices: number[]): void {
    // reset existing entries
    for (let i = 0; i < this.size_subset; i++) {
      const old_superset_idx = this.subset_to_superset[i]
      this.superset_to_subset[old_superset_idx] = -1
    }

    this.size_subset = superset_indices.length
    for (let i = 0; i < this.size_subset; i++) {
      const superset_idx = superset_indices[i]
      this.subset_to_superset[i] = superset_idx
      this.superset_to_subset[superset_idx] = i
    }
  }

  get_subset_index(superset_index: number): number {
    if (!this.is_superset_index_in_bounds(superset_index)) {
      throw new Error(`Global index ${superset_index} is out of bounds`)
    }
    const subset_index = this.superset_to_subset[superset_index]
    if (subset_index === -1) {
      throw new Error(`No subset index found: Global_index ${superset_index} is not part of the subset.`)
    }
    return subset_index
  }

  has_subset_index(superset_index: number): boolean {
    return this.is_superset_index_in_bounds(superset_index) && this.superset_to_subset[superset_index] !== -1
  }

  get_superset_index(subset_index: number): number {
    if (!this.is_subset_index_in_bounds(subset_index)) {
      throw new Error(`Subset index ${subset_index} is out of bounds`)
    }
    const superset_index = this.subset_to_superset[subset_index]
    return superset_index
  }

  convert_indices_from_subset(subset_indices: number[]): number[] {
    return subset_indices.map((i) => this.get_superset_index(i))
  }

  convert_indices_to_subset(superset_indices: number[]): number[] {
    return superset_indices.map((i) => this.get_subset_index(i))
  }

  subset_index_of(array: Arrayable, value: unknown): number | null {
    for (let i = 0; i < this.size_subset; i++) {
      const superset_idx = this.subset_to_superset[i]
      if (array[superset_idx] === value) {
        return i
      }
    }
    return null
  }

  private is_superset_index_in_bounds(superset_index: number): boolean {
    return superset_index >= 0 && superset_index < this.size
  }

  private is_subset_index_in_bounds(subset_index: number): boolean {
    return subset_index >= 0 && subset_index < this.size_subset
  }
}
