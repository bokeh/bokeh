import {Document} from "../document"
import * as embed from "../embed"
import * as models from "./models"
import {HasProps} from "../core/has_props"
import {Color, Data, Attrs} from "../core/types"
import {Value, Field, Vector} from "../core/vectorization"
import {VectorSpec, ScalarSpec, Property} from "../core/properties"
import {Class} from "../core/class"
import {Location} from "../core/enums"
import {startsWith} from "../core/util/string"
import {isEqual} from "../core/util/eq"
import {some, every, includes} from "../core/util/array"
import {clone, keys, entries} from "../core/util/object"
import {isNumber, isString, isArray} from "../core/util/types"
import {ViewOf} from "core/view"
import {enumerate} from "core/util/iterator"

import {Glyph, Marker, GlyphRenderer, Axis, Grid, Range, Scale, Tool, Plot, ColumnarDataSource, CDSView} from "./models"
import {ToolAliases} from "../models/tools/tool"

import {LayoutDOM} from "models/layouts/layout_dom"
import {Legend} from "models/annotations/legend"

export {gridplot} from "./gridplot"
export {rgb2hex as color} from "../core/util/color"

export type ToolName = keyof ToolAliases

const _default_tools: ToolName[] = ["pan", "wheel_zoom", "box_zoom", "save", "reset", "help"]

// export type ExtMarkerType = MarkerType | "*" | "+" | "o" | "ox" | "o+"

export type VectorArg<T> = T | T[] | Vector<T>

export type ColorArg = VectorArg<Color | null>
export type AlphaArg = VectorArg<number>

export type ColorAlpha = {
  color: ColorArg
  selection_color: ColorArg
  nonselection_color: ColorArg
  hover_color: ColorArg

  alpha: AlphaArg
  selection_alpha: AlphaArg
  nonselection_alpha: AlphaArg
  hover_alpha: AlphaArg
}

export type AuxFill = {
  selection_fill_color: ColorArg
  selection_fill_alpha: AlphaArg
  nonselection_fill_color: ColorArg
  nonselection_fill_alpha: AlphaArg
  hover_fill_color: ColorArg
  hover_fill_alpha: AlphaArg
}

export type AuxLine = {
  selection_line_color: ColorArg
  selection_line_alpha: AlphaArg
  nonselection_line_color: ColorArg
  nonselection_line_alpha: AlphaArg
  hover_line_color: ColorArg
  hover_line_alpha: AlphaArg
}

export type AuxText = {
  selection_text_color: ColorArg
  selection_text_alpha: AlphaArg
  nonselection_text_color: ColorArg
  nonselection_text_alpha: AlphaArg
  hover_text_color: ColorArg
  hover_text_alpha: AlphaArg
}

export type AuxGlyph = {
  source: ColumnarDataSource
  view: CDSView
  legend: string
}

export type ArgsOf<P> = {
  [K in keyof P]: (P[K] extends VectorSpec<infer T, infer V> ? T | T[] | V :
                  (P[K] extends ScalarSpec<infer T, infer S> ? T |       S :
                  (P[K] extends Property  <infer T>          ? T           : never)))
}

export type GlyphArgs<P> = ArgsOf<P> & AuxGlyph & ColorAlpha

export type AnnularWedgeArgs  = GlyphArgs<models.AnnularWedge.Props>  & AuxLine & AuxFill
export type AnnulusArgs       = GlyphArgs<models.Annulus.Props>       & AuxLine & AuxFill
export type ArcArgs           = GlyphArgs<models.Arc.Props>           & AuxLine
export type BezierArgs        = GlyphArgs<models.Bezier.Props>        & AuxLine
export type CircleArgs        = GlyphArgs<models.Circle.Props>        & AuxLine & AuxFill
export type EllipseArgs       = GlyphArgs<models.Ellipse.Props>       & AuxLine & AuxFill
export type HAreaArgs         = GlyphArgs<models.HArea.Props>                   & AuxFill
export type HBarArgs          = GlyphArgs<models.HBar.Props>          & AuxLine & AuxFill
export type HexTileArgs       = GlyphArgs<models.HexTile.Props>       & AuxLine & AuxFill
export type ImageArgs         = GlyphArgs<models.Image.Props>
export type ImageRGBAArgs     = GlyphArgs<models.ImageRGBA.Props>
export type ImageURLArgs      = GlyphArgs<models.ImageURL.Props>
export type LineArgs          = GlyphArgs<models.Line.Props>          & AuxLine
export type MarkerArgs        = GlyphArgs<models.Marker.Props>        & AuxLine & AuxFill
export type MultiLineArgs     = GlyphArgs<models.MultiLine.Props>     & AuxLine
export type MultiPolygonsArgs = GlyphArgs<models.MultiPolygons.Props> & AuxLine & AuxFill
export type OvalArgs          = GlyphArgs<models.Oval.Props>          & AuxLine & AuxFill
export type PatchArgs         = GlyphArgs<models.Patch.Props>         & AuxLine & AuxFill
export type PatchesArgs       = GlyphArgs<models.Patches.Props>       & AuxLine & AuxFill
export type QuadArgs          = GlyphArgs<models.Quad.Props>          & AuxLine & AuxFill
export type QuadraticArgs     = GlyphArgs<models.Quadratic.Props>     & AuxLine
export type RayArgs           = GlyphArgs<models.Ray.Props>           & AuxLine
export type RectArgs          = GlyphArgs<models.Rect.Props>          & AuxLine & AuxFill
export type ScatterArgs       = GlyphArgs<models.Scatter.Props>       & AuxLine & AuxFill
export type SegmentArgs       = GlyphArgs<models.Segment.Props>       & AuxLine
export type StepArgs          = GlyphArgs<models.Step.Props>          & AuxLine
export type TextArgs          = GlyphArgs<models.Text.Props>                              & AuxText
export type VAreaArgs         = GlyphArgs<models.VArea.Props>                   & AuxFill
export type VBarArgs          = GlyphArgs<models.VBar.Props>          & AuxLine & AuxFill
export type WedgeArgs         = GlyphArgs<models.Wedge.Props>         & AuxLine & AuxFill

