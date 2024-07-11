import type {HasProps} from "../core/has_props"
import type {Color, Arrayable} from "../core/types"
import type {Class} from "../core/class"
import type {Vector} from "../core/vectorization"
import type {VectorSpec, ScalarSpec, ColorSpec, UnitsSpec, Property} from "../core/properties"
import type {MarkerType, RenderLevel} from "../core/enums"
import type * as nd from "core/util/ndarray"

import type {Glyph, GlyphRenderer, ColumnarDataSource, CDSView, CoordinateMapping} from "./models"

import {
  AnnularWedge,
  Annulus,
  Arc,
  Bezier,
  Block,
  Circle,
  Ellipse,
  HArea,
  HAreaStep,
  HBar,
  HSpan,
  HStrip,
  HexTile,
  Image,
  ImageRGBA,
  ImageStack,
  ImageURL,
  Line,
  MathMLGlyph as MathML,
  MultiLine,
  MultiPolygons,
  Patch,
  Patches,
  Quad,
  Quadratic,
  Ray,
  Rect,
  Scatter,
  Segment,
  Spline,
  Step,
  TeXGlyph as TeX,
  Text,
  VArea,
  VAreaStep,
  VBar,
  VSpan,
  VStrip,
  Wedge,
} from "../models/glyphs"

import type {Marker} from "../models/glyphs/marker"

export type NamesOf<T extends HasProps> = (Extract<keyof T["properties"], string>)[]

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
export type HBarArgs          = GlyphArgs<HBar.Props>          & AuxLine & AuxFill & AuxHatch
export type HSpanArgs         = GlyphArgs<HSpan.Props>         & AuxLine
export type HStripArgs        = GlyphArgs<HStrip.Props>        & AuxLine & AuxFill & AuxHatch
export type HexTileArgs       = GlyphArgs<HexTile.Props>       & AuxLine & AuxFill & AuxHatch
export type ImageArgs         = GlyphArgs<Image.Props>
export type ImageRGBAArgs     = GlyphArgs<ImageRGBA.Props>
export type ImageStackArgs    = GlyphArgs<ImageStack.Props>
export type ImageURLArgs      = GlyphArgs<ImageURL.Props>
export type LineArgs          = GlyphArgs<Line.Props>          & AuxLine
export type MarkerArgs        = GlyphArgs<Marker.Props>        & AuxLine & AuxFill & AuxHatch
export type MathMLArgs        = GlyphArgs<MathML.Props>                                       & AuxText
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
export type TeXArgs           = GlyphArgs<TeX.Props>                                          & AuxText
export type TextArgs          = GlyphArgs<Text.Props>                                         & AuxText
export type VAreaArgs         = GlyphArgs<VArea.Props>                   & AuxFill & AuxHatch
export type VAreaStepArgs     = GlyphArgs<VAreaStep.Props>               & AuxFill & AuxHatch
export type VBarArgs          = GlyphArgs<VBar.Props>          & AuxLine & AuxFill & AuxHatch
export type VSpanArgs         = GlyphArgs<VSpan.Props>         & AuxLine
export type VStripArgs        = GlyphArgs<VStrip.Props>        & AuxLine & AuxFill & AuxHatch
export type WedgeArgs         = GlyphArgs<Wedge.Props>         & AuxLine & AuxFill & AuxHatch

export abstract class GlyphAPI {
  abstract _glyph<G extends Glyph>(cls: Class<G>, method: string, positional: NamesOf<G>, args: unknown[], overrides?: object): GlyphRenderer<G>

  annular_wedge(): GlyphRenderer<AnnularWedge>
  annular_wedge(args: Partial<AnnularWedgeArgs>): GlyphRenderer<AnnularWedge>
  annular_wedge(
    x: AnnularWedgeArgs["x"],
    y: AnnularWedgeArgs["y"],
    inner_radius: AnnularWedgeArgs["inner_radius"],
    outer_radius: AnnularWedgeArgs["outer_radius"],
    start_angle: AnnularWedgeArgs["start_angle"],
    end_angle: AnnularWedgeArgs["end_angle"],
    args?: Partial<AnnularWedgeArgs>): GlyphRenderer<AnnularWedge>
  annular_wedge(...args: unknown[]): GlyphRenderer<AnnularWedge> {
    return this._glyph(AnnularWedge, "annular_wedge", ["x", "y", "inner_radius", "outer_radius", "start_angle", "end_angle"], args)
  }

  annulus(): GlyphRenderer<Annulus>
  annulus(args: Partial<AnnulusArgs>): GlyphRenderer<Annulus>
  annulus(
    x: AnnulusArgs["x"],
    y: AnnulusArgs["y"],
    inner_radius: AnnulusArgs["inner_radius"],
    outer_radius: AnnulusArgs["outer_radius"],
    args?: Partial<AnnulusArgs>): GlyphRenderer<Annulus>
  annulus(...args: unknown[]): GlyphRenderer<Annulus> {
    return this._glyph(Annulus, "annulus", ["x", "y", "inner_radius", "outer_radius"], args)
  }

