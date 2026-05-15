
import type {Rect, TypedArrayConstructor, TypedArray} from "../types"
import {Indices} from "../types"
import {empty} from "./bbox"


/**
 * LUT-based Hilbert curve: xy → 32-bit Hilbert index on a 2^16 × 2^16 grid.
 *
 * Same output as the original branchless hilbert(), ~2× faster in a tight loop
 * because the 2 KB lookup table fits in L1 cache and stays hot across all N calls.
 *
 * Algorithm (ported from the fast-hilbert / threadlocalmutex approach):
 *   The 2D Hilbert curve is a state machine with 4 orientations.
 *   At each step we consume 4 bits of x and 4 bits of y (8 bits total = 1 Morton byte),
 *   emit 8 bits of Hilbert output, and transition to the next state.
 *   16 input bits ÷ 4 bits/step = 4 steps total (fully unrolled).
 *
 * LUT derivation:
 *   Built from first principles by probing the reference branchless function
 *   to derive the 4-state machine transitions, then composing 4 single-bit
 *   steps into one 4-bit step. Verified exhaustively against the reference on
 *   the full 8-bit grid (256×256) and 100k random 16-bit samples.
 */

// ─── LUT construction (runs once at module load, ~2 KB) ──────────────────────

// 1-bit state machine: index = state(2b) << 2 | xb(1b) << 1 | yb(1b) → next_state(2b) << 2 | h(2b)
// Derived by probing the reference function for all 4 orientation states.
const _LUT1 = new Uint8Array([
//  (s=0)         (s=1)         (s=2)          (s=3)
    4, 1, 15, 2,  0, 11, 5, 6,  10, 7, 9, 12,  14, 13, 3, 8,
])

// 4-bit state machine: compose 4 consecutive 1-bit steps.
// index  = state(2b) << 8 | x4(4b) << 4 | y4(4b)   → 1024 Uint16 entries
// value  = next_state(2b) << 8 | h8(8b)
// Size: 1024 × 2 bytes = 2 KB — comfortably in L1 cache.
const HILBERT_LUT: Uint16Array = (() => {
    const lut = new Uint16Array(1024)
    for (let state = 0; state < 4; state++) {
        for (let x4 = 0; x4 < 16; x4++) {
            for (let y4 = 0; y4 < 16; y4++) {
                let s = state
                let hOut = 0
                // Process 4 bit-pairs MSB first
                for (let bit = 3; bit >= 0; bit--) {
                    const e = _LUT1[(s << 2) | (((x4 >>> bit) & 1) << 1) | ((y4 >>> bit) & 1)]
                    hOut = (hOut << 2) | (e & 3)
                    s = e >>> 2
                }
                lut[(state << 8) | (x4 << 4) | y4] = (s << 8) | hOut
            }
        }
    }
    return lut
})()

export function compute_hilbert(x: number, y: number): number {
    let e: number
    let s = 0
    let h = 0
    e = HILBERT_LUT[(s << 8) | (((x >>> 12) & 15) << 4) | ((y >>> 12) & 15)]
    h = (h << 8) | (e & 255)
    s = e >>> 8
    e = HILBERT_LUT[(s << 8) | (((x >>>  8) & 15) << 4) | ((y >>>  8) & 15)]
    h = (h << 8) | (e & 255)
    s = e >>> 8
    e = HILBERT_LUT[(s << 8) | (((x >>>  4) & 15) << 4) | ((y >>>  4) & 15)]
    h = (h << 8) | (e & 255)
    s = e >>> 8
    e = HILBERT_LUT[(s << 8) | (((x       ) & 15) << 4) | ((y      ) & 15)]
    h = (h << 8) | (e & 255)
    return h >>> 0
}


export class SpatialIndex {
  private readonly _bytes_metadata = 0

  private coordinates_per_item: number
  private shift_factor_item: number
  private n_items: number
  private node_size: number
  private _tree_level_bounds: number[]
  private _n_total_nodes: number
  private array_type_coordinates: TypedArrayConstructor
  private array_type_indices: Uint16ArrayConstructor | Uint32ArrayConstructor

  private minX: number
  private minY: number
  private maxX: number
  private maxY: number
  private _coordinate_index_position: number

  // buffer layout: [metadata - coordinate rects - coordinate indices]
  private _data_byte_buffer: ArrayBuffer
  private coordinate_rects: TypedArray
  private _indices: Uint16Array | Uint32Array

