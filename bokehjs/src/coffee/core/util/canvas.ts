import {OutputBackend} from "../enums"

function fixup_line_dash(ctx: any): void {
  if (!ctx.setLineDash) {
    ctx.setLineDash = (dash: any): void => {
      ctx.mozDash = dash
      ctx.webkitLineDash = dash
    }
  }
  if (!ctx.getLineDash) {
    ctx.getLineDash = (): any => {
      return ctx.mozDash
    }
  }
}

function fixup_line_dash_offset(ctx: any): void {
  ctx.setLineDashOffset = (dash_offset: any): void => {
    ctx.lineDashOffset = dash_offset
    ctx.mozDashOffset = dash_offset
    ctx.webkitLineDashOffset = dash_offset
  }
  ctx.getLineDashOffset = (): number => {
    return ctx.mozDashOffset
  }
}

function fixup_image_smoothing(ctx: any): void {
  ctx.setImageSmoothingEnabled = (value: any): void => {
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

function fixup_measure_text(ctx: any): void {
  if (ctx.measureText && ctx.html5MeasureText == null) {
    ctx.html5MeasureText = ctx.measureText

    ctx.measureText = (text: string) => {
      const textMetrics = ctx.html5MeasureText(text)
      // fake it til you make it
      textMetrics.ascent = ctx.html5MeasureText("m").width * 1.6
      return textMetrics
    }
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
    ctx.bezierCurveTo( rx * c,  ry,  rx,  ry * c,  rx, 0)
    ctx.bezierCurveTo( rx, -ry * c,  rx * c, -ry, 0, -ry)
    ctx.bezierCurveTo(-rx * c, -ry, -rx, -ry * c, -rx, 0)

    ctx.rotate(-rotation)
    ctx.translate(-x, -y)
  }

  if (!ctx.ellipse)
    ctx.ellipse = ellipse_bezier
}

export function fixup_ctx(ctx: any): void {
  fixup_line_dash(ctx)
  fixup_line_dash_offset(ctx)
  fixup_image_smoothing(ctx)
  fixup_measure_text(ctx)
  fixup_ellipse(ctx)
}

export function get_scale_ratio(ctx: any, hidpi: boolean, backend: OutputBackend): number {
  if (backend == "svg")
    return 1
  else if (hidpi) {
    const devicePixelRatio = window.devicePixelRatio || 1
    const backingStoreRatio = ctx.webkitBackingStorePixelRatio ||
                              ctx.mozBackingStorePixelRatio    ||
                              ctx.msBackingStorePixelRatio     ||
                              ctx.oBackingStorePixelRatio      ||
                              ctx.backingStorePixelRatio       || 1
    return devicePixelRatio / backingStoreRatio
  } else
    return 1
}