const _default_color = "#1f77b4"

const _default_alpha = 1.0

function _with_default<T>(value: T | undefined, default_value: T): T {
  return value === undefined ? default_value : value
}

export type AxisType = "auto" | "linear" | "datetime" | "log" | "mercator" | null

export namespace Figure {
  export type Attrs = Omit<Plot.Attrs, "x_range" | "y_range"> & {
    x_range: Range | [number, number] | string[]
    y_range: Range | [number, number] | string[]
    x_axis_type: AxisType
    y_axis_type: AxisType
    x_axis_location: Location
    y_axis_location: Location
    x_axis_label: string
    y_axis_label: string
    x_minor_ticks: number | "auto"
    y_minor_ticks: number | "auto"
    tools: (Tool | ToolName)[] | string
  }
}

export class Figure extends Plot {
  static __name__ = "Plot"

  get xgrid(): Grid[] {
    return this.center.filter((r): r is Grid => r instanceof Grid && r.dimension == 0)
  }
  get ygrid(): Grid[] {
    return this.center.filter((r): r is Grid => r instanceof Grid && r.dimension == 1)
  }

  get xaxis(): Axis[] {
    return this.below.concat(this.above).filter((r): r is Axis => r instanceof Axis)
  }
  get yaxis(): Axis[] {
    return this.left.concat(this.right).filter((r): r is Axis => r instanceof Axis)
  }

  get legend(): Legend {
    const legends = this.panels.filter((r): r is Legend => r instanceof Legend)

    if (legends.length == 0) {
      const legend = new Legend()
      this.add_layout(legend)
      return legend
    } else {
      const [legend] = legends
      return legend
    }
  }

  constructor(attrs: Partial<Figure.Attrs> = {}) {
    attrs = {...attrs}

    const tools = _with_default(attrs.tools, _default_tools)
    delete attrs.tools

    const x_axis_type = _with_default(attrs.x_axis_type, "auto")
    const y_axis_type = _with_default(attrs.y_axis_type, "auto")
    delete attrs.x_axis_type
    delete attrs.y_axis_type

    const x_minor_ticks = attrs.x_minor_ticks != null ? attrs.x_minor_ticks : "auto"
    const y_minor_ticks = attrs.y_minor_ticks != null ? attrs.y_minor_ticks : "auto"
    delete attrs.x_minor_ticks
    delete attrs.y_minor_ticks

    const x_axis_location = attrs.x_axis_location != null ? attrs.x_axis_location : "below"
    const y_axis_location = attrs.y_axis_location != null ? attrs.y_axis_location : "left"
    delete attrs.x_axis_location
    delete attrs.y_axis_location

    const x_axis_label = attrs.x_axis_label != null ? attrs.x_axis_label : ""
    const y_axis_label = attrs.y_axis_label != null ? attrs.y_axis_label : ""
    delete attrs.x_axis_label
    delete attrs.y_axis_label

    const x_range = Figure._get_range(attrs.x_range)
    const y_range = Figure._get_range(attrs.y_range)
    delete attrs.x_range
    delete attrs.y_range

    const x_scale = attrs.x_scale != null ? attrs.x_scale : Figure._get_scale(x_range, x_axis_type)
    const y_scale = attrs.y_scale != null ? attrs.y_scale : Figure._get_scale(y_range, y_axis_type)
    delete attrs.x_scale
    delete attrs.y_scale

    super({...attrs, x_range, y_range, x_scale, y_scale})

    this._process_axis_and_grid(x_axis_type, x_axis_location, x_minor_ticks, x_axis_label, x_range, 0)
    this._process_axis_and_grid(y_axis_type, y_axis_location, y_minor_ticks, y_axis_label, y_range, 1)

    this.add_tools(...this._process_tools(tools))
  }

  annular_wedge(args: Partial<AnnularWedgeArgs>): GlyphRenderer
  annular_wedge(
    x: AnnularWedgeArgs["x"],
    y: AnnularWedgeArgs["y"],
    inner_radius: AnnularWedgeArgs["inner_radius"],
    outer_radius: AnnularWedgeArgs["outer_radius"],
    start_angle: AnnularWedgeArgs["start_angle"],
    end_angle: AnnularWedgeArgs["end_angle"],
    args?: Partial<AnnularWedgeArgs>): GlyphRenderer
  annular_wedge(...args: unknown[]): GlyphRenderer {
    return this._glyph(models.AnnularWedge, "x,y,inner_radius,outer_radius,start_angle,end_angle", args)
  }