  arc(): GlyphRenderer<Arc>
  arc(args: Partial<ArcArgs>): GlyphRenderer<Arc>
  arc(
    x: ArcArgs["x"],
    y: ArcArgs["y"],
    radius: ArcArgs["radius"],
    start_angle: ArcArgs["start_angle"],
    end_angle: ArcArgs["end_angle"],
    args?: Partial<ArcArgs>): GlyphRenderer<Arc>
  arc(...args: unknown[]): GlyphRenderer<Arc> {
    return this._glyph(Arc, "arc", ["x", "y", "radius", "start_angle", "end_angle"], args)
  }

  bezier(): GlyphRenderer<Bezier>
  bezier(args: Partial<BezierArgs>): GlyphRenderer<Bezier>
  bezier(
    x0: BezierArgs["x0"],
    y0: BezierArgs["y0"],
    x1: BezierArgs["x1"],
    y1: BezierArgs["y1"],
    cx0: BezierArgs["cx0"],
    cy0: BezierArgs["cy0"],
    cx1: BezierArgs["cx1"],
    cy1: BezierArgs["cy1"],
    args?: Partial<BezierArgs>): GlyphRenderer<Bezier>
  bezier(...args: unknown[]): GlyphRenderer<Bezier> {
    return this._glyph(Bezier, "bezier", ["x0", "y0", "x1", "y1", "cx0", "cy0", "cx1", "cy1"], args)
  }

  block(): GlyphRenderer<Block>
  block(args: Partial<BlockArgs>): GlyphRenderer<Block>
  block(
    x: BlockArgs["x"],
    y: BlockArgs["y"],
    width: BlockArgs["width"],
    height: BlockArgs["height"],
    args?: Partial<BlockArgs>): GlyphRenderer<Block>
  block(...args: unknown[]): GlyphRenderer<Block> {
    return this._glyph(Block, "block", ["x", "y", "width", "height"], args)
  }

  circle(): GlyphRenderer<Circle>
  circle(args: Partial<CircleArgs>): GlyphRenderer<Circle>
  circle(
    x: CircleArgs["x"],
    y: CircleArgs["y"],
    radius: CircleArgs["radius"],
    args?: Partial<CircleArgs>): GlyphRenderer<Circle>
  circle(...args: unknown[]): GlyphRenderer<Circle> {
    return this._glyph(Circle, "circle", ["x", "y", "radius"], args)
  }

  ellipse(): GlyphRenderer<Ellipse>
  ellipse(args: Partial<EllipseArgs>): GlyphRenderer<Ellipse>
  ellipse(
    x: EllipseArgs["x"],
    y: EllipseArgs["y"],
    width: EllipseArgs["width"],
    height: EllipseArgs["height"],
    args?: Partial<EllipseArgs>): GlyphRenderer<Ellipse>
  ellipse(...args: unknown[]): GlyphRenderer<Ellipse> {
    return this._glyph(Ellipse, "ellipse", ["x", "y", "width", "height"], args)
  }

  harea(): GlyphRenderer<HArea>
  harea(args: Partial<HAreaArgs>): GlyphRenderer<HArea>
  harea(
    x1: HAreaArgs["x1"],
    x2: HAreaArgs["x2"],
    y: HAreaArgs["y"],
    args?: Partial<HAreaArgs>): GlyphRenderer<HArea>
  harea(...args: unknown[]): GlyphRenderer<HArea> {
    return this._glyph(HArea, "harea", ["x1", "x2", "y"], args)
  }

  harea_step(): GlyphRenderer<HAreaStep>
  harea_step(args: Partial<HAreaStepArgs>): GlyphRenderer<HAreaStep>
  harea_step(
    x1: HAreaStepArgs["x1"],
    x2: HAreaStepArgs["x2"],
    y: HAreaStepArgs["y"],
    step_mode: HAreaStepArgs["step_mode"],
    args?: Partial<HAreaStepArgs>): GlyphRenderer<HAreaStep>
  harea_step(...args: unknown[]): GlyphRenderer<HAreaStep> {
    return this._glyph(HAreaStep, "harea_step", ["x1", "x2", "y", "step_mode"], args)
  }

  hbar(): GlyphRenderer<HBar>
  hbar(args: Partial<HBarArgs>): GlyphRenderer<HBar>
  hbar(
    y: HBarArgs["y"],
    height: HBarArgs["height"],
    right: HBarArgs["right"],
    left: HBarArgs["left"],
    args?: Partial<HBarArgs>): GlyphRenderer<HBar>
  hbar(...args: unknown[]): GlyphRenderer<HBar> {
    return this._glyph(HBar, "hbar", ["y", "height", "right", "left"], args)
  }

