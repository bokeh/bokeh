import type {Arrayable} from "core/types"
import {assert} from "core/util/assert"

export class SubsetIndexMapper {
  private readonly global_to_subset: Int32Array
  private readonly subset_to_global: Int32Array
  readonly size: number
  private size_subset: number

  constructor(size: number) {
    this.global_to_subset = new Int32Array(size)
    this.subset_to_global = new Int32Array(size)
    this.global_to_subset.fill(-1)
    this.size = size
    this.size_subset = 0
  }

  set_subset(global_indices: number[]): void {
    // reset existing entries
    for (let i = 0; i < this.size_subset; i++) {
      const old_global_idx = this.subset_to_global[i]
      this.global_to_subset[old_global_idx] = -1
    }

    this.size_subset = global_indices.length
    for (let i = 0; i < this.size_subset; i++) {
      const global_idx = global_indices[i]
      this.subset_to_global[i] = global_idx
      this.global_to_subset[global_idx] = i
    }
  }

  get_subset_index(global_index: number): number {
    assert(this.is_global_index_in_bounds(global_index), `Global index ${global_index} is out of bounds`)
    const subset_index = this.global_to_subset[global_index]
    if (subset_index === -1) {
      throw new Error(`No subset index found: Global_index ${global_index} is not part of the subset.`)
    }
    return subset_index
  }

  has_subset_index(global_index: number): boolean {
    return this.is_global_index_in_bounds(global_index) && this.global_to_subset[global_index] !== -1
  }

  get_global_index(subset_index: number): number {
    assert(this.is_subset_index_in_bounds(subset_index), `Subset index ${subset_index} is out of bounds`)
    const global_index = this.subset_to_global[subset_index]
    return global_index
  }

  convert_indices_from_subset(subset_indices: number[]): number[] {
    return subset_indices.map((i) => this.get_global_index(i))
  }

  convert_indices_to_subset(global_indices: number[]): number[] {
    return global_indices.map((i) => this.get_subset_index(i))
  }

  subset_index_of(array: Arrayable, value: unknown): number | null {
    for (let i = 0; i < this.size_subset; i++) {
      const global_idx = this.subset_to_global[i]
      if (array[global_idx] === value) {
        return i
      }
    }
    return null
  }

  private is_global_index_in_bounds(global_index: number): boolean {
    return global_index >= 0 && global_index < this.size
  }

  private is_subset_index_in_bounds(subset_index: number): boolean {
    return subset_index >= 0 && subset_index < this.size_subset
  }
}
