import {SVGRenderingContext2D} from "./svg"
import {BBox} from "./bbox"
import {div, canvas} from "../dom"
import {OutputBackend} from "../enums"

export type CanvasPatternRepetition = "repeat" | "repeat-x" | "repeat-y" | "no-repeat"

export type Context2d = {
  createPattern(image: CanvasImageSource, repetition: CanvasPatternRepetition | null): CanvasPattern | null
  setImageSmoothingEnabled(value: boolean): void
  getImageSmoothingEnabled(): boolean
  lineDash: number[]
  readonly layer: CanvasLayer
} & CanvasRenderingContext2D

function fixup_line_dash(ctx: any): void {
  if (typeof ctx.lineDash === "undefined") {
    Object.defineProperty(ctx, "lineDash", {
      get: () => ctx.getLineDash(),
      set: (segments: number[]) => ctx.setLineDash(segments),
    })
  }
}

function fixup_image_smoothing(ctx: any): void {
  ctx.setImageSmoothingEnabled = (value: boolean): void => {
    ctx.imageSmoothingEnabled = value
    ctx.mozImageSmoothingEnabled = value
    ctx.oImageSmoothingEnabled = value
    ctx.webkitImageSmoothingEnabled = value
    ctx.msImageSmoothingEnabled = value
  }
  ctx.getImageSmoothingEnabled = (): boolean => {
    const val = ctx.imageSmoothingEnabled
    return val != null ? val : true
  }
}

function fixup_ellipse(ctx: any): void {
  // implementing the ctx.ellipse function with bezier curves
  // we don't implement the startAngle, endAngle and anticlockwise arguments.
  function ellipse_bezier(x: number, y: number,
                          radiusX: number, radiusY: number,
                          rotation: number, _startAngle: number, _endAngle: number, anticlockwise: boolean = false) {
    const c = 0.551784 // see http://www.tinaja.com/glib/ellipse4.pdf

    ctx.translate(x, y)
    ctx.rotate(rotation)

    let rx = radiusX
    let ry = radiusY
    if (anticlockwise) {
      rx = -radiusX
      ry = -radiusY
    }

    ctx.moveTo(-rx, 0) // start point of first curve
    ctx.bezierCurveTo(-rx,  ry * c, -rx * c,  ry, 0,  ry)
    ctx.bezierCurveTo(rx * c,  ry,  rx,  ry * c,  rx, 0)
    ctx.bezierCurveTo(rx, -ry * c,  rx * c, -ry, 0, -ry)
    ctx.bezierCurveTo(-rx * c, -ry, -rx, -ry * c, -rx, 0)

    ctx.rotate(-rotation)
    ctx.translate(-x, -y)
  }

  if (!ctx.ellipse)
    ctx.ellipse = ellipse_bezier
}

function fixup_ctx(ctx: any): void {
  fixup_line_dash(ctx)
  fixup_image_smoothing(ctx)
  fixup_ellipse(ctx)
}

const style = {
  position: "absolute",
  top: "0",
  left: "0",
  width: "100%",
  height: "100%",
}

export class CanvasLayer {
  private readonly _canvas: HTMLCanvasElement | SVGSVGElement
  get canvas(): HTMLCanvasElement {
    return this._canvas as HTMLCanvasElement
  }

  private readonly _ctx: CanvasRenderingContext2D | SVGRenderingContext2D
  get ctx(): Context2d {
    return this._ctx as Context2d
  }

  private readonly _el: HTMLElement
  get el(): HTMLElement {
    return this._el
  }

  readonly pixel_ratio: number = 1

  bbox: BBox = new BBox()

  constructor(readonly backend: OutputBackend, readonly hidpi: boolean) {
    switch (backend) {
      case "webgl":
      case "canvas": {
        this._el = this._canvas = canvas({style})
        const ctx = this.canvas.getContext("2d")
        if (ctx == null)
          throw new Error("unable to obtain 2D rendering context")
        this._ctx = ctx
        if (hidpi) {
          this.pixel_ratio = devicePixelRatio
        }
        break
      }
      case "svg": {
        const ctx = new SVGRenderingContext2D()
        this._ctx = ctx
        this._canvas = ctx.get_svg()
        this._el = div({style})
        const shadow_el = this._el.attachShadow({mode: "open"})
        shadow_el.appendChild(this._canvas)
        break
      }
    }

    (this._ctx as any).layer = this
    fixup_ctx(this._ctx)
  }

  resize(width: number, height: number): void {
    this.bbox = new BBox({left: 0, top: 0, width, height})

    const target = this._ctx instanceof SVGRenderingContext2D ? this._ctx : this.canvas
    target.width = width*this.pixel_ratio
    target.height = height*this.pixel_ratio
  }

  private _base_transform: DOMMatrix

  undo_transform(fn: (ctx: Context2d) => void) {
    const {ctx} = this
    const current_transform = ctx.getTransform()
    ctx.setTransform(this._base_transform)
    try {
      fn(ctx)
    } finally {
      ctx.setTransform(current_transform)
    }
  }

  prepare(): void {
    const {ctx, hidpi, pixel_ratio} = this
    ctx.save()
    if (hidpi) {
      ctx.scale(pixel_ratio, pixel_ratio)
      ctx.translate(0.5, 0.5)
    }
    this._base_transform = ctx.getTransform()
    this.clear()
  }

  clear(): void {
    const {x, y, width, height} = this.bbox
    this.ctx.clearRect(x, y, width, height)
  }

  finish(): void {
    this.ctx.restore()
  }

  to_blob(): Promise<Blob> {
    const {_canvas} = this
    if (_canvas instanceof HTMLCanvasElement) {
      return new Promise((resolve, reject) => {
        _canvas.toBlob((blob) => blob != null ? resolve(blob) : reject(), "image/png")
      })
    } else {
      const ctx = this._ctx as SVGRenderingContext2D
      const svg = ctx.get_serialized_svg(true)
      const blob = new Blob([svg], {type: "image/svg+xml"})
      return Promise.resolve(blob)
    }
  }
}
