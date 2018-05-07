import * as sinon from "sinon"

function moduleRequire(name: string) {
  return require(`${__dirname}/../build/js/tree/${name}`)
}

export {moduleRequire as require}

import {CanvasView} from "models/canvas/canvas"
import {Solver} from "core/layout/solver"

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

export function stub_solver(): any {
  // Stub solver methods we want to count
  const add = sinon.stub(Solver.prototype, 'add_constraint')
  const remove = sinon.stub(Solver.prototype, 'remove_constraint')
  const update = sinon.stub(Solver.prototype, 'update_variables')
  const suggest = sinon.stub(Solver.prototype, 'suggest_value')
  // Stub other solver methods
  sinon.stub(Solver.prototype, 'clear')
  sinon.stub(Solver.prototype, 'add_edit_variable')
  sinon.stub(Solver.prototype, 'remove_edit_variable')
  return {add, remove, update, suggest}
}

export function unstub_canvas(): void {
  const canvas_view = CanvasView as any
  canvas_view.prototype.get_ctx.restore()
}

export function unstub_solver(): void {
  const solver = Solver as any
  solver.prototype.suggest_value.restore()
  solver.prototype.add_constraint.restore()
  solver.prototype.remove_constraint.restore()
  solver.prototype.update_variables.restore()
  solver.prototype.clear.restore()
  solver.prototype.add_edit_variable.restore()
  solver.prototype.remove_edit_variable.restore()
}
