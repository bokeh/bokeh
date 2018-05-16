declare module "canvas2svg" {
  interface SVGRenderingContext2D extends CanvasRenderingContext2D {
    getSvg(): SVGSVGElement
    getSerializedSvg(fixNamedEntities: boolean): string
  }

  const SVGRenderingContext2D: {
      prototype: SVGRenderingContext2D
      new(): SVGRenderingContext2D
  }

  export = SVGRenderingContext2D
}