  constructor(n_items: number, node_size: number = 16, array_type_coordinates: TypedArrayConstructor = Float64Array) {
    if (!Number.isInteger(n_items) || n_items < 0) {
        throw new Error(`Invalid coordinates count: ${n_items}. Value must be a non-negative integer.`)
    }

    if (!Number.isInteger(node_size) || node_size < 0) {
        throw new Error(`Invalid node_size: ${node_size}. Value must be a non-negative integer.`)
    }

    // 4 coordinates values per rect -> bitshift by 2 (or multiply by 4) to transform index
    this.coordinates_per_item = 4
    this.shift_factor_item = 2

    this.n_items = n_items
    this.node_size = Math.min(Math.max(node_size, 2), 65535)
    this.array_type_coordinates = array_type_coordinates

    this._init_tree_structure()
    this.array_type_indices = this._n_total_nodes < 16384 ? Uint16Array : Uint32Array
    this._configure_data_buffer()

    this.minX = Infinity
    this.minY = Infinity
    this.maxX = -Infinity
    this.maxY = -Infinity
    this._coordinate_index_position = 0
  }

  _init_tree_structure(): void {
    let node_count = this.n_items
    let nodes_last_level = node_count
    const cumulative_nodes_per_level = [nodes_last_level]

    while(nodes_last_level !== 1) {
        const nodes_this_level = Math.ceil(nodes_last_level / this.node_size)
        node_count += nodes_this_level
        cumulative_nodes_per_level.push(node_count)
        nodes_last_level = nodes_this_level
    }

    this._tree_level_bounds = cumulative_nodes_per_level.map(x => x * this.coordinates_per_item)
    this._n_total_nodes = node_count
  }

  _configure_data_buffer(): void {
    const bytes_per_coordinate_value = this.array_type_coordinates.BYTES_PER_ELEMENT
    const n_total_coordinate_values = this._n_total_nodes * this.coordinates_per_item
    const n_bytes_nodes = n_total_coordinate_values * bytes_per_coordinate_value

    const bytes_per_index_value = this.array_type_indices.BYTES_PER_ELEMENT
    const n_bytes_indices = this._n_total_nodes * bytes_per_index_value

    const n_total_bytes = this._bytes_metadata + n_bytes_nodes + n_bytes_indices

    this._data_byte_buffer = new ArrayBuffer(n_total_bytes)
    this.coordinate_rects = new this.array_type_coordinates(this._data_byte_buffer, this._bytes_metadata, n_total_coordinate_values)
    this._indices = new this.array_type_indices(this._data_byte_buffer, this._bytes_metadata + n_bytes_nodes, this._n_total_nodes)
  }

  add_rect(x0: number, y0: number, x1: number, y1: number): void {
    if (!isFinite(x0 + y0 + x1 + y1)) {
      this.add_empty()
    } else {
      const {_indices, coordinate_rects} = this
      const index = this._coordinate_index_position >> this.shift_factor_item

      _indices[index] = index
      coordinate_rects[this._coordinate_index_position++] = x0
      coordinate_rects[this._coordinate_index_position++] = y0
      coordinate_rects[this._coordinate_index_position++] = x1
      coordinate_rects[this._coordinate_index_position++] = y1

      if (x0 < this.minX) this.minX = x0
      if (y0 < this.minY) this.minY = y0
      if (x1 > this.maxX) this.maxX = x1
      if (y1 > this.maxY) this.maxY = y1
    }
  }

  add_point(x: number, y: number) {
    this.add_rect(x, y, x, y)
  }

  add_empty(): void {
    this.add_rect(Infinity, Infinity, -Infinity, -Infinity)
  }

  build_index(): void {
    const {n_items, coordinate_rects, minX, minY, maxX, maxY}  = this
    const index = this._coordinate_index_position >> this.shift_factor_item

    if (index !== n_items) {
        throw new Error(`Index is at wrong position, added ${index} items when expected ${n_items}.`)
    }

    if (n_items <= this.node_size) {
        // single and therefore the root node
        coordinate_rects[this._coordinate_index_position++] = minX
        coordinate_rects[this._coordinate_index_position++] = minY
        coordinate_rects[this._coordinate_index_position++] = maxX
        coordinate_rects[this._coordinate_index_position++] = maxY
        return
    }

    this._optimize_item_order()
    this._generate_internal_tree_nodes()
  }

  finish(): void {
    this.build_index()
  }

  protected _normalize(rect: Rect): Rect {
    let {x0, y0, x1, y1} = rect
    if ((x0 > x1) && isFinite(x0 + x1)) {
      [x0, x1] = [x1, x0]
    }
    if ((y0 > y1) && isFinite(y0 + y1)) {
      [y0, y1] = [y1, y0]
    }
    return {x0, y0, x1, y1}
  }

