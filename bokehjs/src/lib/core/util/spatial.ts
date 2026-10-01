import type {Rect, TypedArrayConstructor, TypedArray} from "../types"
import {Indices} from "../types"
import {empty} from "./bbox"

type LeafFn = (index: number, x0: number, y0: number, x1: number, y1: number) => boolean

/*
 Algorithm (ported from https://github.com/rawrunprotected/hilbert_curves & https://github.com/becheran/fast-hilbert)

 Copyright (c) 2021 Armin Becher

 Permission is hereby granted, free of charge, to any person obtaining a copy
 of this software and associated documentation files (the "Software"), to deal
 in the Software without restriction, including without limitation the rights
 to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 copies of the Software, and to permit persons to whom the Software is
 furnished to do so, subject to the following conditions:

 The above copyright notice and this permission notice shall be included in all
 copies or substantial portions of the Software.

 THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 SOFTWARE.

 LUT-based Hilbert curve: xy → 32-bit Hilbert index on a 2^16 × 2^16 grid.

 The 2D Hilbert curve is a state machine with 4 orientations.
 At each step we consume 4 bits of x and 4 bits of y (8 bits total = 1 Morton byte),
 emit 8 bits of Hilbert output, and transition to the next state.
 16 input bits ÷ 4 bits/step = 4 steps total (fully unrolled).
*/

// 1-bit state machine: index = state(2b) << 2 | xb(1b) << 1 | yb(1b) → next_state(2b) << 2 | h(2b)
// Derived by probing the reference function for all 4 orientation states.
const _LUT1 = new Uint8Array([
//  (s=0)         (s=1)         (s=2)          (s=3)
  4, 1, 15, 2,  0, 11, 5, 6,  10, 7, 9, 12,  14, 13, 3, 8,
])

// 4-bit state machine: compose 4 consecutive 1-bit steps.
// index  = state(2b) << 8 | x4(4b) << 4 | y4(4b)   → 1024 Uint16 entries
// value  = next_state(2b) << 8 | h8(8b)
// Size: 1024 × 2 bytes = 2 KB — fits into L1 cache.
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

function compute_hilbert(x: number, y: number): number {
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
  e = HILBERT_LUT[(s << 8) | (((x) & 15) << 4) | ((y) & 15)]
  h = (h << 8) | (e & 255)
  return h >>> 0
}

export class SpatialIndex {
  /* Core algorithm is heavily inspired by the flatbush libary (https://github.com/mourner/flatbush)
  Copyright (c) 2022, Vladimir Agafonkin

  Permission to use, copy, modify, and/or distribute this software for any purpose
  with or without fee is hereby granted, provided that the above copyright notice
  and this permission notice appear in all copies.

  THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH
  REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY AND
  FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT,
  INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM LOSS
  OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE OR OTHER
  TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR PERFORMANCE OF
  THIS SOFTWARE.
  */

  // 4 coordinates values per rect -> bitshift by 2 (or multiply by 4) to transform index
  private readonly factor_bbox: number = 4
  private readonly shift_factor_bbox: number = 2

  private n_items: number
  private node_size: number
  private array_type_coordinates: TypedArrayConstructor
  private array_type_indices: Uint16ArrayConstructor | Uint32ArrayConstructor
  private _tree_level_bounds: number[]
  private _n_total_nodes: number
  private _coordinate_index_position: number

  private minX: number
  private minY: number
  private maxX: number
  private maxY: number

  // buffer layout: [coordinate rects - coordinate indices]
  private _data_byte_buffer: ArrayBuffer
  private _bboxes: TypedArray
  private _indices: Uint16Array | Uint32Array

