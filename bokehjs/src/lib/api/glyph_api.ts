import {HasProps} from "../core/has_props"
import {Color, Arrayable} from "../core/types"
import {Class} from "../core/class"
import {Vector} from "../core/vectorization"
import {VectorSpec, ScalarSpec, ColorSpec, UnitsSpec, Property} from "../core/properties"
import {MarkerType, RenderLevel} from "../core/enums"
import * as nd from "core/util/ndarray"

import {Glyph, GlyphRenderer, ColumnarDataSource, CDSView, CoordinateMapping} from "./models"

import {
  AnnularWedge, Annulus, Arc, Bezier, Block, Circle, Ellipse, HArea, HAreaStep, HBand, HBar,
  HSpan, HexTile, Image, ImageRGBA, ImageStack, ImageURL, Line, MultiLine, MultiPolygons,
  Patch, Patches, Quad, Quadratic, Ray, Rect, Scatter, Segment, Spline, Step, Text, VArea,
  VAreaStep, VBand, VBar, VSpan, Wedge,
} from "../models/glyphs"

import {Marker} from "../models/glyphs/marker"

export type NamesOf<T extends HasProps> = (keyof T["properties"])[]

export type TypedGlyphRenderer<G extends Glyph> = GlyphRenderer & {glyph: G}

export type ColorNDArray = nd.Uint32Array1d | nd.Uint8Array1d | nd.Uint8Array2d | nd.FloatArray2d | nd.ObjectNDArray
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

export type AuxHatch = {
  selection_hatch_color: ColorArg
  selection_hatch_alpha: AlphaArg
  nonselection_hatch_color: ColorArg
  nonselection_hatch_alpha: AlphaArg
  hover_hatch_color: ColorArg
  hover_hatch_alpha: AlphaArg
  muted_hatch_color: ColorArg
  muted_hatch_alpha: AlphaArg
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
  legend_label: string
  legend_field: string
  legend_group: string
  level: RenderLevel
  name: string
  visible: boolean
  x_range_name: string
  y_range_name: string
  coordinates: CoordinateMapping | null
}

export type ArgsOf<P> = { [K in keyof P]:
  (P[K] extends ColorSpec                     ? ColorArg             :
  (P[K] extends VectorSpec<infer T, infer V>  ? T | Arrayable<T> | V :
  (P[K] extends ScalarSpec<infer T, infer S>  ? T |                S :
  (P[K] extends Property  <infer T>           ? T                    : never))))
}

export type UnitsOf<P> = {
  [K in keyof P & string as `${K}_units`]: P[K] extends UnitsSpec<any, infer Units> ? Units : never
}

export type GlyphArgs<P> = ArgsOf<P> & UnitsOf<P> & AuxGlyph & ColorAlpha