  get bbox(): Rect {
    const {minX, minY, maxX, maxY} = this
    return {x0: minX, y0: minY, x1: maxX, y1: maxY}
  }

  indices(rect: Rect): Indices {
    const {x0, y0, x1, y1} = this._normalize(rect)
    const result = new Indices(this.n_items)
    this.search(x0, y0, x1, y1, (index) => {
      result.set_unchecked(index)
      return false
    })
    return result
  }

  bounds(rect: Rect): Rect {
    const {x0, y0, x1, y1} = this._normalize(rect)
    const result = empty()
    this.search(x0, y0, x1, y1, (_, node_x0, node_y0, node_x1, node_y1) => {
      if (node_x0 >= x0 && node_x0 < result.x0) {
        result.x0 = node_x0
      }
      if (node_x1 <= x1 && node_x1 > result.x1) {
        result.x1 = node_x1
      }
      if (node_y0 >= y0 && node_y0 < result.y0) {
        result.y0 = node_y0
      }
      if (node_y1 <= y1 && node_y1 > result.y1) {
        result.y1 = node_y1
      }
      return false
    })
    return result
  }

  search(
      minX: number,
      minY: number,
      maxX: number,
      maxY: number,
      leaf_fn: (index: number, x0: number, y0: number, x1: number, y1: number) => boolean
  ): void {
    const {_coordinate_index_position, coordinate_rects} = this

    if (_coordinate_index_position !== coordinate_rects.length) {
        throw new Error('Data not yet indexed - call finish().')
    }

    const node_index = coordinate_rects.length - 4

    this._searchRecursive(minX, minY, maxX, maxY, node_index, leaf_fn)
  }

  _searchRecursive(
      minX: number,
      minY: number,
      maxX: number,
      maxY: number,
      node_index: number,
      leaf_fn: (index: number, x0: number, y0: number, x1: number, y1: number) => boolean
  ): void {

    const {n_items, node_size, coordinate_rects, _indices, _tree_level_bounds} = this
    const end = Math.min(node_index + node_size * 4, SpatialIndex._upperBound(node_index, _tree_level_bounds));

    // search through child nodes
    for (let pos = node_index; pos < end; pos += 4) {
        // check if node bbox intersects with query bbox
        const x0 = coordinate_rects[pos];
        if (maxX < x0) continue;
        const y0 = coordinate_rects[pos + 1];
        if (maxY < y0) continue;
        const x1 = coordinate_rects[pos + 2];
        if (minX > x1) continue;
        const y1 = coordinate_rects[pos + 3];
        if (minY > y1) continue;

        const index = _indices[pos >> 2] | 0;

        if (node_index >= n_items * 4) {
            // check if node bbox is completely inside query bbox
            if (minX <= x0 && minY <= y0 && maxX >= x1 && maxY >= y1) {
                this._addAllLeavesOfNode(pos, leaf_fn);
            } else {
                this._searchRecursive(minX, minY, maxX, maxY, index, leaf_fn);
            }
        } else {
            leaf_fn(index, x0, y0, x1, y1)// leaf item
        }
    }
  }

  private _addAllLeavesOfNode(
      pos: number,
      leaf_fn: (index: number, x0: number, y0: number, x1: number, y1: number) => boolean
  ): void {
    let posStart = pos
    let posEnd = pos

    const {n_items, node_size, coordinate_rects, _indices, _tree_level_bounds} = this

    // depth search while not leaf
    while (posStart >= n_items * 4) {
        posStart = _indices[posStart >> 2] | 0
        const posEndStart = _indices[posEnd >> 2] | 0
        posEnd = Math.min(posEndStart + node_size * 4, SpatialIndex._upperBound(posEndStart, _tree_level_bounds)) - 4
    }

    for (let leafPos = posStart; leafPos <= posEnd; leafPos += 4) {
        const leafIndex = this._indices[leafPos >> 2]
        leaf_fn(leafIndex, coordinate_rects[leafPos], coordinate_rects[leafPos + 1], coordinate_rects[leafPos + 2], coordinate_rects[leafPos + 3])
    }
  }

  private static _upperBound(value: number, arr: number[]): number {
    let lo = 0
    let hi = arr.length - 1
    while (lo < hi) {
        const mid = (lo + hi) >> 1
        if (arr[mid] > value) hi = mid
        else lo = mid + 1
    }
    return arr[lo]
  }

