sinon = require 'sinon'

moduleRequire = (name) ->
  require "#{__dirname}/../build/js/tree/#{name}"

{CanvasView} = moduleRequire("models/canvas/canvas")
{Solver}  = moduleRequire("core/layout/solver")

stub_canvas = () ->
  # Stub the canvas context
  MockCanvasContext = {
    beginPath: () -> null
    clearRect: () -> null
    clip: () -> null
    drawImage: () -> null
    fillRect: () -> null
    fillText: () -> null
    lineTo: () -> null
    measureText: () -> {'width': 1, 'ascent': 1}
    moveTo: () -> null
    rect: () -> null
    restore: () -> null
    rotate: () -> null
    save: () -> null
    scale: () -> null
    stroke: () -> null
    strokeRect: () -> null
    translate: () -> null
  }
  sinon.stub(CanvasView.prototype, 'get_ctx', () -> MockCanvasContext)

stub_solver = () ->
  # Stub solver methods we want to count
  suggest_stub = sinon.stub(Solver.prototype, 'suggest_value')
  add_stub = sinon.stub(Solver.prototype, 'add_constraint')
  remove_stub = sinon.stub(Solver.prototype, 'remove_constraint')
  update_stub = sinon.stub(Solver.prototype, 'update_variables')
  # Stub other solver methods
  sinon.stub(Solver.prototype, 'clear')
  sinon.stub(Solver.prototype, 'add_edit_variable')
  sinon.stub(Solver.prototype, 'remove_edit_variable')
  return {'add': add_stub, 'remove': remove_stub, 'suggest': suggest_stub, 'update': update_stub}

unstub_canvas = () ->
    CanvasView.prototype.get_ctx.restore()

unstub_solver = () ->
    Solver.prototype.suggest_value.restore()
    Solver.prototype.add_constraint.restore()
    Solver.prototype.remove_constraint.restore()
    Solver.prototype.update_variables.restore()
    Solver.prototype.clear.restore()
    Solver.prototype.add_edit_variable.restore()
    Solver.prototype.remove_edit_variable.restore()

module.exports = {
  require: moduleRequire
  stub_canvas: stub_canvas
  stub_solver: stub_solver
  unstub_canvas: unstub_canvas
  unstub_solver: unstub_solver
}
