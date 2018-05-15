import * as sinon from "sinon"

import {CanvasView} from "models/canvas/canvas"

export function stub_canvas(): void {
  // Stub the canvas context
  const MockCanvasContext = {
    beginPath()  : any { return null },
    clearRect()  : any { return null },
    clip()       : any { return null },
    drawImage()  : any { return null },
    fillRect()   : any { return null },
    fillText()   : any { return null },
    lineTo()     : any { return null },
    measureText(): any { return {width: 1, ascent: 1} },
    moveTo()     : any { return null },
    rect()       : any { return null },
    restore()    : any { return null },
    rotate()     : any { return null },
    save()       : any { return null },
    scale()      : any { return null },
    stroke()     : any { return null },
    strokeRect() : any { return null },
    translate()  : any { return null },
  }
  sinon.stub(CanvasView.prototype, 'get_ctx', () => MockCanvasContext)
}

export function unstub_canvas(): void {
  const canvas_view = CanvasView as any
  canvas_view.prototype.get_ctx.restore()
}