  annulus(args: Partial<AnnulusArgs>): GlyphRenderer
  annulus(
    x: AnnulusArgs["x"],
    y: AnnulusArgs["y"],
    inner_radius: AnnulusArgs["inner_radius"],
    outer_radius: AnnulusArgs["outer_radius"],
    args?: Partial<AnnulusArgs>): GlyphRenderer
  annulus(...args: unknown[]): GlyphRenderer {
    return this._glyph(models.Annulus, "x,y,inner_radius,outer_radius", args)
  }

  arc(args: Partial<ArcArgs>): GlyphRenderer
  arc(
    x: ArcArgs["x"],
    y: ArcArgs["y"],
    radius: ArcArgs["radius"],
    start_angle: ArcArgs["start_angle"],
    end_angle: ArcArgs["end_angle"],
    args?: Partial<ArcArgs>): GlyphRenderer
  arc(...args: unknown[]): GlyphRenderer {
    return this._glyph(models.Arc, "x,y,radius,start_angle,end_angle", args)
  }

  bezier(args: Partial<BezierArgs>): GlyphRenderer
  bezier(
    x0: BezierArgs["x0"],
    y0: BezierArgs["y0"],
    x1: BezierArgs["x1"],
    y1: BezierArgs["y1"],
    cx0: BezierArgs["cx0"],
    cy0: BezierArgs["cy0"],
    cx1: BezierArgs["cx1"],
    cy1: BezierArgs["cy1"],
    args?: Partial<BezierArgs>): GlyphRenderer
  bezier(...args: unknown[]): GlyphRenderer {
    return this._glyph(models.Bezier, "x0,y0,x1,y1,cx0,cy0,cx1,cy1", args)
  }

  circle(args: Partial<CircleArgs>): GlyphRenderer
  circle(
    x: CircleArgs["x"],
    y: CircleArgs["y"],
    args?: Partial<CircleArgs>): GlyphRenderer
  circle(...args: unknown[]): GlyphRenderer {
    return this._glyph(models.Circle, "x,y", args)
  }

  ellipse(args: Partial<EllipseArgs>): GlyphRenderer
  ellipse(
    x: EllipseArgs["x"],
    y: EllipseArgs["y"],
    width: EllipseArgs["width"],
    height: EllipseArgs["height"],
    args?: Partial<EllipseArgs>): GlyphRenderer
  ellipse(...args: unknown[]): GlyphRenderer {
    return this._glyph(models.Ellipse, "x,y,width,height", args)
  }

  harea(args: Partial<HAreaArgs>): GlyphRenderer
  harea(
    x1: HAreaArgs["x1"],
    x2: HAreaArgs["x2"],
    y: HAreaArgs["y"],
    args?: Partial<HAreaArgs>): GlyphRenderer
  harea(...args: unknown[]): GlyphRenderer {
    return this._glyph(models.HArea, "x1,x2,y", args)
  }

  hbar(args: Partial<HBarArgs>): GlyphRenderer
  hbar(
    y: HBarArgs["y"],
    height: HBarArgs["height"],
    right: HBarArgs["right"],
    left: HBarArgs["left"],
    args?: Partial<HBarArgs>): GlyphRenderer
  hbar(...args: unknown[]): GlyphRenderer {
    return this._glyph(models.HBar, "y,height,right,left", args)
  }

  hex_tile(args: Partial<HexTileArgs>): GlyphRenderer
  hex_tile(
    q: HexTileArgs["q"],
    r: HexTileArgs["r"],
    args?: Partial<HexTileArgs>): GlyphRenderer
  hex_tile(...args: unknown[]): GlyphRenderer {
    return this._glyph(models.HexTile, "q,r", args)
  }

  image(args: Partial<ImageArgs>): GlyphRenderer
  image(
    image: ImageArgs["image"],
    x: ImageArgs["x"],
    y: ImageArgs["y"],
    dw: ImageArgs["dw"],
    dh: ImageArgs["dh"],
    args?: Partial<ImageArgs>): GlyphRenderer
  image(...args: unknown[]): GlyphRenderer {
    return this._glyph(models.Image, "color_mapper,image,rows,cols,x,y,dw,dh", args)
  }

  image_rgba(args: Partial<ImageRGBAArgs>): GlyphRenderer
  image_rgba(
    image: ImageRGBAArgs["image"],
    x: ImageRGBAArgs["x"],
    y: ImageRGBAArgs["y"],
    dw: ImageRGBAArgs["dw"],
    dh: ImageRGBAArgs["dh"],
    args?: Partial<ImageRGBAArgs>): GlyphRenderer
  image_rgba(...args: unknown[]): GlyphRenderer {
    return this._glyph(models.ImageRGBA, "image,rows,cols,x,y,dw,dh", args)
  }

  image_url(args: Partial<ImageURLArgs>): GlyphRenderer
  image_url(
    url: ImageURLArgs["url"],
    x: ImageURLArgs["x"],
    y: ImageURLArgs["y"],
    w: ImageURLArgs["w"],
    h: ImageURLArgs["h"],
    args?: Partial<ImageURLArgs>): GlyphRenderer
  image_url(...args: unknown[]): GlyphRenderer {
    return this._glyph(models.ImageURL, "url,x,y,w,h", args)
  }

  line(args: Partial<LineArgs>): GlyphRenderer
  line(
    x: LineArgs["x"],
    y: LineArgs["y"],
    args?: Partial<LineArgs>): GlyphRenderer
  line(...args: unknown[]): GlyphRenderer {
    return this._glyph(models.Line, "x,y", args)
  }