  hspan(): GlyphRenderer<HSpan>
  hspan(args: Partial<HSpanArgs>): GlyphRenderer<HSpan>
  hspan(
    y: HSpanArgs["y"],
    args?: Partial<HSpanArgs>): GlyphRenderer<HSpan>
  hspan(...args: unknown[]): GlyphRenderer<HSpan> {
    return this._glyph(HSpan, "hspan", ["y"], args)
  }

  hstrip(): GlyphRenderer<HStrip>
  hstrip(args: Partial<HStripArgs>): GlyphRenderer<HStrip>
  hstrip(
    y0: HStripArgs["y0"],
    y1: HStripArgs["y1"],
    args?: Partial<HStripArgs>): GlyphRenderer<HStrip>
  hstrip(...args: unknown[]): GlyphRenderer<HStrip> {
    return this._glyph(HStrip, "hstrip", ["y0", "y1"], args)
  }

  hex_tile(): GlyphRenderer<HexTile>
  hex_tile(args: Partial<HexTileArgs>): GlyphRenderer<HexTile>
  hex_tile(
    q: HexTileArgs["q"],
    r: HexTileArgs["r"],
    args?: Partial<HexTileArgs>): GlyphRenderer<HexTile>
  hex_tile(...args: unknown[]): GlyphRenderer<HexTile> {
    return this._glyph(HexTile, "hex_tile", ["q", "r"], args)
  }

  image(): GlyphRenderer<Image>
  image(args: Partial<ImageArgs>): GlyphRenderer<Image>
  image(
    image: ImageArgs["image"],
    x: ImageArgs["x"],
    y: ImageArgs["y"],
    dw: ImageArgs["dw"],
    dh: ImageArgs["dh"],
    args?: Partial<ImageArgs>): GlyphRenderer<Image>
  image(...args: unknown[]): GlyphRenderer<Image> {
    return this._glyph(Image, "image", ["color_mapper", "image", "x", "y", "dw", "dh"], args)
  }

  image_stack(): GlyphRenderer<ImageStack>
  image_stack(args: Partial<ImageStackArgs>): GlyphRenderer<ImageStack>
  image_stack(
    image: ImageStackArgs["image"],
    x: ImageStackArgs["x"],
    y: ImageStackArgs["y"],
    dw: ImageStackArgs["dw"],
    dh: ImageStackArgs["dh"],
    args?: Partial<ImageStackArgs>): GlyphRenderer<ImageStack>
  image_stack(...args: unknown[]): GlyphRenderer<ImageStack> {
    return this._glyph(ImageStack, "image_stack", ["color_mapper", "image", "x", "y", "dw", "dh"], args)
  }

  image_rgba(): GlyphRenderer<ImageRGBA>
  image_rgba(args: Partial<ImageRGBAArgs>): GlyphRenderer<ImageRGBA>
  image_rgba(
    image: ImageRGBAArgs["image"],
    x: ImageRGBAArgs["x"],
    y: ImageRGBAArgs["y"],
    dw: ImageRGBAArgs["dw"],
    dh: ImageRGBAArgs["dh"],
    args?: Partial<ImageRGBAArgs>): GlyphRenderer<ImageRGBA>
  image_rgba(...args: unknown[]): GlyphRenderer<ImageRGBA> {
    return this._glyph(ImageRGBA, "image_rgba", ["image", "x", "y", "dw", "dh"], args)
  }

  image_url(): GlyphRenderer<ImageURL>
  image_url(args: Partial<ImageURLArgs>): GlyphRenderer<ImageURL>
  image_url(
    url: ImageURLArgs["url"],
    x: ImageURLArgs["x"],
    y: ImageURLArgs["y"],
    w: ImageURLArgs["w"],
    h: ImageURLArgs["h"],
    args?: Partial<ImageURLArgs>): GlyphRenderer<ImageURL>
  image_url(...args: unknown[]): GlyphRenderer<ImageURL> {
    return this._glyph(ImageURL, "image_url", ["url", "x", "y", "w", "h"], args)
  }

  line(): GlyphRenderer<Line>
  line(args: Partial<LineArgs>): GlyphRenderer<Line>
  line(
    x: LineArgs["x"],
    y: LineArgs["y"],
    args?: Partial<LineArgs>): GlyphRenderer<Line>
  line(...args: unknown[]): GlyphRenderer<Line> {
    return this._glyph(Line, "line", ["x", "y"], args)
  }

  mathml(): GlyphRenderer<MathML>
  mathml(args: Partial<MathMLArgs>): GlyphRenderer<MathML>
  mathml(
    x: MathMLArgs["x"],
    y: MathMLArgs["y"],
    text: MathMLArgs["text"],
    args?: Partial<MathMLArgs>): GlyphRenderer<MathML>
  mathml(...args: unknown[]): GlyphRenderer<MathML> {
    return this._glyph(MathML, "mathml", ["x", "y", "text"], args)
  }

