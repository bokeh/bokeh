export interface PointGeometry {
  type: "point"
  sx: number
  sy: number
}

export interface SpanGeometry {
  type: "span"
  direction: "h" | "v"
  sx: number
  sy: number
}

export interface RectGeometry {
  type: "rect"
  sx0: number
  sx1: number
  sy0: number
  sy1: number
}

export interface PolyGeometry {
  type: "poly"
  sx: number[]
  sy: number[]
}

export type Geometry = PointGeometry | SpanGeometry | RectGeometry | PolyGeometry
