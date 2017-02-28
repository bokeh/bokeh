import {Annotation} from "./annotation"
import {Visuals} from "core/visuals"
import * as p from "core/properties"

export class ArrowHead extends Annotation
  type: 'ArrowHead'

  initialize: (options) ->
    super(options)
    @visuals = new Visuals(@)

  render: (ctx, i) ->
    null

  clip: (ctx, i) ->
    # This method should not begin or close a path
    null

export class OpenHead extends ArrowHead
  type: 'OpenHead'

  clip: (ctx, i) ->
    # This method should not begin or close a path
    @visuals.line.set_vectorize(ctx, i)
    ctx.moveTo(0.5*@size, @size)
    ctx.lineTo(0.5*@size, -2)
    ctx.lineTo(-0.5*@size, -2)
    ctx.lineTo(-0.5*@size, @size)
    ctx.lineTo(0, 0)
    ctx.lineTo(0.5*@size, @size)

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
      size: [ p.Number, 25 ]
    }

export class NormalHead extends ArrowHead
  type: 'NormalHead'

  clip: (ctx, i) ->
    # This method should not begin or close a path
    @visuals.line.set_vectorize(ctx, i)
    ctx.moveTo(0.5*@size, @size)
    ctx.lineTo(0.5*@size, -2)
    ctx.lineTo(-0.5*@size, -2)
    ctx.lineTo(-0.5*@size, @size)
    ctx.lineTo(0.5*@size, @size)

  render: (ctx, i) ->
    if @visuals.fill.doit
      @visuals.fill.set_vectorize(ctx, i)
      @_normal(ctx, i)
      ctx.fill()

    if @visuals.line.doit
      @visuals.line.set_vectorize(ctx, i)
      @_normal(ctx, i)
      ctx.stroke()

  _normal: (ctx, i) ->
    ctx.beginPath()
    ctx.moveTo(0.5*@size, @size)
    ctx.lineTo(0, 0)
    ctx.lineTo(-0.5*@size, @size)
    ctx.closePath()

  @mixins ['line', 'fill']

  @define {
    size: [ p.Number, 25 ]
  }

  @override {
    fill_color: 'black'
  }

export class VeeHead extends ArrowHead
  type: 'VeeHead'

  clip: (ctx, i) ->
    # This method should not begin or close a path
    @visuals.line.set_vectorize(ctx, i)
    ctx.moveTo(0.5*@size, @size)
    ctx.lineTo(0.5*@size, -2)
    ctx.lineTo(-0.5*@size, -2)
    ctx.lineTo(-0.5*@size, @size)
    ctx.lineTo(0, 0.5*@size)
    ctx.lineTo(0.5*@size, @size)

  render: (ctx, i) ->
    if @visuals.fill.doit
      @visuals.fill.set_vectorize(ctx, i)
      @_vee(ctx, i)
      ctx.fill()

    if @visuals.line.doit
      @visuals.line.set_vectorize(ctx, i)
      @_vee(ctx, i)
      ctx.stroke()

  _vee: (ctx, i) ->
    ctx.beginPath()
    ctx.moveTo(0.5*@size, @size)
    ctx.lineTo(0, 0)
    ctx.lineTo(-0.5*@size, @size)
    ctx.lineTo(0, 0.5*@size)
    ctx.closePath()

  @mixins ['line', 'fill']

  @define {
    size: [ p.Number, 25 ]
  }

  @override {
    fill_color: 'black'
  }