  multi_line(): GlyphRenderer<MultiLine>
  multi_line(args: Partial<MultiLineArgs>): GlyphRenderer<MultiLine>
  multi_line(
    xs: MultiLineArgs["xs"],
    ys: MultiLineArgs["ys"],
    args?: Partial<MultiLineArgs>): GlyphRenderer<MultiLine>
  multi_line(...args: unknown[]): GlyphRenderer<MultiLine> {
    return this._glyph(MultiLine, "multi_line", ["xs", "ys"], args)
  }

  multi_polygons(): GlyphRenderer<MultiPolygons>
  multi_polygons(args: Partial<MultiPolygonsArgs>): GlyphRenderer<MultiPolygons>
  multi_polygons(
    xs: MultiPolygonsArgs["xs"],
    ys: MultiPolygonsArgs["ys"],
    args?: Partial<MultiPolygonsArgs>): GlyphRenderer<MultiPolygons>
  multi_polygons(...args: unknown[]): GlyphRenderer<MultiPolygons> {
    return this._glyph(MultiPolygons, "multi_polygons", ["xs", "ys"], args)
  }

  patch(): GlyphRenderer<Patch>
  patch(args: Partial<PatchArgs>): GlyphRenderer<Patch>
  patch(
    x: PatchArgs["x"],
    y: PatchArgs["y"],
    args?: Partial<PatchArgs>): GlyphRenderer<Patch>
  patch(...args: unknown[]): GlyphRenderer<Patch> {
    return this._glyph(Patch, "patch", ["x", "y"], args)
  }

  patches(): GlyphRenderer<Patches>
  patches(args: Partial<PatchesArgs>): GlyphRenderer<Patches>
  patches(
    xs: PatchesArgs["xs"],
    ys: PatchesArgs["ys"],
    args?: Partial<PatchesArgs>): GlyphRenderer<Patches>
  patches(...args: unknown[]): GlyphRenderer<Patches> {
    return this._glyph(Patches, "patches", ["xs", "ys"], args)
  }

  quad(): GlyphRenderer<Quad>
  quad(args: Partial<QuadArgs>): GlyphRenderer<Quad>
  quad(
    left: QuadArgs["left"],
    right: QuadArgs["right"],
    bottom: QuadArgs["bottom"],
    top: QuadArgs["top"],
    args?: Partial<QuadArgs>): GlyphRenderer<Quad>
  quad(...args: unknown[]): GlyphRenderer<Quad> {
    return this._glyph(Quad, "quad", ["left", "right", "bottom", "top"], args)
  }

  quadratic(): GlyphRenderer<Quadratic>
  quadratic(args: Partial<QuadraticArgs>): GlyphRenderer<Quadratic>
  quadratic(
    x0: QuadraticArgs["x0"],
    y0: QuadraticArgs["y0"],
    x1: QuadraticArgs["x1"],
    y1: QuadraticArgs["y1"],
    cx: QuadraticArgs["cx"],
    cy: QuadraticArgs["cy"],
    args?: Partial<QuadraticArgs>): GlyphRenderer<Quadratic>
  quadratic(...args: unknown[]): GlyphRenderer<Quadratic> {
    return this._glyph(Quadratic, "quadratic", ["x0", "y0", "x1", "y1", "cx", "cy"], args)
  }

  ray(): GlyphRenderer<Ray>
  ray(args: Partial<RayArgs>): GlyphRenderer<Ray>
  ray(
    x: RayArgs["x"],
    y: RayArgs["y"],
    length: RayArgs["length"],
    args?: Partial<RayArgs>): GlyphRenderer<Ray>
  ray(...args: unknown[]): GlyphRenderer<Ray> {
    return this._glyph(Ray, "ray", ["x", "y", "length"], args)
  }

  rect(): GlyphRenderer<Rect>
  rect(args: Partial<RectArgs>): GlyphRenderer<Rect>
  rect(
    x: RectArgs["x"],
    y: RectArgs["y"],
    width: RectArgs["width"],
    height: RectArgs["height"],
    args?: Partial<RectArgs>): GlyphRenderer<Rect>
  rect(...args: unknown[]): GlyphRenderer<Rect> {
    return this._glyph(Rect, "rect", ["x", "y", "width", "height"], args)
  }

  segment(): GlyphRenderer<Segment>
  segment(args: Partial<SegmentArgs>): GlyphRenderer<Segment>
  segment(
    x0: SegmentArgs["x0"],
    y0: SegmentArgs["y0"],
    x1: SegmentArgs["x1"],
    y1: SegmentArgs["y1"],
    args?: Partial<SegmentArgs>): GlyphRenderer<Segment>
  segment(...args: unknown[]): GlyphRenderer<Segment> {
    return this._glyph(Segment, "segment", ["x0", "y0", "x1", "y1"], args)
  }

