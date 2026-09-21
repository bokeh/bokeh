declare module "libtess/libtess.cat.js" {
  // These declarations include private mesh operations from libtess 1.2.2.
  // Re-verify them together with webgl/tessellator.ts before changing the pin.
  type Coordinates = [number, number, number]

  enum gluEnum {
    GLU_TESS_BEGIN = 100100,
    GLU_TESS_VERTEX = 100101,
    GLU_TESS_END = 100102,
    GLU_TESS_ERROR = 100103,
    GLU_TESS_EDGE_FLAG = 100104,
    GLU_TESS_COMBINE = 100105,
    GLU_TESS_WINDING_RULE = 100140,
    GLU_TESS_BOUNDARY_ONLY = 100141,
  }

  enum windingRule {
    GLU_TESS_WINDING_ODD = 100130,
  }

  class GluTesselator<T> {
    gluTessCallback(which: gluEnum.GLU_TESS_BEGIN, callback: (type: number) => void): void
    gluTessCallback(which: gluEnum.GLU_TESS_VERTEX, callback: (data: T) => void): void
    gluTessCallback(which: gluEnum.GLU_TESS_END, callback: () => void): void
    gluTessCallback(which: gluEnum.GLU_TESS_ERROR, callback: (code: number) => void): void
    gluTessCallback(which: gluEnum.GLU_TESS_EDGE_FLAG, callback: (boundary: boolean) => void): void
    gluTessCallback(which: gluEnum.GLU_TESS_COMBINE,
      callback: (coords: Coordinates, data: (T | null)[], weights: number[]) => T): void
    gluTessProperty(which: gluEnum.GLU_TESS_WINDING_RULE | gluEnum.GLU_TESS_BOUNDARY_ONLY, value: number | boolean): void
    gluTessNormal(x: number, y: number, z: number): void
    gluTessBeginPolygon(data?: unknown): void
    gluTessEndPolygon(): void
    gluTessBeginContour(): void
    gluTessEndContour(): void
    gluTessVertex(coords: Coordinates, data: T): void
  }

  export type Vertex = {anEdge: HalfEdge}
  export type Face = {
    anEdge: HalfEdge
    next: Face
    prev: Face
    inside: boolean
  }
  export type HalfEdge = {
    org: Vertex
    sym: HalfEdge
    lFace: Face
    lNext: HalfEdge
    oNext: HalfEdge
    dst(): Vertex
  }

  const libtess: {
    GluTesselator: typeof GluTesselator
    gluEnum: typeof gluEnum
    windingRule: typeof windingRule
    mesh: {
      connect(eOrg: HalfEdge, eDst: HalfEdge): HalfEdge
      meshSplice(eOrg: HalfEdge, eDst: HalfEdge): void
      killFace_(face: Face, replacement: Face | null): void
      makeFace_(edge: HalfEdge, next: Face): void
      makeEdgePair_(edge: HalfEdge): HalfEdge
      splice_(a: HalfEdge, b: HalfEdge): void
      killVertex_(vertex: Vertex, replacement: Vertex): void
      makeVertex_(edge: HalfEdge, next: Vertex): void
    }
  }
  export default libtess
}