  multi_line(args: Partial<MultiLineArgs>): GlyphRenderer
  multi_line(
    xs: MultiLineArgs["xs"],
    ys: MultiLineArgs["ys"],
    args?: Partial<MultiLineArgs>): GlyphRenderer
  multi_line(...args: unknown[]): GlyphRenderer {
    return this._glyph(models.MultiLine, "xs,ys", args)
  }

  multi_polygons(args: Partial<MultiPolygonsArgs>): GlyphRenderer
  multi_polygons(
    xs: MultiPolygonsArgs["xs"],
    ys: MultiPolygonsArgs["ys"],
    args?: Partial<MultiPolygonsArgs>): GlyphRenderer
  multi_polygons(...args: unknown[]): GlyphRenderer {
    return this._glyph(models.MultiPolygons, "xs,ys", args)
  }

  oval(args: Partial<OvalArgs>): GlyphRenderer
  oval(
    x: OvalArgs["x"],
    y: OvalArgs["y"],
    width: OvalArgs["width"],
    height: OvalArgs["height"],
    args?: Partial<OvalArgs>): GlyphRenderer
  oval(...args: unknown[]): GlyphRenderer {
    return this._glyph(models.Oval, "x,y,width,height", args)
  }

  patch(args: Partial<PatchArgs>): GlyphRenderer
  patch(
    x: PatchArgs["x"],
    y: PatchArgs["y"],
    args?: Partial<PatchArgs>): GlyphRenderer
  patch(...args: unknown[]): GlyphRenderer {
    return this._glyph(models.Patch, "x,y", args)
  }

  patches(args: Partial<PatchesArgs>): GlyphRenderer
  patches(
    xs: PatchesArgs["xs"],
    ys: PatchesArgs["ys"],
    args?: Partial<PatchesArgs>): GlyphRenderer
  patches(...args: unknown[]): GlyphRenderer {
    return this._glyph(models.Patches, "xs,ys", args)
  }

  quad(args: Partial<QuadArgs>): GlyphRenderer
  quad(
    left: QuadArgs["left"],
    right: QuadArgs["right"],
    bottom: QuadArgs["bottom"],
    top: QuadArgs["top"],
    args?: Partial<QuadArgs>): GlyphRenderer
  quad(...args: unknown[]): GlyphRenderer {
    return this._glyph(models.Quad, "left,right,bottom,top", args)
  }

  quadratic(args: Partial<QuadraticArgs>): GlyphRenderer
  quadratic(
    x0: QuadraticArgs["x0"],
    y0: QuadraticArgs["y0"],
    x1: QuadraticArgs["x1"],
    y1: QuadraticArgs["y1"],
    cx: QuadraticArgs["cx"],
    cy: QuadraticArgs["cy"],
    args?: Partial<QuadraticArgs>): GlyphRenderer
  quadratic(...args: unknown[]): GlyphRenderer {
    return this._glyph(models.Quadratic, "x0,y0,x1,y1,cx,cy", args)
  }

  ray(args: Partial<RayArgs>): GlyphRenderer
  ray(
    x: RayArgs["x"],
    y: RayArgs["y"],
    length: RayArgs["length"],
    args?: Partial<RayArgs>): GlyphRenderer
  ray(...args: unknown[]): GlyphRenderer {
    return this._glyph(models.Ray, "x,y,length", args)
  }

  rect(args: Partial<RectArgs>): GlyphRenderer
  rect(
    x: RectArgs["x"],
    y: RectArgs["y"],
    width: RectArgs["width"],
    height: RectArgs["height"],
    args?: Partial<RectArgs>): GlyphRenderer
  rect(...args: unknown[]): GlyphRenderer {
    return this._glyph(models.Rect, "x,y,width,height", args)
  }

  segment(args: Partial<SegmentArgs>): GlyphRenderer
  segment(
    x0: SegmentArgs["x0"],
    y0: SegmentArgs["y0"],
    x1: SegmentArgs["x1"],
    y1: SegmentArgs["y1"],
    args?: Partial<SegmentArgs>): GlyphRenderer
  segment(...args: unknown[]): GlyphRenderer {
    return this._glyph(models.Segment, "x0,y0,x1,y1", args)
  }

  step(args: Partial<StepArgs>): GlyphRenderer
  step(
    x: StepArgs["x"],
    y: StepArgs["y"],
    mode: StepArgs["mode"],
    args?: Partial<StepArgs>): GlyphRenderer
  step(...args: unknown[]): GlyphRenderer {
    return this._glyph(models.Step, "x,y,mode", args)
  }

  text(args: Partial<TextArgs>): GlyphRenderer
  text(
    x: TextArgs["x"],
    y: TextArgs["y"],
    text: TextArgs["text"],
    args?: Partial<TextArgs>): GlyphRenderer
  text(...args: unknown[]): GlyphRenderer {
    return this._glyph(models.Text, "x,y,text", args)
  }

  varea(args: Partial<VAreaArgs>): GlyphRenderer
  varea(
    x: VAreaArgs["x"],
    y1: VAreaArgs["y1"],
    y2: VAreaArgs["y2"],
    args?: Partial<VAreaArgs>): GlyphRenderer
  varea(...args: unknown[]): GlyphRenderer {
    return this._glyph(models.VArea, "x,y1,y2", args)
  }