  spline(): GlyphRenderer<Spline>
  spline(args: Partial<SplineArgs>): GlyphRenderer<Spline>
  spline(
    x: SplineArgs["x"],
    y: SplineArgs["y"],
    args?: Partial<SplineArgs>): GlyphRenderer<Spline>
  spline(...args: unknown[]): GlyphRenderer<Spline> {
    return this._glyph(Spline, "spline", ["x", "y"], args)
  }

  step(): GlyphRenderer<Step>
  step(args: Partial<StepArgs>): GlyphRenderer<Step>
  step(
    x: StepArgs["x"],
    y: StepArgs["y"],
    mode: StepArgs["mode"],
    args?: Partial<StepArgs>): GlyphRenderer<Step>
  step(...args: unknown[]): GlyphRenderer<Step> {
    return this._glyph(Step, "step", ["x", "y", "mode"], args)
  }

  tex(): GlyphRenderer<TeX>
  tex(args: Partial<TeXArgs>): GlyphRenderer<TeX>
  tex(
    x: TeXArgs["x"],
    y: TeXArgs["y"],
    text: TeXArgs["text"],
    args?: Partial<TeXArgs>): GlyphRenderer<TeX>
  tex(...args: unknown[]): GlyphRenderer<TeX> {
    return this._glyph(TeX, "tex", ["x", "y", "text"], args)
  }

  text(): GlyphRenderer<Text>
  text(args: Partial<TextArgs>): GlyphRenderer<Text>
  text(
    x: TextArgs["x"],
    y: TextArgs["y"],
    text: TextArgs["text"],
    args?: Partial<TextArgs>): GlyphRenderer<Text>
  text(...args: unknown[]): GlyphRenderer<Text> {
    return this._glyph(Text, "text", ["x", "y", "text"], args)
  }

  varea(): GlyphRenderer<VArea>
  varea(args: Partial<VAreaArgs>): GlyphRenderer<VArea>
  varea(
    x: VAreaArgs["x"],
    y1: VAreaArgs["y1"],
    y2: VAreaArgs["y2"],
    args?: Partial<VAreaArgs>): GlyphRenderer<VArea>
  varea(...args: unknown[]): GlyphRenderer<VArea> {
    return this._glyph(VArea, "varea", ["x", "y1", "y2"], args)
  }

  varea_step(): GlyphRenderer<VAreaStep>
  varea_step(args: Partial<VAreaStepArgs>): GlyphRenderer<VAreaStep>
  varea_step(
    x: VAreaStepArgs["x"],
    y1: VAreaStepArgs["y1"],
    y2: VAreaStepArgs["y2"],
    step_mode: VAreaStepArgs["step_mode"],
    args?: Partial<VAreaStepArgs>): GlyphRenderer<VAreaStep>
  varea_step(...args: unknown[]): GlyphRenderer<VAreaStep> {
    return this._glyph(VAreaStep, "varea_step", ["x", "y1", "y2", "step_mode"], args)
  }

  vbar(): GlyphRenderer<VBar>
  vbar(args: Partial<VBarArgs>): GlyphRenderer<VBar>
  vbar(
    x: VBarArgs["x"],
    width: VBarArgs["width"],
    top: VBarArgs["top"],
    bottom: VBarArgs["bottom"],
    args?: Partial<VBarArgs>): GlyphRenderer<VBar>
  vbar(...args: unknown[]): GlyphRenderer<VBar> {
    return this._glyph(VBar, "vbar", ["x", "width", "top", "bottom"], args)
  }

  vspan(): GlyphRenderer<VSpan>
  vspan(args: Partial<VSpanArgs>): GlyphRenderer<VSpan>
  vspan(
    x: VSpanArgs["x"],
    args?: Partial<VSpanArgs>): GlyphRenderer<VSpan>
  vspan(...args: unknown[]): GlyphRenderer<VSpan> {
    return this._glyph(VSpan, "vspan", ["x"], args)
  }

  vstrip(): GlyphRenderer<VStrip>
  vstrip(args: Partial<VStripArgs>): GlyphRenderer<VStrip>
  vstrip(
    x0: VStripArgs["x0"],
    x1: VStripArgs["x1"],
    args?: Partial<VStripArgs>): GlyphRenderer<VStrip>
  vstrip(...args: unknown[]): GlyphRenderer<VStrip> {
    return this._glyph(VStrip, "vstrip", ["x0", "x1"], args)
  }

  wedge(): GlyphRenderer<Wedge>
  wedge(args: Partial<WedgeArgs>): GlyphRenderer<Wedge>
  wedge(
    x: WedgeArgs["x"],
    y: WedgeArgs["y"],
    radius: WedgeArgs["radius"],
    start_angle: WedgeArgs["start_angle"],
    end_angle: WedgeArgs["end_angle"],
    args?: Partial<WedgeArgs>): GlyphRenderer<Wedge>
  wedge(...args: unknown[]): GlyphRenderer<Wedge> {
    return this._glyph(Wedge, "wedge", ["x", "y", "radius", "start_angle", "end_angle"], args)
  }