  _optimize_item_order(): void {
    const {n_items} = this
    const hilbert_values = new Uint32Array(n_items)

    this._compute_hilbert_values(hilbert_values)
    // sort items by their Hilbert value
    this._sort_by_hilbert_values(hilbert_values)
  }

  private _compute_hilbert_values(hilbert_values: Uint32Array) {
    const {n_items, coordinate_rects, minX, minY, maxX, maxY} = this

    const width = (maxX - minX) || 1
    const height = (maxY - minY) || 1
    const hilbertMax = (1 << 16) - 1
    const scaleX = hilbertMax / width
    const scaleY = hilbertMax / height

    // calculate Hilbert values from rect center
    for (let i = 0, pos = 0; i < n_items; i++) {
        const _minX = coordinate_rects[pos++]
        const _minY = coordinate_rects[pos++]
        const _maxX = coordinate_rects[pos++]
        const _maxY = coordinate_rects[pos++]
        const x_center = (_minX + _maxX) * 0.5
        const y_center = (_minY + _maxY) * 0.5
        const x = Math.floor((x_center - minX) * scaleX)
        const y = Math.floor((y_center - minY) * scaleY)
        hilbert_values[i] = compute_hilbert(x, y)
    }
  }

  private _sort_by_hilbert_values(hilbert_values: Uint32Array): void {
    const {n_items, coordinate_rects, _indices, node_size} = this
    const stack = [0, n_items - 1]
    while (stack.length) {
        const r = stack.pop()!
        const l = stack.pop()!
        if (r - l <= node_size && Math.floor(l / node_size) >= Math.floor(r / node_size)) continue

        const a = hilbert_values[l]
        const b = hilbert_values[(l + r) >> 1]
        const c = hilbert_values[r]
        const pivot = ((a > b) !== (a > c)) ? a :
            ((b < a) !== (b < c)) ? b : c

        let i = l - 1
        let j = r + 1
        while (true) {
            do i++; while (hilbert_values[i] < pivot)
            do j--; while (hilbert_values[j] > pivot)
            if (i >= j) break
            SpatialIndex._swap(hilbert_values, coordinate_rects, _indices, i, j)
        }

        stack.push(l, j, j + 1, r)
    }
  }

  private static _swap<T extends Uint16Array | Uint32Array, U extends TypedArray>(hilbertValues: Uint32Array, coordinate_rects: U, _indices: T, i: number, j: number): void {
    const temp = hilbertValues[i]
    hilbertValues[i] = hilbertValues[j]
    hilbertValues[j] = temp

    const k = i << 2
    const m = j << 2
    const a = coordinate_rects[k]
    const b = coordinate_rects[k + 1]
    const c = coordinate_rects[k + 2]
    const d = coordinate_rects[k + 3]
    coordinate_rects[k]     = coordinate_rects[m]
    coordinate_rects[k + 1] = coordinate_rects[m + 1]
    coordinate_rects[k + 2] = coordinate_rects[m + 2]
    coordinate_rects[k + 3] = coordinate_rects[m + 3]
    coordinate_rects[m]     = a
    coordinate_rects[m + 1] = b
    coordinate_rects[m + 2] = c
    coordinate_rects[m + 3] = d

    const e = _indices[i]
    _indices[i] = _indices[j]
    _indices[j] = e
  }

  _generate_internal_tree_nodes(): void {
    // build tree bottom up
    const {node_size, _tree_level_bounds, coordinate_rects, _indices, shift_factor_item} = this

    let pos = 0
    for (let i = 0; i < _tree_level_bounds.length - 1; i++) {
      const level_end = _tree_level_bounds[i]

      while (pos < level_end) {
        const index_node = pos

        // calculate new node
        let node_x0 = Infinity
        let node_y0 = Infinity
        let node_x1 = -Infinity
        let node_y1 = -Infinity
        for (let j = 0; j < node_size && pos < level_end; j++) {
          node_x0 = Math.min(node_x0, coordinate_rects[pos++])
          node_y0 = Math.min(node_y0, coordinate_rects[pos++])
          node_x1 = Math.max(node_x1, coordinate_rects[pos++])
          node_y1 = Math.max(node_y1, coordinate_rects[pos++])
        }

        // set new node in tree structure
        _indices[this._coordinate_index_position >> shift_factor_item] = index_node
        coordinate_rects[this._coordinate_index_position++] = node_x0
        coordinate_rects[this._coordinate_index_position++] = node_y0
        coordinate_rects[this._coordinate_index_position++] = node_x1
        coordinate_rects[this._coordinate_index_position++] = node_y1
      }
    }
  }
}