  constructor(n_items: number, node_size: number = 16, array_type_coordinates: TypedArrayConstructor = Float64Array) {
    if (!Number.isInteger(n_items) || n_items < 0) {
      throw new Error(`Invalid coordinates count: ${n_items}. Value must be a non-negative integer.`)
    }

    if (!Number.isInteger(node_size) || node_size < 0) {
      throw new Error(`Invalid node_size: ${node_size}. Value must be a non-negative integer.`)
    }

    this.n_items = n_items
    this.node_size = Math.min(Math.max(node_size, 2), 65535)
    this.array_type_coordinates = array_type_coordinates
    this._coordinate_index_position = 0
    this.minX = Infinity
    this.minY = Infinity
    this.maxX = -Infinity
    this.maxY = -Infinity

    if (n_items === 0) {
      // init empty spatial index
      this._tree_level_bounds = [0]
      this._n_total_nodes = 0
      this.array_type_indices = Uint16Array
      this._data_byte_buffer = new ArrayBuffer(0)
      this._bboxes = new this.array_type_coordinates(this._data_byte_buffer, 0, 0)
      this._indices = new this.array_type_indices(this._data_byte_buffer, 0, 0)
      return
    }

    this._init_tree_structure()
    this.array_type_indices = this._n_total_nodes < 16384 ? Uint16Array : Uint32Array
    this._configure_data_buffer()
  }

  _init_tree_structure(): void {
    let node_count = this.n_items
    let nodes_last_level = node_count
    const cumulative_nodes_per_level = [nodes_last_level]

    do {
      const nodes_this_level = Math.ceil(nodes_last_level / this.node_size)
      node_count += nodes_this_level
      cumulative_nodes_per_level.push(node_count)
      nodes_last_level = nodes_this_level
    } while (nodes_last_level !== 1)

    this._tree_level_bounds = cumulative_nodes_per_level.map(x => x * this.factor_bbox)
    this._n_total_nodes = node_count
  }

  _configure_data_buffer(): void {
    const bytes_per_coordinate_value = this.array_type_coordinates.BYTES_PER_ELEMENT
    const n_total_coordinate_values = this._n_total_nodes * this.factor_bbox
    const n_bytes_nodes = n_total_coordinate_values * bytes_per_coordinate_value

    const bytes_per_index_value = this.array_type_indices.BYTES_PER_ELEMENT
    const n_bytes_indices = this._n_total_nodes * bytes_per_index_value

    const n_total_bytes = n_bytes_nodes + n_bytes_indices

    this._data_byte_buffer = new ArrayBuffer(n_total_bytes)
    this._bboxes = new this.array_type_coordinates(this._data_byte_buffer, 0, n_total_coordinate_values)
    this._indices = new this.array_type_indices(this._data_byte_buffer, n_bytes_nodes, this._n_total_nodes)
  }

  add_rect(x0: number, y0: number, x1: number, y1: number): void {
    if (!isFinite(x0 + y0 + x1 + y1)) {
      x0 = Infinity
      y0 = Infinity
      x1 = -Infinity
      y1 = -Infinity
    }

    const {_indices, _bboxes} = this
    const index = this._coordinate_index_position >> this.shift_factor_bbox

    _indices[index] = index
    _bboxes[this._coordinate_index_position++] = x0
    _bboxes[this._coordinate_index_position++] = y0
    _bboxes[this._coordinate_index_position++] = x1
    _bboxes[this._coordinate_index_position++] = y1

    if (x0 < this.minX) {
      this.minX = x0
    }
    if (y0 < this.minY) {
      this.minY = y0
    }
    if (x1 > this.maxX) {
      this.maxX = x1
    }
    if (y1 > this.maxY) {
      this.maxY = y1
    }
  }

  add_point(x: number, y: number) {
    this.add_rect(x, y, x, y)
  }

  add_empty(): void {
    this.add_rect(Infinity, Infinity, -Infinity, -Infinity)
  }

  build_index(): void {
    const {n_items, _bboxes, minX, minY, maxX, maxY}  = this
    const index = this._coordinate_index_position >> this.shift_factor_bbox

    if (index !== n_items) {
      throw new Error(`Index is at wrong position, added ${index} items when expected ${n_items}.`)
    }

    if (n_items <= this.node_size) {
      // single and therefore the root node
      _bboxes[this._coordinate_index_position++] = minX
      _bboxes[this._coordinate_index_position++] = minY
      _bboxes[this._coordinate_index_position++] = maxX
      _bboxes[this._coordinate_index_position++] = maxY
      return
    }

    this._optimize_item_order()
    this._generate_internal_tree_nodes()
  }

  finish(): void {
    if (this.n_items === 0) {
      return
    }
    this.build_index()
  }

  get bbox(): Rect {
    const {minX, minY, maxX, maxY} = this
    return {x0: minX, y0: minY, x1: maxX, y1: maxY}
  }

