import {SVGRenderingContext2D} from "./svg"
import {BBox} from "./bbox"
import {div, canvas} from "../dom"
import type {OutputBackend} from "../enums"

export type CanvasPatternRepetition = "repeat" | "repeat-x" | "repeat-y" | "no-repeat"

export type Context2d = {
  // override because stdlib has a weak type for 'repetition'
  createPattern(image: CanvasImageSource, repetition: CanvasPatternRepetition | null): CanvasPattern | null
  readonly layer: CanvasLayer
  rect_bbox(bbox: BBox): void
} & CanvasRenderingContext2D

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

  private _pixel_ratio: number = 1
  get pixel_ratio(): number {
    return this._pixel_ratio
  }

  bbox: BBox = new BBox()

  constructor(readonly backend: OutputBackend, readonly hidpi: boolean) {
    switch (backend) {
      case "webgl":
      case "canvas": {
        this._el = this._canvas = canvas({class: "bk-layer"})
        const ctx = this.canvas.getContext("2d")
        if (ctx == null) {
          throw new Error("unable to obtain 2D rendering context")
        }
        this._ctx = ctx
        if (hidpi) {
          this._pixel_ratio = devicePixelRatio
        }
        break
      }
      case "svg": {
        const ctx = new SVGRenderingContext2D()
        this._ctx = ctx
        this._canvas = ctx.get_svg()
        this._el = div({class: "bk-layer"})
        const shadow_el = this._el.attachShadow({mode: "open"})
        shadow_el.appendChild(this._canvas)
        break
      }
    }

    Object.assign(this._ctx, {
      layer: this,
      rect_bbox(this: CanvasRenderingContext2D, bbox: BBox): void {
        const {x, y, width, height} = bbox
        this.rect(x, y, width, height)
      },
    })
  }

  get pixel_ratio_changed(): boolean {
    if (this.hidpi && (this.backend == "canvas" || this.backend == "webgl")) {
      return this.pixel_ratio != devicePixelRatio
    } else {
      return false
    }
  }

  resize(width: number, height: number): void {
    const size_changed = this.bbox.width != width || this.bbox.height != height
    const {pixel_ratio_changed} = this

    if (!size_changed && !pixel_ratio_changed) {
      return
    }

    if (pixel_ratio_changed) {
      this._pixel_ratio = devicePixelRatio
    }

    this.bbox = new BBox({left: 0, top: 0, width, height})

    const {target} = this
    target.width = width*this.pixel_ratio
    target.height = height*this.pixel_ratio
  }

  private get target(): HTMLCanvasElement | SVGRenderingContext2D {
    return this._ctx instanceof SVGRenderingContext2D ? this._ctx : this.canvas
  }

  undo_transform(fn: (ctx: Context2d) => void) {
    const {ctx} = this
    const current_transform = ctx.getTransform()
    ctx.resetTransform()
    try {
      fn(ctx)
    } finally {
      ctx.setTransform(current_transform)
    }
  }

  prepare(): Context2d {
    const {ctx, hidpi, pixel_ratio} = this
    ctx.save()
    if (hidpi) {
      ctx.scale(pixel_ratio, pixel_ratio)
      ctx.translate(0.5, 0.5)
    }
    this.clear()
    return ctx
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
