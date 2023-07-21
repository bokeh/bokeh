import type {Arrayable} from "./types"

export type PointGeometry = {
  type: "point"
  sx: number
  sy: number
}

export type SpanGeometry = {
  type: "span"
  direction: "h" | "v"
  sx: number
  sy: number
}

export type RectGeometry = {
  type: "rect"
  sx0: number
  sx1: number
  sy0: number
  sy1: number
}

export type PolyGeometry = {
  type: "poly"
  sx: Arrayable<number>
  sy: Arrayable<number>
}

export type Geometry = PointGeometry | SpanGeometry | RectGeometry | PolyGeometry

export type HitTestPoint = PointGeometry
export type HitTestSpan = SpanGeometry
export type HitTestRect = RectGeometry & {greedy?: boolean}
export type HitTestPoly = PolyGeometry & {greedy?: boolean}

export type HitTestGeometry = HitTestPoint | HitTestSpan | HitTestRect | HitTestPoly

export type PointGeometryData = PointGeometry & {
  x: number
  y: number
}

export type SpanGeometryData = SpanGeometry & {
  x: number
  y: number
}

export type RectGeometryData = RectGeometry & {
  x0: number
  x1: number
  y0: number
  y1: number
}

export type PolyGeometryData = PolyGeometry & {
  x: Arrayable<number>
  y: Arrayable<number>
}

export type GeometryData = PointGeometryData | SpanGeometryData | RectGeometryData | PolyGeometryData