  vbar(args: Partial<VBarArgs>): GlyphRenderer
  vbar(
    x: VBarArgs["x"],
    width: VBarArgs["width"],
    top: VBarArgs["top"],
    bottom: VBarArgs["bottom"],
    args?: Partial<VBarArgs>): GlyphRenderer
  vbar(...args: unknown[]): GlyphRenderer {
    return this._glyph(models.VBar, "x,width,top,bottom", args)
  }

  wedge(args: Partial<WedgeArgs>): GlyphRenderer
  wedge(
    x: WedgeArgs["x"],
    y: WedgeArgs["y"],
    radius: WedgeArgs["radius"],
    start_angle: WedgeArgs["start_angle"],
    end_angle: WedgeArgs["end_angle"],
    args?: Partial<WedgeArgs>): GlyphRenderer
  wedge(...args: unknown[]): GlyphRenderer {
    return this._glyph(models.Wedge, "x,y,radius,start_angle,end_angle", args)
  }

  asterisk(args: Partial<MarkerArgs>): GlyphRenderer
  asterisk(x: MarkerArgs["x"], y: MarkerArgs["y"], args?: Partial<MarkerArgs>): GlyphRenderer
  asterisk(...args: unknown[]): GlyphRenderer {
    return this._marker(models.Asterisk, args)
  }

  circle_cross(args: Partial<MarkerArgs>): GlyphRenderer
  circle_cross(x: MarkerArgs["x"], y: MarkerArgs["y"], args?: Partial<MarkerArgs>): GlyphRenderer
  circle_cross(...args: unknown[]): GlyphRenderer {
    return this._marker(models.CircleCross, args)
  }

  circle_dot(args: Partial<MarkerArgs>): GlyphRenderer
  circle_dot(x: MarkerArgs["x"], y: MarkerArgs["y"], args?: Partial<MarkerArgs>): GlyphRenderer
  circle_dot(...args: unknown[]): GlyphRenderer {
    return this._marker(models.CircleDot, args)
  }

  circle_x(args: Partial<MarkerArgs>): GlyphRenderer
  circle_x(x: MarkerArgs["x"], y: MarkerArgs["y"], args?: Partial<MarkerArgs>): GlyphRenderer
  circle_x(...args: unknown[]): GlyphRenderer {
    return this._marker(models.CircleX, args)
  }

  circle_y(args: Partial<MarkerArgs>): GlyphRenderer
  circle_y(x: MarkerArgs["x"], y: MarkerArgs["y"], args?: Partial<MarkerArgs>): GlyphRenderer
  circle_y(...args: unknown[]): GlyphRenderer {
    return this._marker(models.CircleY, args)
  }

  cross(args: Partial<MarkerArgs>): GlyphRenderer
  cross(x: MarkerArgs["x"], y: MarkerArgs["y"], args?: Partial<MarkerArgs>): GlyphRenderer
  cross(...args: unknown[]): GlyphRenderer {
    return this._marker(models.Cross, args)
  }

  dash(args: Partial<MarkerArgs>): GlyphRenderer
  dash(x: MarkerArgs["x"], y: MarkerArgs["y"], args?: Partial<MarkerArgs>): GlyphRenderer
  dash(...args: unknown[]): GlyphRenderer {
    return this._marker(models.Dash, args)
  }

  diamond(args: Partial<MarkerArgs>): GlyphRenderer
  diamond(x: MarkerArgs["x"], y: MarkerArgs["y"], args?: Partial<MarkerArgs>): GlyphRenderer
  diamond(...args: unknown[]): GlyphRenderer {
    return this._marker(models.Diamond, args)
  }

  diamond_cross(args: Partial<MarkerArgs>): GlyphRenderer
  diamond_cross(x: MarkerArgs["x"], y: MarkerArgs["y"], args?: Partial<MarkerArgs>): GlyphRenderer
  diamond_cross(...args: unknown[]): GlyphRenderer {
    return this._marker(models.DiamondCross, args)
  }

  diamond_dot(args: Partial<MarkerArgs>): GlyphRenderer
  diamond_dot(x: MarkerArgs["x"], y: MarkerArgs["y"], args?: Partial<MarkerArgs>): GlyphRenderer
  diamond_dot(...args: unknown[]): GlyphRenderer {
    return this._marker(models.DiamondDot, args)
  }

  dot(args: Partial<MarkerArgs>): GlyphRenderer
  dot(x: MarkerArgs["x"], y: MarkerArgs["y"], args?: Partial<MarkerArgs>): GlyphRenderer
  dot(...args: unknown[]): GlyphRenderer {
    return this._marker(models.Dot, args)
  }

  hex(args: Partial<MarkerArgs>): GlyphRenderer
  hex(x: MarkerArgs["x"], y: MarkerArgs["y"], args?: Partial<MarkerArgs>): GlyphRenderer
  hex(...args: unknown[]): GlyphRenderer {
    return this._marker(models.Hex, args)
  }

  hex_dot(args: Partial<MarkerArgs>): GlyphRenderer
  hex_dot(x: MarkerArgs["x"], y: MarkerArgs["y"], args?: Partial<MarkerArgs>): GlyphRenderer
  hex_dot(...args: unknown[]): GlyphRenderer {
    return this._marker(models.HexDot, args)
  }

  inverted_triangle(args: Partial<MarkerArgs>): GlyphRenderer
  inverted_triangle(x: MarkerArgs["x"], y: MarkerArgs["y"], args?: Partial<MarkerArgs>): GlyphRenderer
  inverted_triangle(...args: unknown[]): GlyphRenderer {
    return this._marker(models.InvertedTriangle, args)
  }