export type AnnularWedgeArgs  = GlyphArgs<AnnularWedge.Props>  & AuxLine & AuxFill & AuxHatch
export type AnnulusArgs       = GlyphArgs<Annulus.Props>       & AuxLine & AuxFill & AuxHatch
export type ArcArgs           = GlyphArgs<Arc.Props>           & AuxLine
export type BezierArgs        = GlyphArgs<Bezier.Props>        & AuxLine
export type BlockArgs         = GlyphArgs<Block.Props>         & AuxLine & AuxFill & AuxHatch
export type CircleArgs        = GlyphArgs<Circle.Props>        & AuxLine & AuxFill & AuxHatch
export type EllipseArgs       = GlyphArgs<Ellipse.Props>       & AuxLine & AuxFill & AuxHatch
export type HAreaArgs         = GlyphArgs<HArea.Props>                   & AuxFill & AuxHatch
export type HAreaStepArgs     = GlyphArgs<HAreaStep.Props>               & AuxFill & AuxHatch
export type HBandArgs         = GlyphArgs<HBand.Props>         & AuxLine & AuxFill & AuxHatch
export type HBarArgs          = GlyphArgs<HBar.Props>          & AuxLine & AuxFill & AuxHatch
export type HSpanArgs         = GlyphArgs<HSpan.Props>         & AuxLine
export type HexTileArgs       = GlyphArgs<HexTile.Props>       & AuxLine & AuxFill & AuxHatch
export type ImageArgs         = GlyphArgs<Image.Props>
export type ImageRGBAArgs     = GlyphArgs<ImageRGBA.Props>
export type ImageStackArgs    = GlyphArgs<ImageStack.Props>
export type ImageURLArgs      = GlyphArgs<ImageURL.Props>
export type LineArgs          = GlyphArgs<Line.Props>          & AuxLine
export type MarkerArgs        = GlyphArgs<Marker.Props>        & AuxLine & AuxFill & AuxHatch
export type MultiLineArgs     = GlyphArgs<MultiLine.Props>     & AuxLine
export type MultiPolygonsArgs = GlyphArgs<MultiPolygons.Props> & AuxLine & AuxFill & AuxHatch
export type PatchArgs         = GlyphArgs<Patch.Props>         & AuxLine & AuxFill & AuxHatch
export type PatchesArgs       = GlyphArgs<Patches.Props>       & AuxLine & AuxFill & AuxHatch
export type QuadArgs          = GlyphArgs<Quad.Props>          & AuxLine & AuxFill & AuxHatch
export type QuadraticArgs     = GlyphArgs<Quadratic.Props>     & AuxLine
export type RayArgs           = GlyphArgs<Ray.Props>           & AuxLine
export type RectArgs          = GlyphArgs<Rect.Props>          & AuxLine & AuxFill & AuxHatch
export type ScatterArgs       = GlyphArgs<Scatter.Props>       & AuxLine & AuxFill & AuxHatch
export type SegmentArgs       = GlyphArgs<Segment.Props>       & AuxLine
export type SplineArgs        = GlyphArgs<Spline.Props>        & AuxLine
export type StepArgs          = GlyphArgs<Step.Props>          & AuxLine
export type TextArgs          = GlyphArgs<Text.Props>                                          & AuxText
export type VAreaArgs         = GlyphArgs<VArea.Props>                   & AuxFill & AuxHatch
export type VAreaStepArgs     = GlyphArgs<VAreaStep.Props>               & AuxFill & AuxHatch
export type VBandArgs         = GlyphArgs<VBand.Props>         & AuxLine & AuxFill & AuxHatch
export type VBarArgs          = GlyphArgs<VBar.Props>          & AuxLine & AuxFill & AuxHatch
export type VSpanArgs         = GlyphArgs<VSpan.Props>         & AuxLine
export type WedgeArgs         = GlyphArgs<Wedge.Props>         & AuxLine & AuxFill & AuxHatch