  private _scatter(args: unknown[], marker?: MarkerType): GlyphRenderer<Scatter> {
    return this._glyph(Scatter, marker ?? "scatter", ["x", "y"], args, marker != null ? {marker} : undefined)
  }

  scatter(): GlyphRenderer<Scatter>
  scatter(args: Partial<ScatterArgs>): GlyphRenderer<Scatter>
  scatter(x: MarkerArgs["x"], y: MarkerArgs["y"], args?: Partial<ScatterArgs>): GlyphRenderer<Scatter>
  scatter(...args: unknown[]): GlyphRenderer<Scatter> {
    return this._scatter(args)
  }

  /** @deprecated */ asterisk(): GlyphRenderer<Scatter>
  /** @deprecated */ asterisk(args: Partial<MarkerArgs>): GlyphRenderer<Scatter>
  /** @deprecated */ asterisk(x: MarkerArgs["x"], y: MarkerArgs["y"], args?: Partial<MarkerArgs>): GlyphRenderer<Scatter>
  /** @deprecated */ asterisk(...args: unknown[]): GlyphRenderer<Scatter> {
    return this._scatter(args, "asterisk")
  }

  /** @deprecated */ circle_cross(): GlyphRenderer<Scatter>
  /** @deprecated */ circle_cross(args: Partial<MarkerArgs>): GlyphRenderer<Scatter>
  /** @deprecated */ circle_cross(x: MarkerArgs["x"], y: MarkerArgs["y"], args?: Partial<MarkerArgs>): GlyphRenderer<Scatter>
  /** @deprecated */ circle_cross(...args: unknown[]): GlyphRenderer<Scatter> {
    return this._scatter(args, "circle_cross")
  }

  /** @deprecated */ circle_dot(): GlyphRenderer<Scatter>
  /** @deprecated */ circle_dot(args: Partial<MarkerArgs>): GlyphRenderer<Scatter>
  /** @deprecated */ circle_dot(x: MarkerArgs["x"], y: MarkerArgs["y"], args?: Partial<MarkerArgs>): GlyphRenderer<Scatter>
  /** @deprecated */ circle_dot(...args: unknown[]): GlyphRenderer<Scatter> {
    return this._scatter(args, "circle_dot")
  }

  /** @deprecated */ circle_x(): GlyphRenderer<Scatter>
  /** @deprecated */ circle_x(args: Partial<MarkerArgs>): GlyphRenderer<Scatter>
  /** @deprecated */ circle_x(x: MarkerArgs["x"], y: MarkerArgs["y"], args?: Partial<MarkerArgs>): GlyphRenderer<Scatter>
  /** @deprecated */ circle_x(...args: unknown[]): GlyphRenderer<Scatter> {
    return this._scatter(args, "circle_x")
  }

  /** @deprecated */ circle_y(): GlyphRenderer<Scatter>
  /** @deprecated */ circle_y(args: Partial<MarkerArgs>): GlyphRenderer<Scatter>
  /** @deprecated */ circle_y(x: MarkerArgs["x"], y: MarkerArgs["y"], args?: Partial<MarkerArgs>): GlyphRenderer<Scatter>
  /** @deprecated */ circle_y(...args: unknown[]): GlyphRenderer<Scatter> {
    return this._scatter(args, "circle_y")
  }

  /** @deprecated */ cross(): GlyphRenderer<Scatter>
  /** @deprecated */ cross(args: Partial<MarkerArgs>): GlyphRenderer<Scatter>
  /** @deprecated */ cross(x: MarkerArgs["x"], y: MarkerArgs["y"], args?: Partial<MarkerArgs>): GlyphRenderer<Scatter>
  /** @deprecated */ cross(...args: unknown[]): GlyphRenderer<Scatter> {
    return this._scatter(args, "cross")
  }

  /** @deprecated */ dash(): GlyphRenderer<Scatter>
  /** @deprecated */ dash(args: Partial<MarkerArgs>): GlyphRenderer<Scatter>
  /** @deprecated */ dash(x: MarkerArgs["x"], y: MarkerArgs["y"], args?: Partial<MarkerArgs>): GlyphRenderer<Scatter>
  /** @deprecated */ dash(...args: unknown[]): GlyphRenderer<Scatter> {
    return this._scatter(args, "dash")
  }

  /** @deprecated */ diamond(): GlyphRenderer<Scatter>
  /** @deprecated */ diamond(args: Partial<MarkerArgs>): GlyphRenderer<Scatter>
  /** @deprecated */ diamond(x: MarkerArgs["x"], y: MarkerArgs["y"], args?: Partial<MarkerArgs>): GlyphRenderer<Scatter>
  /** @deprecated */ diamond(...args: unknown[]): GlyphRenderer<Scatter> {
    return this._scatter(args, "diamond")
  }