  plus(args: Partial<MarkerArgs>): GlyphRenderer
  plus(x: MarkerArgs["x"], y: MarkerArgs["y"], args?: Partial<MarkerArgs>): GlyphRenderer
  plus(...args: unknown[]): GlyphRenderer {
    return this._marker(models.Plus, args)
  }

  square(args: Partial<MarkerArgs>): GlyphRenderer
  square(x: MarkerArgs["x"], y: MarkerArgs["y"], args?: Partial<MarkerArgs>): GlyphRenderer
  square(...args: unknown[]): GlyphRenderer {
    return this._marker(models.Square, args)
  }

  square_cross(args: Partial<MarkerArgs>): GlyphRenderer
  square_cross(x: MarkerArgs["x"], y: MarkerArgs["y"], args?: Partial<MarkerArgs>): GlyphRenderer
  square_cross(...args: unknown[]): GlyphRenderer {
    return this._marker(models.SquareCross, args)
  }

  square_dot(args: Partial<MarkerArgs>): GlyphRenderer
  square_dot(x: MarkerArgs["x"], y: MarkerArgs["y"], args?: Partial<MarkerArgs>): GlyphRenderer
  square_dot(...args: unknown[]): GlyphRenderer {
    return this._marker(models.SquareDot, args)
  }

  square_pin(args: Partial<MarkerArgs>): GlyphRenderer
  square_pin(x: MarkerArgs["x"], y: MarkerArgs["y"], args?: Partial<MarkerArgs>): GlyphRenderer
  square_pin(...args: unknown[]): GlyphRenderer {
    return this._marker(models.SquarePin, args)
  }

  square_x(args: Partial<MarkerArgs>): GlyphRenderer
  square_x(x: MarkerArgs["x"], y: MarkerArgs["y"], args?: Partial<MarkerArgs>): GlyphRenderer
  square_x(...args: unknown[]): GlyphRenderer {
    return this._marker(models.SquareX, args)
  }

  triangle(args: Partial<MarkerArgs>): GlyphRenderer
  triangle(x: MarkerArgs["x"], y: MarkerArgs["y"], args?: Partial<MarkerArgs>): GlyphRenderer
  triangle(...args: unknown[]): GlyphRenderer {
    return this._marker(models.Triangle, args)
  }

  triangle_dot(args: Partial<MarkerArgs>): GlyphRenderer
  triangle_dot(x: MarkerArgs["x"], y: MarkerArgs["y"], args?: Partial<MarkerArgs>): GlyphRenderer
  triangle_dot(...args: unknown[]): GlyphRenderer {
    return this._marker(models.TriangleDot, args)
  }

  triangle_pin(args: Partial<MarkerArgs>): GlyphRenderer
  triangle_pin(x: MarkerArgs["x"], y: MarkerArgs["y"], args?: Partial<MarkerArgs>): GlyphRenderer
  triangle_pin(...args: unknown[]): GlyphRenderer {
    return this._marker(models.TrianglePin, args)
  }

  x(args: Partial<MarkerArgs>): GlyphRenderer
  x(x: MarkerArgs["x"], y: MarkerArgs["y"], args?: Partial<MarkerArgs>): GlyphRenderer
  x(...args: unknown[]): GlyphRenderer {
    return this._marker(models.X, args)
  }

  y(args: Partial<MarkerArgs>): GlyphRenderer
  y(x: MarkerArgs["x"], y: MarkerArgs["y"], args?: Partial<MarkerArgs>): GlyphRenderer
  y(...args: unknown[]): GlyphRenderer {
    return this._marker(models.Y, args)
  }

  scatter(args: Partial<ScatterArgs>): GlyphRenderer
  scatter(x: MarkerArgs["x"], y: MarkerArgs["y"], args?: Partial<ScatterArgs>): GlyphRenderer
  scatter(...args: unknown[]): GlyphRenderer {
    return this._marker(models.Scatter, args)
  }

  _pop_visuals(cls: Class<HasProps>, props: Attrs, prefix: string = "",
                        defaults: Attrs = {}, override_defaults: Attrs = {}): Attrs {

    const _split_feature_trait = function(ft: string): string[] {
      const fta: string[] = ft.split('_', 2)
      if (fta.length==2) { return fta } else { return fta.concat(['']) }
    }
    const _is_visual = function(ft: string): boolean {
      const [feature, trait] = _split_feature_trait(ft)
      return includes(['line', 'fill', 'text', 'global'], feature) && (trait!=='')
    }

    defaults = {...defaults}
    if (!defaults.hasOwnProperty('text_color')) {
      defaults.text_color = 'black'
    }
    const trait_defaults: Attrs = {}
    if (!trait_defaults.hasOwnProperty('color')) {
      trait_defaults.color = _default_color
    }
    if (!trait_defaults.hasOwnProperty('alpha')){
      trait_defaults.alpha = _default_alpha
    }

    const result: Attrs = {}
    const traits = new Set()
    for (const pname of keys(cls.prototype._props)) {
      if (_is_visual(pname)) {
        const trait = _split_feature_trait(pname)[1]
        if (props.hasOwnProperty(prefix+pname)) {
          result[pname] = props[prefix+pname]
          delete props[prefix+pname]
        } else if (!cls.prototype._props.hasOwnProperty(trait) && props.hasOwnProperty(prefix+trait)) {
          result[pname] = props[prefix+trait]
        } else if (override_defaults.hasOwnProperty(trait)) {
          result[pname] = override_defaults[trait]
        } else if (defaults.hasOwnProperty(pname)) {
          result[pname] = defaults[pname]
        } else if (trait_defaults.hasOwnProperty(trait)) {
          result[pname] = trait_defaults[trait]
        }
        if (!cls.prototype._props.hasOwnProperty(trait)) {
          traits.add(trait)
        }
      }
    }
    traits.forEach(function(_key, val, _obj) {
      delete props[prefix+val]
    })

    return result
  }