export abstract class GlyphAPI {
  abstract _glyph<G extends Glyph>(cls: Class<G>, positional: NamesOf<G>, args: unknown[], overrides?: object): TypedGlyphRenderer<G>

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
    return this._glyph(AnnularWedge, ["x", "y", "inner_radius", "outer_radius", "start_angle", "end_angle"], args)
  }

  annulus(args: Partial<AnnulusArgs>): TypedGlyphRenderer<Annulus>
  annulus(
    x: AnnulusArgs["x"],
    y: AnnulusArgs["y"],
    inner_radius: AnnulusArgs["inner_radius"],
    outer_radius: AnnulusArgs["outer_radius"],
    args?: Partial<AnnulusArgs>): TypedGlyphRenderer<Annulus>
  annulus(...args: unknown[]): TypedGlyphRenderer<Annulus> {
    return this._glyph(Annulus, ["x", "y", "inner_radius", "outer_radius"], args)
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
    return this._glyph(Arc, ["x", "y", "radius", "start_angle", "end_angle"], args)
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
    return this._glyph(Bezier, ["x0", "y0", "x1", "y1", "cx0", "cy0", "cx1", "cy1"], args)
  }

  block(args: Partial<BlockArgs>): TypedGlyphRenderer<Block>
  block(
    x: BlockArgs["x"],
    y: BlockArgs["y"],
    width: BlockArgs["width"],
    height: BlockArgs["height"],
    args?: Partial<BlockArgs>): TypedGlyphRenderer<Block>
  block(...args: unknown[]): TypedGlyphRenderer<Block> {
    return this._glyph(Block, ["x", "y", "width", "height"], args)
  }
  circle(args: Partial<CircleArgs>): TypedGlyphRenderer<Circle>
  circle(
    x: CircleArgs["x"],
    y: CircleArgs["y"],
    args?: Partial<CircleArgs>): TypedGlyphRenderer<Circle>
  circle(...args: unknown[]): TypedGlyphRenderer<Circle>
  circle(...args: unknown[]): TypedGlyphRenderer<Circle> {
    return this._glyph(Circle, ["x", "y"], args)
  }

  ellipse(args: Partial<EllipseArgs>): TypedGlyphRenderer<Ellipse>
  ellipse(
    x: EllipseArgs["x"],
    y: EllipseArgs["y"],
    width: EllipseArgs["width"],
    height: EllipseArgs["height"],
    args?: Partial<EllipseArgs>): TypedGlyphRenderer<Ellipse>
  ellipse(...args: unknown[]): TypedGlyphRenderer<Ellipse> {
    return this._glyph(Ellipse, ["x", "y", "width", "height"], args)
  }

  harea(args: Partial<HAreaArgs>): TypedGlyphRenderer<HArea>
  harea(
    x1: HAreaArgs["x1"],
    x2: HAreaArgs["x2"],
    y: HAreaArgs["y"],
    args?: Partial<HAreaArgs>): TypedGlyphRenderer<HArea>
  harea(...args: unknown[]): TypedGlyphRenderer<HArea> {
    return this._glyph(HArea, ["x1", "x2", "y"], args)
  }

  harea_step(args: Partial<HAreaStepArgs>): TypedGlyphRenderer<HAreaStep>
  harea_step(
    x1: HAreaStepArgs["x1"],
    x2: HAreaStepArgs["x2"],
    y: HAreaStepArgs["y"],
    step_mode: HAreaStepArgs["step_mode"],
    args?: Partial<HAreaStepArgs>): TypedGlyphRenderer<HAreaStep>
  harea_step(...args: unknown[]): TypedGlyphRenderer<HAreaStep> {
    return this._glyph(HAreaStep, ["x1", "x2", "y", "step_mode"], args)
  }

  hband(args: Partial<HBandArgs>): TypedGlyphRenderer<HBand>
  hband(
    top: HBandArgs["top"],
    bottom: HBandArgs["bottom"],
    args?: Partial<HBandArgs>): TypedGlyphRenderer<HBand>
  hband(...args: unknown[]): TypedGlyphRenderer<HBand> {
    return this._glyph(HBand, ["top", "bottom"], args)
  }

  hbar(args: Partial<HBarArgs>): TypedGlyphRenderer<HBar>
  hbar(
    y: HBarArgs["y"],
    height: HBarArgs["height"],
    right: HBarArgs["right"],
    left: HBarArgs["left"],
    args?: Partial<HBarArgs>): TypedGlyphRenderer<HBar>
  hbar(...args: unknown[]): TypedGlyphRenderer<HBar> {
    return this._glyph(HBar, ["y", "height", "right", "left"], args)
  }

  hspan(args: Partial<HSpanArgs>): TypedGlyphRenderer<HSpan>
  hspan(
    y: HSpanArgs["y"],
    args?: Partial<HSpanArgs>): TypedGlyphRenderer<HSpan>
  hspan(...args: unknown[]): TypedGlyphRenderer<HSpan> {
    return this._glyph(HSpan, ["y"], args)
  }

  hex_tile(args: Partial<HexTileArgs>): TypedGlyphRenderer<HexTile>
  hex_tile(
    q: HexTileArgs["q"],
    r: HexTileArgs["r"],
    args?: Partial<HexTileArgs>): TypedGlyphRenderer<HexTile>
  hex_tile(...args: unknown[]): TypedGlyphRenderer<HexTile> {
    return this._glyph(HexTile, ["q", "r"], args)
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
    return this._glyph(Image, ["color_mapper", "image", "x", "y", "dw", "dh"], args)
  }

  image_stack(args: Partial<ImageStackArgs>): TypedGlyphRenderer<ImageStack>
  image_stack(
    image: ImageStackArgs["image"],
    x: ImageStackArgs["x"],
    y: ImageStackArgs["y"],
    dw: ImageStackArgs["dw"],
    dh: ImageStackArgs["dh"],
    args?: Partial<ImageStackArgs>): TypedGlyphRenderer<ImageStack>
  image_stack(...args: unknown[]): TypedGlyphRenderer<ImageStack> {
    return this._glyph(ImageStack, ["color_mapper", "image", "x", "y", "dw", "dh"], args)
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
    return this._glyph(ImageRGBA, ["image", "x", "y", "dw", "dh"], args)
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
    return this._glyph(ImageURL, ["url", "x", "y", "w", "h"], args)
  }

  line(args: Partial<LineArgs>): TypedGlyphRenderer<Line>
  line(
    x: LineArgs["x"],
    y: LineArgs["y"],
    args?: Partial<LineArgs>): TypedGlyphRenderer<Line>
  line(...args: unknown[]): TypedGlyphRenderer<Line> {
    return this._glyph(Line, ["x", "y"], args)
  }

  multi_line(args: Partial<MultiLineArgs>): TypedGlyphRenderer<MultiLine>
  multi_line(
    xs: MultiLineArgs["xs"],
    ys: MultiLineArgs["ys"],
    args?: Partial<MultiLineArgs>): TypedGlyphRenderer<MultiLine>
  multi_line(...args: unknown[]): TypedGlyphRenderer<MultiLine> {
    return this._glyph(MultiLine, ["xs", "ys"], args)
  }

  multi_polygons(args: Partial<MultiPolygonsArgs>): TypedGlyphRenderer<MultiPolygons>
  multi_polygons(
    xs: MultiPolygonsArgs["xs"],
    ys: MultiPolygonsArgs["ys"],
    args?: Partial<MultiPolygonsArgs>): TypedGlyphRenderer<MultiPolygons>
  multi_polygons(...args: unknown[]): TypedGlyphRenderer<MultiPolygons> {
    return this._glyph(MultiPolygons, ["xs", "ys"], args)
  }

  patch(args: Partial<PatchArgs>): TypedGlyphRenderer<Patch>
  patch(
    x: PatchArgs["x"],
    y: PatchArgs["y"],
    args?: Partial<PatchArgs>): TypedGlyphRenderer<Patch>
  patch(...args: unknown[]): TypedGlyphRenderer<Patch> {
    return this._glyph(Patch, ["x", "y"], args)
  }

  patches(args: Partial<PatchesArgs>): TypedGlyphRenderer<Patches>
  patches(
    xs: PatchesArgs["xs"],
    ys: PatchesArgs["ys"],
    args?: Partial<PatchesArgs>): TypedGlyphRenderer<Patches>
  patches(...args: unknown[]): TypedGlyphRenderer<Patches> {
    return this._glyph(Patches, ["xs", "ys"], args)
  }

  quad(args: Partial<QuadArgs>): TypedGlyphRenderer<Quad>
  quad(
    left: QuadArgs["left"],
    right: QuadArgs["right"],
    bottom: QuadArgs["bottom"],
    top: QuadArgs["top"],
    args?: Partial<QuadArgs>): TypedGlyphRenderer<Quad>
  quad(...args: unknown[]): TypedGlyphRenderer<Quad> {
    return this._glyph(Quad, ["left", "right", "bottom", "top"], args)
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
    return this._glyph(Quadratic, ["x0", "y0", "x1", "y1", "cx", "cy"], args)
  }

  ray(args: Partial<RayArgs>): TypedGlyphRenderer<Ray>
  ray(
    x: RayArgs["x"],
    y: RayArgs["y"],
    length: RayArgs["length"],
    args?: Partial<RayArgs>): TypedGlyphRenderer<Ray>
  ray(...args: unknown[]): TypedGlyphRenderer<Ray> {
    return this._glyph(Ray, ["x", "y", "length"], args)
  }

  rect(args: Partial<RectArgs>): TypedGlyphRenderer<Rect>
  rect(
    x: RectArgs["x"],
    y: RectArgs["y"],
    width: RectArgs["width"],
    height: RectArgs["height"],
    args?: Partial<RectArgs>): TypedGlyphRenderer<Rect>
  rect(...args: unknown[]): TypedGlyphRenderer<Rect> {
    return this._glyph(Rect, ["x", "y", "width", "height"], args)
  }

  segment(args: Partial<SegmentArgs>): TypedGlyphRenderer<Segment>
  segment(
    x0: SegmentArgs["x0"],
    y0: SegmentArgs["y0"],
    x1: SegmentArgs["x1"],
    y1: SegmentArgs["y1"],
    args?: Partial<SegmentArgs>): TypedGlyphRenderer<Segment>
  segment(...args: unknown[]): TypedGlyphRenderer<Segment> {
    return this._glyph(Segment, ["x0", "y0", "x1", "y1"], args)
  }

  spline(args: Partial<SplineArgs>): TypedGlyphRenderer<Spline>
  spline(
    x: SplineArgs["x"],
    y: SplineArgs["y"],
    args?: Partial<SplineArgs>): TypedGlyphRenderer<Spline>
  spline(...args: unknown[]): TypedGlyphRenderer<Spline> {
    return this._glyph(Spline, ["x", "y"], args)
  }

  step(args: Partial<StepArgs>): TypedGlyphRenderer<Step>
  step(
    x: StepArgs["x"],
    y: StepArgs["y"],
    mode: StepArgs["mode"],
    args?: Partial<StepArgs>): TypedGlyphRenderer<Step>
  step(...args: unknown[]): TypedGlyphRenderer<Step> {
    return this._glyph(Step, ["x", "y", "mode"], args)
  }

  text(args: Partial<TextArgs>): TypedGlyphRenderer<Text>
  text(
    x: TextArgs["x"],
    y: TextArgs["y"],
    text: TextArgs["text"],
    args?: Partial<TextArgs>): TypedGlyphRenderer<Text>
  text(...args: unknown[]): TypedGlyphRenderer<Text> {
    return this._glyph(Text, ["x", "y", "text"], args)
  }

  varea(args: Partial<VAreaArgs>): TypedGlyphRenderer<VArea>
  varea(
    x: VAreaArgs["x"],
    y1: VAreaArgs["y1"],
    y2: VAreaArgs["y2"],
    args?: Partial<VAreaArgs>): TypedGlyphRenderer<VArea>
  varea(...args: unknown[]): TypedGlyphRenderer<VArea> {
    return this._glyph(VArea, ["x", "y1", "y2"], args)
  }

  varea_step(args: Partial<VAreaStepArgs>): TypedGlyphRenderer<VAreaStep>
  varea_step(
    x: VAreaStepArgs["x"],
    y1: VAreaStepArgs["y1"],
    y2: VAreaStepArgs["y2"],
    step_mode: VAreaStepArgs["step_mode"],
    args?: Partial<VAreaStepArgs>): TypedGlyphRenderer<VAreaStep>
  varea_step(...args: unknown[]): TypedGlyphRenderer<VAreaStep> {
    return this._glyph(VAreaStep, ["x", "y1", "y2", "step_mode"], args)
  }

  vband(args: Partial<VBandArgs>): TypedGlyphRenderer<VBand>
  vband(
    left: VBandArgs["left"],
    right: VBandArgs["right"],
    args?: Partial<VBandArgs>): TypedGlyphRenderer<VBand>
  vband(...args: unknown[]): TypedGlyphRenderer<VBand> {
    return this._glyph(VBand, ["left", "right"], args)
  }

  vbar(args: Partial<VBarArgs>): TypedGlyphRenderer<VBar>
  vbar(
    x: VBarArgs["x"],
    width: VBarArgs["width"],
    top: VBarArgs["top"],
    bottom: VBarArgs["bottom"],
    args?: Partial<VBarArgs>): TypedGlyphRenderer<VBar>
  vbar(...args: unknown[]): TypedGlyphRenderer<VBar> {
    return this._glyph(VBar, ["x", "width", "top", "bottom"], args)
  }

  vspan(args: Partial<VSpanArgs>): TypedGlyphRenderer<VSpan>
  vspan(
    x: VSpanArgs["x"],
    args?: Partial<VSpanArgs>): TypedGlyphRenderer<VSpan>
  vspan(...args: unknown[]): TypedGlyphRenderer<VSpan> {
    return this._glyph(VSpan, ["x"], args)
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
    return this._glyph(Wedge, ["x", "y", "radius", "start_angle", "end_angle"], args)
  }

  private _scatter(args: unknown[], marker?: MarkerType): TypedGlyphRenderer<Scatter> {
    return this._glyph(Scatter, ["x", "y"], args, marker != null ? {marker} : undefined)
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
}
