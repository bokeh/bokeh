import {Document} from "../document"
import * as embed from "../embed"
import {HasProps} from "../core/has_props"
import {Color, Data, Attrs, Arrayable} from "../core/types"
import {Value, Field, Vector} from "../core/vectorization"
import {VectorSpec, ScalarSpec, ColorSpec, Property} from "../core/properties"
import {Class} from "../core/class"
import {Location, MarkerType, RenderLevel} from "../core/enums"
import {is_equal} from "../core/util/eq"
import {includes} from "../core/util/array"
import {clone, keys, entries, is_empty} from "../core/util/object"
import {isNumber, isString, isArray, isArrayOf} from "../core/util/types"
import {ViewOf} from "core/view"
import {dom_ready} from "core/dom"
import {enumerate} from "core/util/iterator"
import * as nd from "core/util/ndarray"

import {
  Glyph, GlyphRenderer, Axis, Grid,
  Range, Range1d, DataRange1d, FactorRange,
  Scale, LinearScale, LogScale, CategoricalScale,
  LinearAxis, LogAxis, CategoricalAxis, DatetimeAxis, MercatorAxis,
  ColumnarDataSource, ColumnDataSource, CDSView,
  Plot, Tool, ContinuousTicker,
} from "./models"

import {
  AnnularWedge, Annulus, Arc, Bezier, Circle, Ellipse, HArea,
  HBar, HexTile, Image, ImageRGBA, ImageURL, Line, MultiLine,
  MultiPolygons, Oval, Patch, Patches, Quad, Quadratic, Ray,
  Rect, Scatter, Segment, Spline, Step, Text, VArea, VBar, Wedge,
} from "../models/glyphs"

import {Marker} from "../models/glyphs/marker"
import {LayoutDOM} from "../models/layouts/layout_dom"
import {Legend} from "../models/annotations/legend"
import {LegendItem} from "../models/annotations/legend_item"
import {ToolAliases} from "../models/tools/tool"

export {gridplot} from "./gridplot"
export {color2css as color} from "../core/util/color"

const {hasOwnProperty} = Object.prototype

export type TypedGlyphRenderer<G extends Glyph> = GlyphRenderer & {glyph: G}

export type ToolName = keyof ToolAliases

const _default_tools: ToolName[] = ["pan", "wheel_zoom", "box_zoom", "save", "reset", "help"]

// export type ExtMarkerType = MarkerType | "*" | "+" | "o" | "ox" | "o+"

export type ColorNDArray = nd.Uint32Array1d | nd.Uint8Array1d | nd.Uint8Array2d | nd.FloatArray2d
export type VectorArg<T> = T | Arrayable<T> | Vector<T>

export type ColorArg = VectorArg<Color | null> | ColorNDArray
export type AlphaArg = VectorArg<number>

export type ColorAlpha = {
  color: ColorArg
  selection_color: ColorArg
  nonselection_color: ColorArg
  hover_color: ColorArg
  muted_color: ColorArg

  alpha: AlphaArg
  selection_alpha: AlphaArg
  nonselection_alpha: AlphaArg
  hover_alpha: AlphaArg
  muted_alpha: AlphaArg
}

export type AuxFill = {
  selection_fill_color: ColorArg
  selection_fill_alpha: AlphaArg
  nonselection_fill_color: ColorArg
  nonselection_fill_alpha: AlphaArg
  hover_fill_color: ColorArg
  hover_fill_alpha: AlphaArg
  muted_fill_color: ColorArg
  muted_fill_alpha: AlphaArg
}

export type AuxLine = {
  selection_line_color: ColorArg
  selection_line_alpha: AlphaArg
  nonselection_line_color: ColorArg
  nonselection_line_alpha: AlphaArg
  hover_line_color: ColorArg
  hover_line_alpha: AlphaArg
  muted_line_color: ColorArg
  muted_line_alpha: AlphaArg
}

export type AuxText = {
  selection_text_color: ColorArg
  selection_text_alpha: AlphaArg
  nonselection_text_color: ColorArg
  nonselection_text_alpha: AlphaArg
  hover_text_color: ColorArg
  hover_text_alpha: AlphaArg
  muted_text_color: ColorArg
  muted_text_alpha: AlphaArg
}

export type AuxGlyph = {
  source: ColumnarDataSource | ColumnarDataSource["data"]
  view: CDSView
  legend: string
  level: RenderLevel
  name: string
  visible: boolean
  x_range_name: string
  y_range_name: string
}

export type ArgsOf<P> = {
  [K in keyof P]:
    (P[K] extends ColorSpec                     ? ColorArg             :
    (P[K] extends VectorSpec<infer T, infer V>  ? T | Arrayable<T> | V :
    (P[K] extends ScalarSpec<infer T, infer S>  ? T |                S :
    (P[K] extends Property  <infer T>           ? T                    : never))))
}

export type GlyphArgs<P> = ArgsOf<P> & AuxGlyph & ColorAlpha