  _find_uniq_name(data: Data, name: string): string {
    let i = 1
    while (true) {
      const new_name = `${name}__${i}`
      if (data[new_name] != null) {
        i += 1
      } else {
        return new_name
      }
    }
  }

  _fixup_values(cls: Class<HasProps>, data: Data, attrs: Attrs): void {
    for (const [name, value] of entries(attrs)) {
      const prop = cls.prototype._props[name]

      if (prop != null) {
        if (prop.type.prototype instanceof VectorSpec) {
          if (value != null) {
            if (isArray(value)) {
              let field
              if (data[name] != null) {
                if (data[name] !== value) {
                  field = this._find_uniq_name(data, name)
                  data[field] = value
                } else {
                  field = name
                }
              } else {
                field = name
                data[field] = value
              }

              attrs[name] = { field }
            } else if (isNumber(value) || isString(value)) { // or Date?
              attrs[name] = { value }
            }
          }
        }
      }
    }
  }

  _glyph(cls: Class<Glyph>, params_string: string, args: unknown[]): GlyphRenderer {
    const params = params_string.split(",")

    let attrs: Attrs
    if (args.length == 0) {
      attrs = {}
    } else if (args.length == 1) {
      attrs = {...args[0] as Attrs}
    } else {
      if (args.length == params.length)
        attrs = {}
      else
        attrs = {...args[args.length - 1] as Attrs}

      for (const [param, i] of enumerate(params)) {
        attrs[param] = args[i]
      }
    }

    const source = attrs.source != null ? attrs.source as AuxGlyph["source"] : new models.ColumnDataSource()
    const data = clone(source.data)
    delete attrs.source

    const view = attrs.view != null ? attrs.view as AuxGlyph["view"] : new CDSView({source})
    delete attrs.view

    const legend = this._process_legend(attrs.legend as AuxGlyph["legend"], source)
    delete attrs.legend

    const has_sglyph = some(Object.keys(attrs), key => startsWith(key, "selection_"))
    const has_hglyph = some(Object.keys(attrs), key => startsWith(key, "hover_"))

    const glyph_ca   = this._pop_visuals(cls, attrs)
    const nsglyph_ca = this._pop_visuals(cls, attrs, "nonselection_", glyph_ca, {alpha: 0.1})
    const sglyph_ca  = has_sglyph ? this._pop_visuals(cls, attrs, "selection_", glyph_ca) : {}
    const hglyph_ca  = has_hglyph ? this._pop_visuals(cls, attrs, "hover_", glyph_ca) : {}

    this._fixup_values(cls, data,   glyph_ca)
    this._fixup_values(cls, data, nsglyph_ca)
    this._fixup_values(cls, data,  sglyph_ca)
    this._fixup_values(cls, data,  hglyph_ca)

    this._fixup_values(cls, data, attrs)

    source.data = data

    const _make_glyph = (cls: Class<Glyph>, attrs: Attrs, extra_attrs: Attrs) => {
      return new cls({...attrs, ...extra_attrs})
    }

    const glyph   = _make_glyph(cls, attrs,   glyph_ca)
    const nsglyph = _make_glyph(cls, attrs, nsglyph_ca)
    const sglyph  = has_sglyph ? _make_glyph(cls, attrs, sglyph_ca) : undefined
    const hglyph  = has_hglyph ? _make_glyph(cls, attrs, hglyph_ca) : undefined

    const glyph_renderer = new GlyphRenderer({
      data_source:        source,
      view,
      glyph,
      nonselection_glyph: nsglyph,
      selection_glyph:    sglyph,
      hover_glyph:        hglyph,
    })

    if (legend != null) {
      this._update_legend(legend, glyph_renderer)
    }

    this.add_renderers(glyph_renderer)
    return glyph_renderer
  }

  _marker(cls: Class<Marker>, args: unknown[]): GlyphRenderer {
    return this._glyph(cls, "x,y", args)
  }

  static _get_range(range?: Range | [number, number] | string[]): Range {
    if (range == null) {
      return new models.DataRange1d()
    }
    if (range instanceof models.Range) {
      return range
    }
    if (isArray(range)) {
      if (every(range, isString)) {
        const factors = range as string[]
        return new models.FactorRange({factors})
      }
      if (range.length == 2) {
        const [start, end] = range as [number, number]
        return new models.Range1d({start, end})
      }
    }
    throw new Error(`unable to determine proper range for: '${range}'`)
  }

  static _get_scale(range_input: Range, axis_type: AxisType): Scale {
    if (range_input instanceof models.DataRange1d ||
        range_input instanceof models.Range1d) {
      switch (axis_type) {
        case null:
        case "auto":
        case "linear":
        case "datetime":
        case "mercator":
          return new models.LinearScale()
        case "log":
          return new models.LogScale()
      }
    }

    if (range_input instanceof models.FactorRange) {
      return new models.CategoricalScale()
    }

    throw new Error(`unable to determine proper scale for: '${range_input}'`)
  }

