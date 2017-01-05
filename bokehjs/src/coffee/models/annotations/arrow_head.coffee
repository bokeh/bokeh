import {Annotation} from "./annotation"
import {Visuals} from "../../core/visuals"
import * as p from "../../core/properties"

export class ArrowHead extends Annotation
  type: 'ArrowHead'

  initialize: (options) ->
    super(options)
    @visuals = new Visuals(@)

  render: (ctx, i) ->
    null

export class OpenHead extends ArrowHead
  type: 'OpenHead'

  render: (ctx, i) ->
    if @visuals.line.doit
      @visuals.line.set_vectorize(ctx, i)
      ctx.beginPath()
      ctx.moveTo(0.5*@size, @size)
      ctx.lineTo(0, 0)
      ctx.lineTo(-0.5*@size, @size)
      ctx.stroke()

  @mixins ['line']

  @define {
      size:  [ p.Number,   25            ]
    }

export class NormalHead extends ArrowHead
  type: 'NormalHead'

  render: (ctx, i) ->
    if @visuals.fill.doit
      @visuals.fill.set_vectorize(ctx, i)
      ctx.beginPath()
      ctx.moveTo(0.5*@size, @size)
      ctx.lineTo(0, 0)
      ctx.lineTo(-0.5*@size, @size)
      ctx.closePath()
      ctx.fill()

    if @visuals.line.doit
      @visuals.line.set_vectorize(ctx, i)
      ctx.beginPath()
      ctx.moveTo(0.5*@size, @size)
      ctx.lineTo(0, 0)
      ctx.lineTo(-0.5*@size, @size)
      ctx.closePath()
      ctx.stroke()

  @mixins ['line', 'fill']

  @define {
    size:  [ p.Number,   25            ]
  }

  @override {
    fill_color: 'black'
  }

export class VeeHead extends ArrowHead
  type: 'VeeHead'

  render: (ctx, i) ->
    if @visuals.fill.doit
      @visuals.fill.set_vectorize(ctx, i)
      ctx.beginPath()
      ctx.moveTo(0.5*@size, @size)
      ctx.lineTo(0, 0)
      ctx.lineTo(-0.5*@size, @size)
      ctx.lineTo(0, 0.5*@size)
      ctx.closePath()
      ctx.fill()

    if @visuals.line.doit
      @visuals.line.set_vectorize(ctx, i)
      ctx.beginPath()
      ctx.moveTo(0.5*@size, @size)
      ctx.lineTo(0, 0)
      ctx.lineTo(-0.5*@size, @size)
      ctx.lineTo(0, 0.5*@size)
      ctx.closePath()
      ctx.stroke()

  @mixins ['line', 'fill']

  @define {
    size:  [ p.Number,   25            ]
  }

  @override {
    fill_color: 'black'
  }