  /** @deprecated */ diamond_cross(): GlyphRenderer<Scatter>
  /** @deprecated */ diamond_cross(args: Partial<MarkerArgs>): GlyphRenderer<Scatter>
  /** @deprecated */ diamond_cross(x: MarkerArgs["x"], y: MarkerArgs["y"], args?: Partial<MarkerArgs>): GlyphRenderer<Scatter>
  /** @deprecated */ diamond_cross(...args: unknown[]): GlyphRenderer<Scatter> {
    return this._scatter(args, "diamond_cross")
  }

  /** @deprecated */ diamond_dot(): GlyphRenderer<Scatter>
  /** @deprecated */ diamond_dot(args: Partial<MarkerArgs>): GlyphRenderer<Scatter>
  /** @deprecated */ diamond_dot(x: MarkerArgs["x"], y: MarkerArgs["y"], args?: Partial<MarkerArgs>): GlyphRenderer<Scatter>
  /** @deprecated */ diamond_dot(...args: unknown[]): GlyphRenderer<Scatter> {
    return this._scatter(args, "diamond_dot")
  }

  /** @deprecated */ dot(): GlyphRenderer<Scatter>
  /** @deprecated */ dot(args: Partial<MarkerArgs>): GlyphRenderer<Scatter>
  /** @deprecated */ dot(x: MarkerArgs["x"], y: MarkerArgs["y"], args?: Partial<MarkerArgs>): GlyphRenderer<Scatter>
  /** @deprecated */ dot(...args: unknown[]): GlyphRenderer<Scatter> {
    return this._scatter(args, "dot")
  }

  /** @deprecated */ hex(): GlyphRenderer<Scatter>
  /** @deprecated */ hex(args: Partial<MarkerArgs>): GlyphRenderer<Scatter>
  /** @deprecated */ hex(x: MarkerArgs["x"], y: MarkerArgs["y"], args?: Partial<MarkerArgs>): GlyphRenderer<Scatter>
  /** @deprecated */ hex(...args: unknown[]): GlyphRenderer<Scatter> {
    return this._scatter(args, "hex")
  }

  /** @deprecated */ hex_dot(): GlyphRenderer<Scatter>
  /** @deprecated */ hex_dot(args: Partial<MarkerArgs>): GlyphRenderer<Scatter>
  /** @deprecated */ hex_dot(x: MarkerArgs["x"], y: MarkerArgs["y"], args?: Partial<MarkerArgs>): GlyphRenderer<Scatter>
  /** @deprecated */ hex_dot(...args: unknown[]): GlyphRenderer<Scatter> {
    return this._scatter(args, "hex_dot")
  }

  /** @deprecated */ inverted_triangle(): GlyphRenderer<Scatter>
  /** @deprecated */ inverted_triangle(args: Partial<MarkerArgs>): GlyphRenderer<Scatter>
  /** @deprecated */ inverted_triangle(x: MarkerArgs["x"], y: MarkerArgs["y"], args?: Partial<MarkerArgs>): GlyphRenderer<Scatter>
  /** @deprecated */ inverted_triangle(...args: unknown[]): GlyphRenderer<Scatter> {
    return this._scatter(args, "inverted_triangle")
  }

  /** @deprecated */ plus(): GlyphRenderer<Scatter>
  /** @deprecated */ plus(args: Partial<MarkerArgs>): GlyphRenderer<Scatter>
  /** @deprecated */ plus(x: MarkerArgs["x"], y: MarkerArgs["y"], args?: Partial<MarkerArgs>): GlyphRenderer<Scatter>
  /** @deprecated */ plus(...args: unknown[]): GlyphRenderer<Scatter> {
    return this._scatter(args, "plus")
  }

  /** @deprecated */ square(): GlyphRenderer<Scatter>
  /** @deprecated */ square(args: Partial<MarkerArgs>): GlyphRenderer<Scatter>
  /** @deprecated */ square(x: MarkerArgs["x"], y: MarkerArgs["y"], args?: Partial<MarkerArgs>): GlyphRenderer<Scatter>
  /** @deprecated */ square(...args: unknown[]): GlyphRenderer<Scatter> {
    return this._scatter(args, "square")
  }

  /** @deprecated */ square_cross(): GlyphRenderer<Scatter>
  /** @deprecated */ square_cross(args: Partial<MarkerArgs>): GlyphRenderer<Scatter>
  /** @deprecated */ square_cross(x: MarkerArgs["x"], y: MarkerArgs["y"], args?: Partial<MarkerArgs>): GlyphRenderer<Scatter>
  /** @deprecated */ square_cross(...args: unknown[]): GlyphRenderer<Scatter> {
    return this._scatter(args, "square_cross")
  }