  _process_axis_and_grid(axis_type: AxisType, axis_location: Location,
                         minor_ticks: number | "auto" | undefined, axis_label: string, rng: Range, dim: 0 | 1): void {
    const axis = this._get_axis(axis_type, rng, dim)
    if (axis != null) {
      if (axis instanceof models.LogAxis) {
        if (dim == 0) {
          this.x_scale = new models.LogScale()
        } else {
          this.y_scale = new models.LogScale()
        }
      }

      if (axis.ticker instanceof models.ContinuousTicker) {
        axis.ticker.num_minor_ticks = this._get_num_minor_ticks(axis, minor_ticks)
      }
      if (axis_label.length !== 0) {
        axis.axis_label = axis_label
      }

      const grid = new models.Grid({dimension: dim, ticker: axis.ticker})

      if (axis_location !== null) {
        this.add_layout(axis, axis_location)
      }
      this.add_layout(grid)
    }
  }

  _get_axis(axis_type: AxisType, range: Range, dim: 0 | 1): Axis | null {
    switch (axis_type) {
      case null:
        return null
      case "linear":
        return new models.LinearAxis()
      case "log":
        return new models.LogAxis()
      case "datetime":
        return new models.DatetimeAxis()
      case "mercator": {
        const axis = new models.MercatorAxis()
        const dimension = dim == 0 ? "lon" : "lat"
        axis.ticker.dimension = dimension
        axis.formatter.dimension = dimension
        return axis
      }
      case "auto":
        if (range instanceof models.FactorRange)
          return new models.CategoricalAxis()
        else
          return new models.LinearAxis() // TODO: return models.DatetimeAxis (Date type)
      default:
        throw new Error("shouldn't have happened")
    }
  }

  _get_num_minor_ticks(axis: Axis, num_minor_ticks?: number | "auto"): number {
    if (isNumber(num_minor_ticks)) {
      if (num_minor_ticks <= 1) {
        throw new Error("num_minor_ticks must be > 1")
      }
      return num_minor_ticks
    }
    if (num_minor_ticks == null) {
      return 0
    }
    if (num_minor_ticks === "auto") {
      return axis instanceof models.LogAxis ? 10 : 5
    }
    throw new Error("shouldn't have happened")
  }

  _process_tools(tools: (Tool | string)[] | string): Tool[] {
    if (isString(tools))
      tools = tools.split(/\s*,\s*/).filter((tool) => tool.length > 0)
    return tools.map((tool) => isString(tool) ? Tool.from_string(tool) : tool)
  }

  _process_legend(legend: string | Vector<string> | undefined, source: ColumnarDataSource): Vector<string> | null {
    let legend_item_label = null
    if (legend != null) {
      if (isString(legend)) {
        legend_item_label = { value: legend }
        if (source.columns() != null) {
          if (includes(source.columns(), legend)) {
            legend_item_label = { field: legend }
          }
        }
      } else {
        legend_item_label = legend
      }
    }
    return legend_item_label
  }

  _update_legend(legend_item_label: Vector<string>, glyph_renderer: GlyphRenderer): void {
    const {legend} = this
    let added = false
    for (const item of legend.items) {
      if (item.label != null && isEqual(item.label, legend_item_label)) {
        // XXX: remove this when vectorable properties are refined
        const label = item.label as Value<string> | Field
        if ("value" in label) {
          item.renderers.push(glyph_renderer)
          added = true
          break
        }
        if ("field" in label && glyph_renderer.data_source == item.renderers[0].data_source) {
          item.renderers.push(glyph_renderer)
          added = true
          break
        }
      }
    }
    if (!added) {
      const new_item = new models.LegendItem({ label: legend_item_label, renderers: [glyph_renderer] })
      legend.items.push(new_item)
    }
  }
}

export function figure(attributes?: Partial<Figure.Attrs>): Figure {
  return new Figure(attributes)
}

declare const $: any

export async function show<T extends LayoutDOM>(obj: T, target?: HTMLElement | string): Promise<ViewOf<T>>
export async function show<T extends LayoutDOM>(obj: T[], target?: HTMLElement | string): Promise<ViewOf<T>[]>

export async function show<T extends LayoutDOM>(obj: T | T[], target?: HTMLElement | string): Promise<ViewOf<LayoutDOM> | ViewOf<T>[]> {
  const doc = new Document()

  for (const item of isArray(obj) ? obj : [obj])
    doc.add_root(item)

  let element: HTMLElement
  if (target == null) {
    element = document.body
  } else if (isString(target)) {
    const found = document.querySelector(target)
    if (found != null && found instanceof HTMLElement)
      element = found
    else
      throw new Error(`'${target}' selector didn't match any elements`)
  } else if (target instanceof HTMLElement) {
    element = target
  } else if (typeof $ !== 'undefined' && (target as any) instanceof $) {
    element = (target as any)[0]
  } else {
    throw new Error("target should be HTMLElement, string selector, $ or null")
  }

  const views = await embed.add_document_standalone(doc, element) as ViewOf<LayoutDOM>[]

  return new Promise((resolve, _reject) => {
    const result = isArray(obj) ? views : views[0]
    if (doc.is_idle)
      resolve(result)
    else
      doc.idle.connect(() => resolve(result))
  })
}
