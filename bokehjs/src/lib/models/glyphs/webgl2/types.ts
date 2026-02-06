import type {MarkerType} from "core/enums"

// Extended marker types supported by WebGL2 backend
export type GL2MarkerType = MarkerType | "rect" | "round_rect"

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