  /** @deprecated */ square_dot(): GlyphRenderer<Scatter>
  /** @deprecated */ square_dot(args: Partial<MarkerArgs>): GlyphRenderer<Scatter>
  /** @deprecated */ square_dot(x: MarkerArgs["x"], y: MarkerArgs["y"], args?: Partial<MarkerArgs>): GlyphRenderer<Scatter>
  /** @deprecated */ square_dot(...args: unknown[]): GlyphRenderer<Scatter> {
    return this._scatter(args, "square_dot")
  }

  /** @deprecated */ square_pin(): GlyphRenderer<Scatter>
  /** @deprecated */ square_pin(args: Partial<MarkerArgs>): GlyphRenderer<Scatter>
  /** @deprecated */ square_pin(x: MarkerArgs["x"], y: MarkerArgs["y"], args?: Partial<MarkerArgs>): GlyphRenderer<Scatter>
  /** @deprecated */ square_pin(...args: unknown[]): GlyphRenderer<Scatter> {
    return this._scatter(args, "square_pin")
  }

  /** @deprecated */ square_x(): GlyphRenderer<Scatter>
  /** @deprecated */ square_x(args: Partial<MarkerArgs>): GlyphRenderer<Scatter>
  /** @deprecated */ square_x(x: MarkerArgs["x"], y: MarkerArgs["y"], args?: Partial<MarkerArgs>): GlyphRenderer<Scatter>
  /** @deprecated */ square_x(...args: unknown[]): GlyphRenderer<Scatter> {
    return this._scatter(args, "square_x")
  }

  /** @deprecated */ star(): GlyphRenderer<Scatter>
  /** @deprecated */ star(args: Partial<MarkerArgs>): GlyphRenderer<Scatter>
  /** @deprecated */ star(x: MarkerArgs["x"], y: MarkerArgs["y"], args?: Partial<MarkerArgs>): GlyphRenderer<Scatter>
  /** @deprecated */ star(...args: unknown[]): GlyphRenderer<Scatter> {
    return this._scatter(args, "star")
  }

  /** @deprecated */ star_dot(): GlyphRenderer<Scatter>
  /** @deprecated */ star_dot(args: Partial<MarkerArgs>): GlyphRenderer<Scatter>
  /** @deprecated */ star_dot(x: MarkerArgs["x"], y: MarkerArgs["y"], args?: Partial<MarkerArgs>): GlyphRenderer<Scatter>
  /** @deprecated */ star_dot(...args: unknown[]): GlyphRenderer<Scatter> {
    return this._scatter(args, "star_dot")
  }

  /** @deprecated */ triangle(): GlyphRenderer<Scatter>
  /** @deprecated */ triangle(args: Partial<MarkerArgs>): GlyphRenderer<Scatter>
  /** @deprecated */ triangle(x: MarkerArgs["x"], y: MarkerArgs["y"], args?: Partial<MarkerArgs>): GlyphRenderer<Scatter>
  /** @deprecated */ triangle(...args: unknown[]): GlyphRenderer<Scatter> {
    return this._scatter(args, "triangle")
  }

  /** @deprecated */ triangle_dot(): GlyphRenderer<Scatter>
  /** @deprecated */ triangle_dot(args: Partial<MarkerArgs>): GlyphRenderer<Scatter>
  /** @deprecated */ triangle_dot(x: MarkerArgs["x"], y: MarkerArgs["y"], args?: Partial<MarkerArgs>): GlyphRenderer<Scatter>
  /** @deprecated */ triangle_dot(...args: unknown[]): GlyphRenderer<Scatter> {
    return this._scatter(args, "triangle_dot")
  }

  /** @deprecated */ triangle_pin(): GlyphRenderer<Scatter>
  /** @deprecated */ triangle_pin(args: Partial<MarkerArgs>): GlyphRenderer<Scatter>
  /** @deprecated */ triangle_pin(x: MarkerArgs["x"], y: MarkerArgs["y"], args?: Partial<MarkerArgs>): GlyphRenderer<Scatter>
  /** @deprecated */ triangle_pin(...args: unknown[]): GlyphRenderer<Scatter> {
    return this._scatter(args, "triangle_pin")
  }

  /** @deprecated */ x(): GlyphRenderer<Scatter>
  /** @deprecated */ x(args: Partial<MarkerArgs>): GlyphRenderer<Scatter>
  /** @deprecated */ x(x: MarkerArgs["x"], y: MarkerArgs["y"], args?: Partial<MarkerArgs>): GlyphRenderer<Scatter>
  /** @deprecated */ x(...args: unknown[]): GlyphRenderer<Scatter> {
    return this._scatter(args, "x")
  }

  /** @deprecated */ y(): GlyphRenderer<Scatter>
  /** @deprecated */ y(args: Partial<MarkerArgs>): GlyphRenderer<Scatter>
  /** @deprecated */ y(x: MarkerArgs["x"], y: MarkerArgs["y"], args?: Partial<MarkerArgs>): GlyphRenderer<Scatter>
  /** @deprecated */ y(...args: unknown[]): GlyphRenderer<Scatter> {
    return this._scatter(args, "y")
  }
}
