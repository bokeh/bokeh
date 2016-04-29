Annotation = require "./annotation"
Renderer = require "../renderers/renderer"
p = require "../../core/properties"

class ArrowHead extends Annotation.Model
  type: 'ArrowHead'

  initialize: (options) ->
    super(options)
    @visuals = {}
    for spec in @mixins
      [name, prefix] = spec.split(":")
      prefix ?= ""
      @visuals[prefix+name] = new Renderer.Visuals[name]({obj: @, prefix: prefix})

  render: (ctx, i) ->
    null

class Open extends ArrowHead
  type: 'Open'

  render: (ctx, i) ->
    if @visuals["line"].doit
      @visuals["line"].set_vectorize(ctx, i)
      ctx.beginPath()
      ctx.moveTo(0.5*@get("size"), @get("size"))
      ctx.lineTo(0, 0)
      ctx.lineTo(-0.5*@get("size"), @get("size"))
      ctx.stroke()

  @mixins ['line']

  @define {
      size:  [ p.Number,   25            ]
    }

class Normal extends ArrowHead
  type: 'Normal'

  render: (ctx, i) ->
    if @visuals["fill"].doit
      @visuals["fill"].set_vectorize(ctx, i)
      ctx.beginPath()
      ctx.moveTo(0.5*@get("size"), @get("size"))
      ctx.lineTo(0, 0)
      ctx.lineTo(-0.5*@get("size"), @get("size"))
      ctx.closePath()
      ctx.fill()

    if @visuals["line"].doit
      @visuals["line"].set_vectorize(ctx, i)
      ctx.beginPath()
      ctx.moveTo(0.5*@get("size"), @get("size"))
      ctx.lineTo(0, 0)
      ctx.lineTo(-0.5*@get("size"), @get("size"))
      ctx.closePath()
      ctx.stroke()

  @mixins ['line', 'fill']

  @define {
    size:  [ p.Number,   25            ]
  }

  @override {
    fill_color: 'black'
  }

class Vee extends ArrowHead
  type: 'Vee'

  render: (ctx, i) ->
    if @visuals["fill"].doit
      @visuals["fill"].set_vectorize(ctx, i)
      ctx.beginPath()
      ctx.moveTo(0.5*@get("size"), @get("size"))
      ctx.lineTo(0, 0)
      ctx.lineTo(-0.5*@get("size"), @get("size"))
      ctx.lineTo(0, 0.5*@get("size"))
      ctx.closePath()
      ctx.fill()

    if @visuals["line"].doit
      @visuals["line"].set_vectorize(ctx, i)
      ctx.beginPath()
      ctx.moveTo(0.5*@get("size"), @get("size"))
      ctx.lineTo(0, 0)
      ctx.lineTo(-0.5*@get("size"), @get("size"))
      ctx.lineTo(0, 0.5*@get("size"))
      ctx.closePath()
      ctx.stroke()

  @mixins ['line', 'fill']

  @define {
    size:  [ p.Number,   25            ]
  }

  @override {
    fill_color: 'black'
  }

module.exports = {
  Open: {Model: Open}
  Normal: {Model: Normal}
  Vee: {Model: Vee}
}
