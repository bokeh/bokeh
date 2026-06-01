import type {Arrayable} from "core/types"

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

  get_subset_index(global_index: number): number | undefined {
    const subset_index = this.global_to_subset[global_index] as number | undefined
    return subset_index !== undefined && subset_index != -1 ? subset_index : undefined
  }

  has_subset_index(index: number): boolean {
    return this.get_subset_index(index) !== undefined
  }

  get_global_index(subset_index: number): number | undefined {
    const global_index = this.subset_to_global[subset_index] as number | undefined
    return global_index !== undefined ? global_index : undefined
  }

  convert_indices_from_subset(subset_indices: number[]): number[] {
    return subset_indices.map((i) => this.get_global_index(i)!)
  }

  convert_indices_to_subset(global_indices: number[]): number[] {
    return global_indices.map((i) => this.get_subset_index(i)!)
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
}
