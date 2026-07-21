import type {Arrayable} from "core/types"
import {LinearScale} from "../../scales/linear_scale"
import {LogScale} from "../../scales/log_scale"
import type {Scale} from "../../scales/scale"
import type {Vec2} from "regl"

export type DataMappingKind = "linear" | "log"

export type AxisDataMapping = {
  kind: DataMappingKind
  origin: number
  factor: number
  target: number
}

/**
 * Parameters for mapping origin-rebased data coordinates to screen coordinates
 * in a vertex shader. `offset` is the data-buffer origin minus the current
 * range origin in the transformed domain.
 */
export type DataMapping = {
  x: AxisDataMapping
  y: AxisDataMapping
  offset: Vec2
  factor: Vec2
  target: Vec2
  signature: string
}

export type PackedDataState = {
  origin: Vec2
  error: Vec2
}

// A finite value outside the range of useful coordinates. Avoid NaN/Infinity
// attributes because handling of those values has historically varied between
// WebGL implementations.
export const missing_data_value = Math.fround(-3.0e38)

function axis_data_mapping(scale: Scale): AxisDataMapping | null {
  if (scale instanceof LinearScale) {
    const {source_range: source, target_range: target} = scale
    const [factor] = LinearScale.linear_compute(source.start, source.end, target.start, target.end)
    if (!isFinite(source.start + factor + target.start)) {
      return null
    }
    return {kind: "linear", origin: source.start, factor, target: target.start}
  }

  if (scale instanceof LogScale) {
    const [screen_factor, target, log_factor, log_origin] = scale._compute_state()
    const factor = screen_factor/log_factor
    if (!isFinite(log_origin + factor + target) || log_factor == 0) {
      return null
    }
    return {kind: "log", origin: log_origin, factor, target}
  }

  return null
}

/** Return a GPU mapping only for direct continuous scales with affine screen mappings. */
export function create_data_mapping(x_scale: Scale, y_scale: Scale): DataMapping | null {
  const x = axis_data_mapping(x_scale)
  const y = axis_data_mapping(y_scale)
  if (x == null || y == null) {
    return null
  }
  return {
    x,
    y,
    offset: [0, 0],
    factor: [x.factor, y.factor],
    target: [x.target, y.target],
    signature: `${x.kind}:${y.kind}`,
  }
}

export function with_data_origin(mapping: DataMapping, data_origin: Vec2): DataMapping {
  return {
    ...mapping,
    offset: [data_origin[0] - mapping.x.origin, data_origin[1] - mapping.y.origin],
  }
}

/** Whether Float32 rebasing stays within a sub-pixel error budget at the current zoom. */
export function data_mapping_is_precise(mapping: DataMapping, error: Vec2, max_error_px: number = 0.25): boolean {
  return Math.abs(mapping.factor[0]*error[0]) <= max_error_px &&
    Math.abs(mapping.factor[1]*error[1]) <= max_error_px
}

function transform(value: number, kind: DataMappingKind): number {
  if (!isFinite(value) || (kind == "log" && value <= 0)) {
    return missing_data_value
  }
  const transformed = kind == "log" ? Math.log(value) : value
  return isFinite(Math.fround(transformed)) ? transformed : missing_data_value
}

export function is_valid_data_point(x: number, y: number, mapping: DataMapping): boolean {
  return transform(x, mapping.x.kind) != missing_data_value && transform(y, mapping.y.kind) != missing_data_value
}

/**
 * Pack x/y values as Float32 deltas from a stable per-buffer origin. Returning
 * the origin separately preserves large-coordinate precision without doubling
 * vertex bandwidth.
 */
export function pack_data_points(
  target: Float32Array,
  x: Arrayable<number>,
  y: Arrayable<number>,
  mapping: DataMapping,
  target_point_offset: number = 0,
): PackedDataState {
  const n = Math.min(x.length, y.length)
  let origin_x = 0
  let origin_y = 0
  for (let i = 0; i < n; i++) {
    const tx = transform(x[i], mapping.x.kind)
    if (tx != missing_data_value) {
      origin_x = tx
      break
    }
  }
  for (let i = 0; i < n; i++) {
    const ty = transform(y[i], mapping.y.kind)
    if (ty != missing_data_value) {
      origin_y = ty
      break
    }
  }

  let error_x = 0
  let error_y = 0
  for (let i = 0; i < n; i++) {
    const tx = transform(x[i], mapping.x.kind)
    const ty = transform(y[i], mapping.y.kind)
    const dx = Math.fround(tx - origin_x)
    const dy = Math.fround(ty - origin_y)
    const j = 2*(target_point_offset + i)
    if (tx == missing_data_value || ty == missing_data_value) {
      target[j] = missing_data_value
      target[j + 1] = missing_data_value
    } else if (!isFinite(dx + dy)) {
      target[j] = missing_data_value
      target[j + 1] = missing_data_value
    } else {
      target[j] = dx
      target[j + 1] = dy
      error_x = Math.max(error_x, Math.abs((origin_x + dx) - tx))
      error_y = Math.max(error_y, Math.abs((origin_y + dy) - ty))
    }
  }
  return {origin: [origin_x, origin_y], error: [error_x, error_y]}
}

/** JavaScript equivalent of the shader mapping, useful for validation and tests. */
export function map_packed_point(point: ArrayLike<number>, mapping: DataMapping): Vec2 {
  if (Math.abs(point[0]) > 1.0e38 || Math.abs(point[1]) > 1.0e38) {
    return [-10000, -10000]
  }
  return [
    mapping.target[0] + mapping.factor[0]*(mapping.offset[0] + point[0]),
    mapping.target[1] + mapping.factor[1]*(mapping.offset[1] + point[1]),
  ]
}