  indices(rect: Rect): Indices {
    const {x0, y0, x1, y1} = this._normalize(rect)
    const result = new Indices(this.n_items)
    this._search(x0, y0, x1, y1, (index) => {
      result.set_unchecked(index)
      return false
    })
    return result
  }

  bounds(rect: Rect): Rect {
    const {x0, y0, x1, y1} = this._normalize(rect)
    const result = empty()
    this._search(x0, y0, x1, y1, (_, node_x0, node_y0, node_x1, node_y1) => {
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

  private _search(
    minX: number,
    minY: number,
    maxX: number,
    maxY: number,
    leaf_fn: LeafFn,
  ): void {
    const {_coordinate_index_position, _bboxes, n_items} = this
    if (n_items === 0) {
      return
    }

    if (_coordinate_index_position !== _bboxes.length) {
      throw new Error("Data is not yet indexed - call finish().")
    }

    const node_index = _bboxes.length - this.factor_bbox

    this._search_recursive(minX, minY, maxX, maxY, node_index, leaf_fn)
  }

  private _search_recursive(
    minX: number,
    minY: number,
    maxX: number,
    maxY: number,
    node_index: number,
    leaf_fn: LeafFn,
  ): void {

    const {n_items, node_size, _bboxes, _indices, _tree_level_bounds} = this
    const end = Math.min(node_index + node_size * this.factor_bbox, SpatialIndex._upperBound(node_index, _tree_level_bounds))

    // search through child nodes
    for (let pos = node_index; pos < end; pos += this.factor_bbox) {
      // skip if no intersection with bbox
      const x0 = _bboxes[pos]
      if (maxX < x0) {
        continue
      }
      const y0 = _bboxes[pos + 1]
      if (maxY < y0) {
        continue
      }
      const x1 = _bboxes[pos + 2]
      if (minX > x1) {
        continue
      }
      const y1 = _bboxes[pos + 3]
      if (minY > y1) {
        continue
      }

      const index = _indices[pos >> this.shift_factor_bbox] | 0

      if (node_index >= n_items * this.factor_bbox) {
        // check if node bbox is completely inside query bbox
        if (minX <= x0 && minY <= y0 && maxX >= x1 && maxY >= y1) {
          this._addAllLeavesOfNode(pos, leaf_fn)
        } else {
          this._search_recursive(minX, minY, maxX, maxY, index, leaf_fn)
        }
      } else {
        leaf_fn(index, x0, y0, x1, y1) // leaf item
      }
    }
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

  private _addAllLeavesOfNode(
    pos: number,
    leaf_fn: LeafFn,
  ): void {
    let posStart = pos
    let posEnd = pos

    const {n_items, node_size, _bboxes, _indices, _tree_level_bounds, factor_bbox, shift_factor_bbox} = this

    // depth search while not leaf
    while (posStart >= n_items * factor_bbox) {
      posStart = _indices[posStart >> shift_factor_bbox] | 0
      const posEndStart = _indices[posEnd >> shift_factor_bbox] | 0
      posEnd = Math.min(posEndStart + node_size * factor_bbox, SpatialIndex._upperBound(posEndStart, _tree_level_bounds)) - factor_bbox
    }

    for (let leafPos = posStart; leafPos <= posEnd; leafPos += this.factor_bbox) {
      const leafIndex = this._indices[leafPos >> this.shift_factor_bbox]
      leaf_fn(leafIndex, _bboxes[leafPos], _bboxes[leafPos + 1], _bboxes[leafPos + 2], _bboxes[leafPos + 3])
    }
  }

  private static _upperBound(value: number, arr: number[]): number {
    let lo = 0
    let hi = arr.length - 1
    while (lo < hi) {
      const mid = (lo + hi) >> 1
      if (arr[mid] > value) {
        hi = mid
      } else {
        lo = mid + 1
      }
    }
    return arr[lo]
  }

  private _optimize_item_order(): void {
    const {n_items} = this
    const hilbert_values = new Uint32Array(n_items)

    this._compute_hilbert_values(hilbert_values)
    // sort items by their Hilbert value
    this._sort_by_hilbert_values(hilbert_values)
  }

  private _compute_hilbert_values(hilbert_values: Uint32Array) {
    const {n_items, _bboxes, minX, minY, maxX, maxY} = this

    const width = (maxX - minX)
    const height = (maxY - minY)
    const hilbertMax = (1 << 16) - 1
    const scaleX = hilbertMax / width
    const scaleY = hilbertMax / height

    // calculate Hilbert values from rect center
    for (let i = 0, pos = 0; i < n_items; i++) {
      const _minX = _bboxes[pos++]
      const _minY = _bboxes[pos++]
      const _maxX = _bboxes[pos++]
      const _maxY = _bboxes[pos++]
      const x_center = (_minX + _maxX) * 0.5
      const y_center = (_minY + _maxY) * 0.5
      const x = Math.floor((x_center - minX) * scaleX)
      const y = Math.floor((y_center - minY) * scaleY)
      hilbert_values[i] = compute_hilbert(x, y)
    }
  }

  private _sort_by_hilbert_values(keys: Uint32Array<ArrayBuffer>): void {
    const {n_items, _bboxes, _indices, shift_factor_bbox} = this

    const BITS = 11                       // try 8 vs 11
    const RADIX = 1 << BITS
    const MASK = RADIX - 1
    const PASSES = Math.ceil(32 / BITS)

    // one read over the keys builds the histograms for all passes
    const counts = new Uint32Array(PASSES * RADIX)
    for (let i = 0; i < n_items; i++) {
      const k = keys[i]
      for (let p = 0; p < PASSES; p++) {
        counts[p * RADIX + ((k >>> (p * BITS)) & MASK)]++
      }
    }

    let keys_src: Uint32Array = keys
    let keys_dst: Uint32Array = new Uint32Array(n_items)
    let ids_src: Uint32Array = new Uint32Array(n_items)
    let ids_dst: Uint32Array = new Uint32Array(n_items)
    let identity = true                  // ids_src is implicitly 0..n-1 until the first real pass

    const first_key = keys[0]
    for (let p = 0; p < PASSES; p++) {
      const shift = p * BITS
      const offset = p * RADIX

      // all keys share this digit -> pass would be a no-op
      if (counts[offset + ((first_key >>> shift) & MASK)] === n_items) {
        continue
      }

      let sum = 0
      for (let b = 0; b < RADIX; b++) {
        const c = counts[offset + b]
        counts[offset + b] = sum
        sum += c
      }

      if (identity) {
        for (let i = 0; i < n_items; i++) {
          const k = keys_src[i]
          const pos = counts[offset + ((k >>> shift) & MASK)]++
          keys_dst[pos] = k
          ids_dst[pos] = i
        }
        identity = false
      } else {
        for (let i = 0; i < n_items; i++) {
          const k = keys_src[i]
          const pos = counts[offset + ((k >>> shift) & MASK)]++
          keys_dst[pos] = k
          ids_dst[pos] = ids_src[i]
        }
      }

      ;[keys_src, keys_dst] = [keys_dst, keys_src]
      ;[ids_src, ids_dst] = [ids_dst, ids_src]
    }

    if (identity) {
      for (let i = 0; i < n_items; i++) ids_src[i] = i
    }

    // gather bboxes once: sequential writes, random reads
    const tmp = _bboxes.slice(0, n_items << shift_factor_bbox)
    for (let i = 0, k = 0; i < n_items; i++, k += 4) {
      const id = ids_src[i]
      const m = id << 2
      _bboxes[k]     = tmp[m]
      _bboxes[k + 1] = tmp[m + 1]
      _bboxes[k + 2] = tmp[m + 2]
      _bboxes[k + 3] = tmp[m + 3]
      _indices[i] = id
    }
  }

  private _generate_internal_tree_nodes(): void {
    // build tree bottom up
    const {node_size, _tree_level_bounds, _bboxes, _indices, shift_factor_bbox} = this

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
          node_x0 = Math.min(node_x0, _bboxes[pos++])
          node_y0 = Math.min(node_y0, _bboxes[pos++])
          node_x1 = Math.max(node_x1, _bboxes[pos++])
          node_y1 = Math.max(node_y1, _bboxes[pos++])
        }

        // set new node in tree structure
        _indices[this._coordinate_index_position >> shift_factor_bbox] = index_node
        _bboxes[this._coordinate_index_position++] = node_x0
        _bboxes[this._coordinate_index_position++] = node_y0
        _bboxes[this._coordinate_index_position++] = node_x1
        _bboxes[this._coordinate_index_position++] = node_y1
      }
    }
  }
}