export type AnnularWedgeArgs  = GlyphArgs<AnnularWedge.Props>  & AuxLine & AuxFill
export type AnnulusArgs       = GlyphArgs<Annulus.Props>       & AuxLine & AuxFill
export type ArcArgs           = GlyphArgs<Arc.Props>           & AuxLine
export type BezierArgs        = GlyphArgs<Bezier.Props>        & AuxLine
export type CircleArgs        = GlyphArgs<Circle.Props>        & AuxLine & AuxFill
export type EllipseArgs       = GlyphArgs<Ellipse.Props>       & AuxLine & AuxFill
export type HAreaArgs         = GlyphArgs<HArea.Props>                   & AuxFill
export type HBarArgs          = GlyphArgs<HBar.Props>          & AuxLine & AuxFill
export type HexTileArgs       = GlyphArgs<HexTile.Props>       & AuxLine & AuxFill
export type ImageArgs         = GlyphArgs<Image.Props>
export type ImageRGBAArgs     = GlyphArgs<ImageRGBA.Props>
export type ImageURLArgs      = GlyphArgs<ImageURL.Props>
export type LineArgs          = GlyphArgs<Line.Props>          & AuxLine
export type MarkerArgs        = GlyphArgs<Marker.Props>        & AuxLine & AuxFill
export type MultiLineArgs     = GlyphArgs<MultiLine.Props>     & AuxLine
export type MultiPolygonsArgs = GlyphArgs<MultiPolygons.Props> & AuxLine & AuxFill
export type OvalArgs          = GlyphArgs<Oval.Props>          & AuxLine & AuxFill
export type PatchArgs         = GlyphArgs<Patch.Props>         & AuxLine & AuxFill
export type PatchesArgs       = GlyphArgs<Patches.Props>       & AuxLine & AuxFill
export type QuadArgs          = GlyphArgs<Quad.Props>          & AuxLine & AuxFill
export type QuadraticArgs     = GlyphArgs<Quadratic.Props>     & AuxLine
export type RayArgs           = GlyphArgs<Ray.Props>           & AuxLine
export type RectArgs          = GlyphArgs<Rect.Props>          & AuxLine & AuxFill
export type ScatterArgs       = GlyphArgs<Scatter.Props>       & AuxLine & AuxFill
export type SegmentArgs       = GlyphArgs<Segment.Props>       & AuxLine
export type SplineArgs        = GlyphArgs<Spline.Props>        & AuxLine
export type StepArgs          = GlyphArgs<Step.Props>          & AuxLine
export type TextArgs          = GlyphArgs<Text.Props>                              & AuxText
export type VAreaArgs         = GlyphArgs<VArea.Props>                   & AuxFill
export type VBarArgs          = GlyphArgs<VBar.Props>          & AuxLine & AuxFill
export type WedgeArgs         = GlyphArgs<Wedge.Props>         & AuxLine & AuxFill

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
  static override __name__ = "Plot"

  get xgrid(): Grid[] {
    return this.center.filter((r): r is Grid => r instanceof Grid && r.dimension == 0)
  }
  get ygrid(): Grid[] {
    return this.center.filter((r): r is Grid => r instanceof Grid && r.dimension == 1)
  }

  get xaxis(): Axis[] {
    return [...this.below, ...this.above].filter((r): r is Axis => r instanceof Axis)
  }
  get yaxis(): Axis[] {
    return [...this.left, ...this.right].filter((r): r is Axis => r instanceof Axis)
  }

  get grid(): Grid[] {
    return this.center.filter((r): r is Grid => r instanceof Grid)
  }
  get axis(): Axis[] {
    return [...this.below, ...this.above, ...this.left, ...this.right].filter((r): r is Axis => r instanceof Axis)
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

  annular_wedge(args: Partial<AnnularWedgeArgs>): TypedGlyphRenderer<AnnularWedge>
  annular_wedge(
    x: AnnularWedgeArgs["x"],
    y: AnnularWedgeArgs["y"],
    inner_radius: AnnularWedgeArgs["inner_radius"],
    outer_radius: AnnularWedgeArgs["outer_radius"],
    start_angle: AnnularWedgeArgs["start_angle"],
    end_angle: AnnularWedgeArgs["end_angle"],
    args?: Partial<AnnularWedgeArgs>): TypedGlyphRenderer<AnnularWedge>
  annular_wedge(...args: unknown[]): TypedGlyphRenderer<AnnularWedge> {
    return this._glyph(AnnularWedge, "x,y,inner_radius,outer_radius,start_angle,end_angle", args)
  }

  annulus(args: Partial<AnnulusArgs>): TypedGlyphRenderer<Annulus>
  annulus(
    x: AnnulusArgs["x"],
    y: AnnulusArgs["y"],
    inner_radius: AnnulusArgs["inner_radius"],
    outer_radius: AnnulusArgs["outer_radius"],
    args?: Partial<AnnulusArgs>): TypedGlyphRenderer<Annulus>
  annulus(...args: unknown[]): TypedGlyphRenderer<Annulus> {
    return this._glyph(Annulus, "x,y,inner_radius,outer_radius", args)
  }

  arc(args: Partial<ArcArgs>): TypedGlyphRenderer<Arc>
  arc(
    x: ArcArgs["x"],
    y: ArcArgs["y"],
    radius: ArcArgs["radius"],
    start_angle: ArcArgs["start_angle"],
    end_angle: ArcArgs["end_angle"],
    args?: Partial<ArcArgs>): TypedGlyphRenderer<Arc>
  arc(...args: unknown[]): TypedGlyphRenderer<Arc> {
    return this._glyph(Arc, "x,y,radius,start_angle,end_angle", args)
  }

  bezier(args: Partial<BezierArgs>): TypedGlyphRenderer<Bezier>
  bezier(
    x0: BezierArgs["x0"],
    y0: BezierArgs["y0"],
    x1: BezierArgs["x1"],
    y1: BezierArgs["y1"],
    cx0: BezierArgs["cx0"],
    cy0: BezierArgs["cy0"],
    cx1: BezierArgs["cx1"],
    cy1: BezierArgs["cy1"],
    args?: Partial<BezierArgs>): TypedGlyphRenderer<Bezier>
  bezier(...args: unknown[]): TypedGlyphRenderer<Bezier> {
    return this._glyph(Bezier, "x0,y0,x1,y1,cx0,cy0,cx1,cy1", args)
  }

  circle(args: Partial<CircleArgs>): TypedGlyphRenderer<Circle>
  circle(
    x: CircleArgs["x"],
    y: CircleArgs["y"],
    args?: Partial<CircleArgs>): TypedGlyphRenderer<Circle>
  circle(...args: unknown[]): TypedGlyphRenderer<Circle> {
    return this._glyph(Circle, "x,y", args)
  }

  ellipse(args: Partial<EllipseArgs>): TypedGlyphRenderer<Ellipse>
  ellipse(
    x: EllipseArgs["x"],
    y: EllipseArgs["y"],
    width: EllipseArgs["width"],
    height: EllipseArgs["height"],
    args?: Partial<EllipseArgs>): TypedGlyphRenderer<Ellipse>
  ellipse(...args: unknown[]): TypedGlyphRenderer<Ellipse> {
    return this._glyph(Ellipse, "x,y,width,height", args)
  }

  harea(args: Partial<HAreaArgs>): TypedGlyphRenderer<HArea>
  harea(
    x1: HAreaArgs["x1"],
    x2: HAreaArgs["x2"],
    y: HAreaArgs["y"],
    args?: Partial<HAreaArgs>): TypedGlyphRenderer<HArea>
  harea(...args: unknown[]): TypedGlyphRenderer<HArea> {
    return this._glyph(HArea, "x1,x2,y", args)
  }

  hbar(args: Partial<HBarArgs>): TypedGlyphRenderer<HBar>
  hbar(
    y: HBarArgs["y"],
    height: HBarArgs["height"],
    right: HBarArgs["right"],
    left: HBarArgs["left"],
    args?: Partial<HBarArgs>): TypedGlyphRenderer<HBar>
  hbar(...args: unknown[]): TypedGlyphRenderer<HBar> {
    return this._glyph(HBar, "y,height,right,left", args)
  }

  hex_tile(args: Partial<HexTileArgs>): TypedGlyphRenderer<HexTile>
  hex_tile(
    q: HexTileArgs["q"],
    r: HexTileArgs["r"],
    args?: Partial<HexTileArgs>): TypedGlyphRenderer<HexTile>
  hex_tile(...args: unknown[]): TypedGlyphRenderer<HexTile> {
    return this._glyph(HexTile, "q,r", args)
  }

  image(args: Partial<ImageArgs>): TypedGlyphRenderer<Image>
  image(
    image: ImageArgs["image"],
    x: ImageArgs["x"],
    y: ImageArgs["y"],
    dw: ImageArgs["dw"],
    dh: ImageArgs["dh"],
    args?: Partial<ImageArgs>): TypedGlyphRenderer<Image>
  image(...args: unknown[]): TypedGlyphRenderer<Image> {
    return this._glyph(Image, "color_mapper,image,rows,cols,x,y,dw,dh", args)
  }

  image_rgba(args: Partial<ImageRGBAArgs>): TypedGlyphRenderer<ImageRGBA>
  image_rgba(
    image: ImageRGBAArgs["image"],
    x: ImageRGBAArgs["x"],
    y: ImageRGBAArgs["y"],
    dw: ImageRGBAArgs["dw"],
    dh: ImageRGBAArgs["dh"],
    args?: Partial<ImageRGBAArgs>): TypedGlyphRenderer<ImageRGBA>
  image_rgba(...args: unknown[]): TypedGlyphRenderer<ImageRGBA> {
    return this._glyph(ImageRGBA, "image,rows,cols,x,y,dw,dh", args)
  }

  image_url(args: Partial<ImageURLArgs>): TypedGlyphRenderer<ImageURL>
  image_url(
    url: ImageURLArgs["url"],
    x: ImageURLArgs["x"],
    y: ImageURLArgs["y"],
    w: ImageURLArgs["w"],
    h: ImageURLArgs["h"],
    args?: Partial<ImageURLArgs>): TypedGlyphRenderer<ImageURL>
  image_url(...args: unknown[]): TypedGlyphRenderer<ImageURL> {
    return this._glyph(ImageURL, "url,x,y,w,h", args)
  }

  line(args: Partial<LineArgs>): TypedGlyphRenderer<Line>
  line(
    x: LineArgs["x"],
    y: LineArgs["y"],
    args?: Partial<LineArgs>): TypedGlyphRenderer<Line>
  line(...args: unknown[]): TypedGlyphRenderer<Line> {
    return this._glyph(Line, "x,y", args)
  }

  multi_line(args: Partial<MultiLineArgs>): TypedGlyphRenderer<MultiLine>
  multi_line(
    xs: MultiLineArgs["xs"],
    ys: MultiLineArgs["ys"],
    args?: Partial<MultiLineArgs>): TypedGlyphRenderer<MultiLine>
  multi_line(...args: unknown[]): TypedGlyphRenderer<MultiLine> {
    return this._glyph(MultiLine, "xs,ys", args)
  }

  multi_polygons(args: Partial<MultiPolygonsArgs>): TypedGlyphRenderer<MultiPolygons>
  multi_polygons(
    xs: MultiPolygonsArgs["xs"],
    ys: MultiPolygonsArgs["ys"],
    args?: Partial<MultiPolygonsArgs>): TypedGlyphRenderer<MultiPolygons>
  multi_polygons(...args: unknown[]): TypedGlyphRenderer<MultiPolygons> {
    return this._glyph(MultiPolygons, "xs,ys", args)
  }

  oval(args: Partial<OvalArgs>): TypedGlyphRenderer<Oval>
  oval(
    x: OvalArgs["x"],
    y: OvalArgs["y"],
    width: OvalArgs["width"],
    height: OvalArgs["height"],
    args?: Partial<OvalArgs>): TypedGlyphRenderer<Oval>
  oval(...args: unknown[]): TypedGlyphRenderer<Oval> {
    return this._glyph(Oval, "x,y,width,height", args)
  }

  patch(args: Partial<PatchArgs>): TypedGlyphRenderer<Patch>
  patch(
    x: PatchArgs["x"],
    y: PatchArgs["y"],
    args?: Partial<PatchArgs>): TypedGlyphRenderer<Patch>
  patch(...args: unknown[]): TypedGlyphRenderer<Patch> {
    return this._glyph(Patch, "x,y", args)
  }

  patches(args: Partial<PatchesArgs>): TypedGlyphRenderer<Patches>
  patches(
    xs: PatchesArgs["xs"],
    ys: PatchesArgs["ys"],
    args?: Partial<PatchesArgs>): TypedGlyphRenderer<Patches>
  patches(...args: unknown[]): TypedGlyphRenderer<Patches> {
    return this._glyph(Patches, "xs,ys", args)
  }

  quad(args: Partial<QuadArgs>): TypedGlyphRenderer<Quad>
  quad(
    left: QuadArgs["left"],
    right: QuadArgs["right"],
    bottom: QuadArgs["bottom"],
    top: QuadArgs["top"],
    args?: Partial<QuadArgs>): TypedGlyphRenderer<Quad>
  quad(...args: unknown[]): TypedGlyphRenderer<Quad> {
    return this._glyph(Quad, "left,right,bottom,top", args)
  }

  quadratic(args: Partial<QuadraticArgs>): TypedGlyphRenderer<Quadratic>
  quadratic(
    x0: QuadraticArgs["x0"],
    y0: QuadraticArgs["y0"],
    x1: QuadraticArgs["x1"],
    y1: QuadraticArgs["y1"],
    cx: QuadraticArgs["cx"],
    cy: QuadraticArgs["cy"],
    args?: Partial<QuadraticArgs>): TypedGlyphRenderer<Quadratic>
  quadratic(...args: unknown[]): TypedGlyphRenderer<Quadratic> {
    return this._glyph(Quadratic, "x0,y0,x1,y1,cx,cy", args)
  }

  ray(args: Partial<RayArgs>): TypedGlyphRenderer<Ray>
  ray(
    x: RayArgs["x"],
    y: RayArgs["y"],
    length: RayArgs["length"],
    args?: Partial<RayArgs>): TypedGlyphRenderer<Ray>
  ray(...args: unknown[]): TypedGlyphRenderer<Ray> {
    return this._glyph(Ray, "x,y,length", args)
  }

  rect(args: Partial<RectArgs>): TypedGlyphRenderer<Rect>
  rect(
    x: RectArgs["x"],
    y: RectArgs["y"],
    width: RectArgs["width"],
    height: RectArgs["height"],
    args?: Partial<RectArgs>): TypedGlyphRenderer<Rect>
  rect(...args: unknown[]): TypedGlyphRenderer<Rect> {
    return this._glyph(Rect, "x,y,width,height", args)
  }

  segment(args: Partial<SegmentArgs>): TypedGlyphRenderer<Segment>
  segment(
    x0: SegmentArgs["x0"],
    y0: SegmentArgs["y0"],
    x1: SegmentArgs["x1"],
    y1: SegmentArgs["y1"],
    args?: Partial<SegmentArgs>): TypedGlyphRenderer<Segment>
  segment(...args: unknown[]): TypedGlyphRenderer<Segment> {
    return this._glyph(Segment, "x0,y0,x1,y1", args)
  }

  spline(args: Partial<SplineArgs>): TypedGlyphRenderer<Spline>
  spline(
    x: SplineArgs["x"],
    y: SplineArgs["y"],
    args?: Partial<SplineArgs>): TypedGlyphRenderer<Spline>
  spline(...args: unknown[]): TypedGlyphRenderer<Spline> {
    return this._glyph(Spline, "x,y", args)
  }

  step(args: Partial<StepArgs>): TypedGlyphRenderer<Step>
  step(
    x: StepArgs["x"],
    y: StepArgs["y"],
    mode: StepArgs["mode"],
    args?: Partial<StepArgs>): TypedGlyphRenderer<Step>
  step(...args: unknown[]): TypedGlyphRenderer<Step> {
    return this._glyph(Step, "x,y,mode", args)
  }

  text(args: Partial<TextArgs>): TypedGlyphRenderer<Text>
  text(
    x: TextArgs["x"],
    y: TextArgs["y"],
    text: TextArgs["text"],
    args?: Partial<TextArgs>): TypedGlyphRenderer<Text>
  text(...args: unknown[]): TypedGlyphRenderer<Text> {
    return this._glyph(Text, "x,y,text", args)
  }

  varea(args: Partial<VAreaArgs>): TypedGlyphRenderer<VArea>
  varea(
    x: VAreaArgs["x"],
    y1: VAreaArgs["y1"],
    y2: VAreaArgs["y2"],
    args?: Partial<VAreaArgs>): TypedGlyphRenderer<VArea>
  varea(...args: unknown[]): TypedGlyphRenderer<VArea> {
    return this._glyph(VArea, "x,y1,y2", args)
  }

  vbar(args: Partial<VBarArgs>): TypedGlyphRenderer<VBar>
  vbar(
    x: VBarArgs["x"],
    width: VBarArgs["width"],
    top: VBarArgs["top"],
    bottom: VBarArgs["bottom"],
    args?: Partial<VBarArgs>): TypedGlyphRenderer<VBar>
  vbar(...args: unknown[]): TypedGlyphRenderer<VBar> {
    return this._glyph(VBar, "x,width,top,bottom", args)
  }

  wedge(args: Partial<WedgeArgs>): TypedGlyphRenderer<Wedge>
  wedge(
    x: WedgeArgs["x"],
    y: WedgeArgs["y"],
    radius: WedgeArgs["radius"],
    start_angle: WedgeArgs["start_angle"],
    end_angle: WedgeArgs["end_angle"],
    args?: Partial<WedgeArgs>): TypedGlyphRenderer<Wedge>
  wedge(...args: unknown[]): TypedGlyphRenderer<Wedge> {
    return this._glyph(Wedge, "x,y,radius,start_angle,end_angle", args)
  }

  protected _scatter(args: unknown[], marker?: MarkerType): TypedGlyphRenderer<Scatter> {
    return this._glyph(Scatter, "x,y", args, marker != null ? {marker} : undefined)
  }

  scatter(args: Partial<ScatterArgs>): TypedGlyphRenderer<Scatter>
  scatter(x: MarkerArgs["x"], y: MarkerArgs["y"], args?: Partial<ScatterArgs>): TypedGlyphRenderer<Scatter>
  scatter(...args: unknown[]): TypedGlyphRenderer<Scatter> {
    return this._scatter(args)
  }

  asterisk(args: Partial<MarkerArgs>): TypedGlyphRenderer<Scatter>
  asterisk(x: MarkerArgs["x"], y: MarkerArgs["y"], args?: Partial<MarkerArgs>): TypedGlyphRenderer<Scatter>
  asterisk(...args: unknown[]): TypedGlyphRenderer<Scatter> {
    return this._scatter(args, "asterisk")
  }

  circle_cross(args: Partial<MarkerArgs>): TypedGlyphRenderer<Scatter>
  circle_cross(x: MarkerArgs["x"], y: MarkerArgs["y"], args?: Partial<MarkerArgs>): TypedGlyphRenderer<Scatter>
  circle_cross(...args: unknown[]): TypedGlyphRenderer<Scatter> {
    return this._scatter(args, "circle_cross")
  }

  circle_dot(args: Partial<MarkerArgs>): TypedGlyphRenderer<Scatter>
  circle_dot(x: MarkerArgs["x"], y: MarkerArgs["y"], args?: Partial<MarkerArgs>): TypedGlyphRenderer<Scatter>
  circle_dot(...args: unknown[]): TypedGlyphRenderer<Scatter> {
    return this._scatter(args, "circle_dot")
  }

  circle_x(args: Partial<MarkerArgs>): TypedGlyphRenderer<Scatter>
  circle_x(x: MarkerArgs["x"], y: MarkerArgs["y"], args?: Partial<MarkerArgs>): TypedGlyphRenderer<Scatter>
  circle_x(...args: unknown[]): TypedGlyphRenderer<Scatter> {
    return this._scatter(args, "circle_x")
  }

  circle_y(args: Partial<MarkerArgs>): TypedGlyphRenderer<Scatter>
  circle_y(x: MarkerArgs["x"], y: MarkerArgs["y"], args?: Partial<MarkerArgs>): TypedGlyphRenderer<Scatter>
  circle_y(...args: unknown[]): TypedGlyphRenderer<Scatter> {
    return this._scatter(args, "circle_y")
  }

  cross(args: Partial<MarkerArgs>): TypedGlyphRenderer<Scatter>
  cross(x: MarkerArgs["x"], y: MarkerArgs["y"], args?: Partial<MarkerArgs>): TypedGlyphRenderer<Scatter>
  cross(...args: unknown[]): TypedGlyphRenderer<Scatter> {
    return this._scatter(args, "cross")
  }

  dash(args: Partial<MarkerArgs>): TypedGlyphRenderer<Scatter>
  dash(x: MarkerArgs["x"], y: MarkerArgs["y"], args?: Partial<MarkerArgs>): TypedGlyphRenderer<Scatter>
  dash(...args: unknown[]): TypedGlyphRenderer<Scatter> {
    return this._scatter(args, "dash")
  }

  diamond(args: Partial<MarkerArgs>): TypedGlyphRenderer<Scatter>
  diamond(x: MarkerArgs["x"], y: MarkerArgs["y"], args?: Partial<MarkerArgs>): TypedGlyphRenderer<Scatter>
  diamond(...args: unknown[]): TypedGlyphRenderer<Scatter> {
    return this._scatter(args, "diamond")
  }

  diamond_cross(args: Partial<MarkerArgs>): TypedGlyphRenderer<Scatter>
  diamond_cross(x: MarkerArgs["x"], y: MarkerArgs["y"], args?: Partial<MarkerArgs>): TypedGlyphRenderer<Scatter>
  diamond_cross(...args: unknown[]): TypedGlyphRenderer<Scatter> {
    return this._scatter(args, "diamond_cross")
  }

  diamond_dot(args: Partial<MarkerArgs>): TypedGlyphRenderer<Scatter>
  diamond_dot(x: MarkerArgs["x"], y: MarkerArgs["y"], args?: Partial<MarkerArgs>): TypedGlyphRenderer<Scatter>
  diamond_dot(...args: unknown[]): TypedGlyphRenderer<Scatter> {
    return this._scatter(args, "diamond_dot")
  }

  dot(args: Partial<MarkerArgs>): TypedGlyphRenderer<Scatter>
  dot(x: MarkerArgs["x"], y: MarkerArgs["y"], args?: Partial<MarkerArgs>): TypedGlyphRenderer<Scatter>
  dot(...args: unknown[]): TypedGlyphRenderer<Scatter> {
    return this._scatter(args, "dot")
  }

  hex(args: Partial<MarkerArgs>): TypedGlyphRenderer<Scatter>
  hex(x: MarkerArgs["x"], y: MarkerArgs["y"], args?: Partial<MarkerArgs>): TypedGlyphRenderer<Scatter>
  hex(...args: unknown[]): TypedGlyphRenderer<Scatter> {
    return this._scatter(args, "hex")
  }

  hex_dot(args: Partial<MarkerArgs>): TypedGlyphRenderer<Scatter>
  hex_dot(x: MarkerArgs["x"], y: MarkerArgs["y"], args?: Partial<MarkerArgs>): TypedGlyphRenderer<Scatter>
  hex_dot(...args: unknown[]): TypedGlyphRenderer<Scatter> {
    return this._scatter(args, "hex_dot")
  }

  inverted_triangle(args: Partial<MarkerArgs>): TypedGlyphRenderer<Scatter>
  inverted_triangle(x: MarkerArgs["x"], y: MarkerArgs["y"], args?: Partial<MarkerArgs>): TypedGlyphRenderer<Scatter>
  inverted_triangle(...args: unknown[]): TypedGlyphRenderer<Scatter> {
    return this._scatter(args, "inverted_triangle")
  }

  plus(args: Partial<MarkerArgs>): TypedGlyphRenderer<Scatter>
  plus(x: MarkerArgs["x"], y: MarkerArgs["y"], args?: Partial<MarkerArgs>): TypedGlyphRenderer<Scatter>
  plus(...args: unknown[]): TypedGlyphRenderer<Scatter> {
    return this._scatter(args, "plus")
  }

  square(args: Partial<MarkerArgs>): TypedGlyphRenderer<Scatter>
  square(x: MarkerArgs["x"], y: MarkerArgs["y"], args?: Partial<MarkerArgs>): TypedGlyphRenderer<Scatter>
  square(...args: unknown[]): TypedGlyphRenderer<Scatter> {
    return this._scatter(args, "square")
  }

  square_cross(args: Partial<MarkerArgs>): TypedGlyphRenderer<Scatter>
  square_cross(x: MarkerArgs["x"], y: MarkerArgs["y"], args?: Partial<MarkerArgs>): TypedGlyphRenderer<Scatter>
  square_cross(...args: unknown[]): TypedGlyphRenderer<Scatter> {
    return this._scatter(args, "square_cross")
  }

  square_dot(args: Partial<MarkerArgs>): TypedGlyphRenderer<Scatter>
  square_dot(x: MarkerArgs["x"], y: MarkerArgs["y"], args?: Partial<MarkerArgs>): TypedGlyphRenderer<Scatter>
  square_dot(...args: unknown[]): TypedGlyphRenderer<Scatter> {
    return this._scatter(args, "square_dot")
  }

  square_pin(args: Partial<MarkerArgs>): TypedGlyphRenderer<Scatter>
  square_pin(x: MarkerArgs["x"], y: MarkerArgs["y"], args?: Partial<MarkerArgs>): TypedGlyphRenderer<Scatter>
  square_pin(...args: unknown[]): TypedGlyphRenderer<Scatter> {
    return this._scatter(args, "square_pin")
  }

  square_x(args: Partial<MarkerArgs>): TypedGlyphRenderer<Scatter>
  square_x(x: MarkerArgs["x"], y: MarkerArgs["y"], args?: Partial<MarkerArgs>): TypedGlyphRenderer<Scatter>
  square_x(...args: unknown[]): TypedGlyphRenderer<Scatter> {
    return this._scatter(args, "square_x")
  }

  star(args: Partial<MarkerArgs>): TypedGlyphRenderer<Scatter>
  star(x: MarkerArgs["x"], y: MarkerArgs["y"], args?: Partial<MarkerArgs>): TypedGlyphRenderer<Scatter>
  star(...args: unknown[]): TypedGlyphRenderer<Scatter> {
    return this._scatter(args, "star")
  }

  star_dot(args: Partial<MarkerArgs>): TypedGlyphRenderer<Scatter>
  star_dot(x: MarkerArgs["x"], y: MarkerArgs["y"], args?: Partial<MarkerArgs>): TypedGlyphRenderer<Scatter>
  star_dot(...args: unknown[]): TypedGlyphRenderer<Scatter> {
    return this._scatter(args, "star_dot")
  }

  triangle(args: Partial<MarkerArgs>): TypedGlyphRenderer<Scatter>
  triangle(x: MarkerArgs["x"], y: MarkerArgs["y"], args?: Partial<MarkerArgs>): TypedGlyphRenderer<Scatter>
  triangle(...args: unknown[]): TypedGlyphRenderer<Scatter> {
    return this._scatter(args, "triangle")
  }

  triangle_dot(args: Partial<MarkerArgs>): TypedGlyphRenderer<Scatter>
  triangle_dot(x: MarkerArgs["x"], y: MarkerArgs["y"], args?: Partial<MarkerArgs>): TypedGlyphRenderer<Scatter>
  triangle_dot(...args: unknown[]): TypedGlyphRenderer<Scatter> {
    return this._scatter(args, "triangle_dot")
  }

  triangle_pin(args: Partial<MarkerArgs>): TypedGlyphRenderer<Scatter>
  triangle_pin(x: MarkerArgs["x"], y: MarkerArgs["y"], args?: Partial<MarkerArgs>): TypedGlyphRenderer<Scatter>
  triangle_pin(...args: unknown[]): TypedGlyphRenderer<Scatter> {
    return this._scatter(args, "triangle_pin")
  }

  x(args: Partial<MarkerArgs>): TypedGlyphRenderer<Scatter>
  x(x: MarkerArgs["x"], y: MarkerArgs["y"], args?: Partial<MarkerArgs>): TypedGlyphRenderer<Scatter>
  x(...args: unknown[]): TypedGlyphRenderer<Scatter> {
    return this._scatter(args, "x")
  }

  y(args: Partial<MarkerArgs>): TypedGlyphRenderer<Scatter>
  y(x: MarkerArgs["x"], y: MarkerArgs["y"], args?: Partial<MarkerArgs>): TypedGlyphRenderer<Scatter>
  y(...args: unknown[]): TypedGlyphRenderer<Scatter> {
    return this._scatter(args, "y")
  }

  _pop_visuals(cls: Class<HasProps>, props: Attrs, prefix: string = "",
      defaults: Attrs = {}, override_defaults: Attrs = {}): Attrs {

    const _split_feature_trait = function(ft: string): string[] {
      const fta: string[] = ft.split('_', 2)
      return fta.length == 2 ? fta : fta.concat([''])
    }
    const _is_visual = function(ft: string): boolean {
      const [feature, trait] = _split_feature_trait(ft)
      return includes(['line', 'fill', 'hatch', 'text', 'global'], feature) && trait !== ""
    }

    defaults = {...defaults}
    if (!hasOwnProperty.call(defaults, 'text_color')) {
      defaults.text_color = 'black'
    }
    if (!hasOwnProperty.call(defaults, 'hatch_color')) {
      defaults.hatch_color = 'black'
    }
    const trait_defaults: Attrs = {}
    if (!hasOwnProperty.call(trait_defaults, 'color')) {
      trait_defaults.color = _default_color
    }
    if (!hasOwnProperty.call(trait_defaults, 'alpha')) {
      trait_defaults.alpha = _default_alpha
    }

    const result: Attrs = {}
    const traits = new Set()
    for (const pname of keys(cls.prototype._props)) {
      if (_is_visual(pname)) {
        const trait = _split_feature_trait(pname)[1]
        if (hasOwnProperty.call(props, prefix + pname)) {
          result[pname] = props[prefix + pname]
          delete props[prefix + pname]
        } else if (!hasOwnProperty.call(cls.prototype._props, trait) && hasOwnProperty.call(props, prefix + trait)) {
          result[pname] = props[prefix + trait]
        } else if (hasOwnProperty.call(override_defaults, trait)) {
          result[pname] = override_defaults[trait]
        } else if (hasOwnProperty.call(defaults, pname)) {
          result[pname] = defaults[pname]
        } else if (hasOwnProperty.call(trait_defaults, trait)) {
          result[pname] = trait_defaults[trait]
        }
        if (!hasOwnProperty.call(cls.prototype._props, trait)) {
          traits.add(trait)
        }
      }
    }

    for (const name of traits) {
      delete props[prefix + name]
    }

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
            if (isArray(value) || nd.is_NDArray(value)) {
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

              attrs[name] = {field}
            } else if (isNumber(value) || isString(value)) { // or Date?
              attrs[name] = {value}
            }
          }
        }
      }
    }
  }

  _glyph<G extends Glyph>(cls: Class<G>, params_string: string, args: unknown[], overrides?: object): TypedGlyphRenderer<G> {
    const params = params_string.split(",")

    let attrs: Attrs & Partial<AuxGlyph>
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

    if (overrides != null) {
      attrs = {...attrs, ...overrides}
    }

    const source = (() => {
      const {source} = attrs
      if (source == null)
        return new ColumnDataSource()
      else if (source instanceof ColumnarDataSource)
        return source
      else
        return new ColumnDataSource({data: source})
    })()
    const data = clone(source.data)
    delete attrs.source

    const view = attrs.view != null ? attrs.view : new CDSView({source})
    delete attrs.view

    const legend = this._process_legend(attrs.legend, source)
    delete attrs.legend

    const name = attrs.name
    delete attrs.name

    const level = attrs.level
    delete attrs.level

    const visible = attrs.visible
    delete attrs.visible

    const x_range_name = attrs.x_range_name
    delete attrs.x_range_name

    const y_range_name = attrs.y_range_name
    delete attrs.y_range_name

    const glyph_ca  = this._pop_visuals(cls, attrs)
    const nglyph_ca = this._pop_visuals(cls, attrs, "nonselection_", glyph_ca, {alpha: 0.1})
    const sglyph_ca = this._pop_visuals(cls, attrs, "selection_", glyph_ca)
    const hglyph_ca = this._pop_visuals(cls, attrs, "hover_", glyph_ca)
    const mglyph_ca = this._pop_visuals(cls, attrs, "muted_", glyph_ca)

    this._fixup_values(cls, data,  glyph_ca)
    this._fixup_values(cls, data, nglyph_ca)
    this._fixup_values(cls, data, sglyph_ca)
    this._fixup_values(cls, data, hglyph_ca)
    this._fixup_values(cls, data, mglyph_ca)

    this._fixup_values(cls, data, attrs)

    source.data = data

    const _make_glyph = (cls: Class<Glyph>, attrs: Attrs, extra_attrs: Attrs) => {
      return new cls({...attrs, ...extra_attrs})
    }

    const glyph  = _make_glyph(cls, attrs, glyph_ca)
    const nglyph = !is_empty(nglyph_ca) ? _make_glyph(cls, attrs, nglyph_ca) : "auto"
    const sglyph = !is_empty(sglyph_ca) ? _make_glyph(cls, attrs, sglyph_ca) : "auto"
    const hglyph = !is_empty(hglyph_ca) ? _make_glyph(cls, attrs, hglyph_ca) : undefined
    const mglyph = !is_empty(mglyph_ca) ? _make_glyph(cls, attrs, mglyph_ca) : undefined

    const glyph_renderer = new GlyphRenderer({
      data_source:        source,
      view,
      glyph,
      nonselection_glyph: nglyph,
      selection_glyph:    sglyph,
      hover_glyph:        hglyph,
      muted_glyph:        mglyph,
      name,
      level,
      visible,
      x_range_name,
      y_range_name,
    })

    if (legend != null) {
      this._update_legend(legend, glyph_renderer)
    }

    this.add_renderers(glyph_renderer)
    return glyph_renderer as TypedGlyphRenderer<G>
  }

  static _get_range(range?: Range | [number, number] | string[]): Range {
    if (range == null) {
      return new DataRange1d()
    }
    if (range instanceof Range) {
      return range
    }
    if (isArray(range)) {
      if (isArrayOf(range, isString)) {
        const factors = range
        return new FactorRange({factors})
      } else {
        const [start, end] = range
        return new Range1d({start, end})
      }
    }
    throw new Error(`unable to determine proper range for: '${range}'`)
  }

  static _get_scale(range_input: Range, axis_type: AxisType): Scale {
    if (range_input instanceof DataRange1d ||
        range_input instanceof Range1d) {
      switch (axis_type) {
        case null:
        case "auto":
        case "linear":
        case "datetime":
        case "mercator":
          return new LinearScale()
        case "log":
          return new LogScale()
      }
    }

    if (range_input instanceof FactorRange) {
      return new CategoricalScale()
    }

    throw new Error(`unable to determine proper scale for: '${range_input}'`)
  }

  _process_axis_and_grid(axis_type: AxisType, axis_location: Location,
                         minor_ticks: number | "auto" | undefined, axis_label: string, rng: Range, dim: 0 | 1): void {
    const axis = this._get_axis(axis_type, rng, dim)
    if (axis != null) {
      if (axis instanceof LogAxis) {
        if (dim == 0) {
          this.x_scale = new LogScale()
        } else {
          this.y_scale = new LogScale()
        }
      }

      if (axis.ticker instanceof ContinuousTicker) {
        axis.ticker.num_minor_ticks = this._get_num_minor_ticks(axis, minor_ticks)
      }
      if (axis_label.length !== 0) {
        axis.axis_label = axis_label
      }

      const grid = new Grid({dimension: dim, ticker: axis.ticker})

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
        return new LinearAxis()
      case "log":
        return new LogAxis()
      case "datetime":
        return new DatetimeAxis()
      case "mercator": {
        const axis = new MercatorAxis()
        const dimension = dim == 0 ? "lon" : "lat"
        axis.ticker.dimension = dimension
        axis.formatter.dimension = dimension
        return axis
      }
      case "auto":
        if (range instanceof FactorRange)
          return new CategoricalAxis()
        else
          return new LinearAxis() // TODO: return DatetimeAxis (Date type)
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
      return axis instanceof LogAxis ? 10 : 5
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
        legend_item_label = {value: legend}
        if (source.columns() != null) {
          if (includes(source.columns(), legend)) {
            legend_item_label = {field: legend}
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
      if (item.label != null && is_equal(item.label, legend_item_label)) {
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
      const new_item = new LegendItem({label: legend_item_label, renderers: [glyph_renderer]})
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

export async function show<T extends LayoutDOM>(obj: T | T[], target?: HTMLElement | string): Promise<ViewOf<T> | ViewOf<T>[]> {
  const doc = new Document()

  for (const item of isArray(obj) ? obj : [obj])
    doc.add_root(item)

  await dom_ready()

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

  const views = await embed.add_document_standalone(doc, element) as ViewOf<T>[]

  return new Promise((resolve, _reject) => {
    const result = isArray(obj) ? views : views[0]
    if (doc.is_idle)
      resolve(result)
    else
      doc.idle.connect(() => resolve(result))
  })
}
