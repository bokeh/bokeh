import type {MarkerType} from "core/enums"

// Extended marker types supported by WebGPU backend
export type GPUMarkerType = MarkerType | "rect" | "round_rect"

// Bounding box for scissor/viewport operations
export type BoundingBox = {
  x: number
  y: number
  width: number
  height: number
}

// Transform info passed to draw calls
export type Transform = {
  pixel_ratio: number
  width: number
  height: number
}
