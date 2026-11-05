import type {HasProps, HasPropsFactory} from "../core/has_props"
import type {Color, Arrayable} from "../core/types"
import type {Vector} from "../core/vectorization"
import {isVectorized} from "../core/vectorization"
import {isPlainObject} from "../core/util/types"
import type {VectorSpec, ScalarSpec, ColorSpec, UnitsSpec, Property} from "../core/properties"
import type {MarkerType, RenderLevel} from "../core/enums"
import type * as nd from "core/util/ndarray"

import type {Glyph, GlyphRenderer, IndexedDataSource, ColumnarDataSource, ColumnDataSource, IndexedView, CoordinateMapping} from "./models"

import type {GlyphRendererWithSource} from "../models/renderers/glyph_renderer"

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
  Ngon,
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
import type {Marking} from "../models/graphics/marking"
import type {PathDecoration} from "../models/graphics/decoration"
import {OpenHead} from "../models/annotations/arrow_head"

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
  source: IndexedDataSource | ColumnarDataSource["data"]
  view: IndexedView
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

export type ArgsOf<P> = {[K in keyof P]:
  (P[K] extends ColorSpec                     ? ColorArg             :
  (P[K] extends VectorSpec<infer T, infer V>  ? T | Arrayable<T> | V :
  (P[K] extends ScalarSpec<infer T, infer S>  ? T |                S :
  (P[K] extends Property  <infer T>           ? T                    : never))))
}

export type UnitsOf<P> = {
  [K in keyof P & string as `${K}_units`]: P[K] extends UnitsSpec<any, infer Units> ? Units : never
}

export type GlyphArgs<P> = ArgsOf<P> & UnitsOf<P> & AuxGlyph & ColorAlpha

type ArrowProps = Omit<Segment.Props, "x0" | "y0" | "x1" | "y1"> & {
  x_start: Segment.Props["x0"]
  y_start: Segment.Props["y0"]
  x_end: Segment.Props["x1"]
  y_end: Segment.Props["y1"]
  start: Property<Marking | null>
  end: Property<Marking | "auto" | null>
  start_inset: Property<PathDecoration["inset"]>
  end_inset: Property<PathDecoration["inset"]>
}

export type AnnularWedgeArgs  = GlyphArgs<AnnularWedge.Props>  & AuxLine & AuxFill & AuxHatch
export type AnnulusArgs       = GlyphArgs<Annulus.Props>       & AuxLine & AuxFill & AuxHatch
export type ArrowArgs         = GlyphArgs<ArrowProps>          & AuxLine
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
export type NgonArgs          = GlyphArgs<Ngon.Props>          & AuxLine & AuxFill & AuxHatch
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

type GlyphSource = AuxGlyph["source"]
type SourceOf<Source extends GlyphSource> = Source extends IndexedDataSource ? Source : ColumnDataSource

type GlyphOptions<Args, Source extends GlyphSource> = Partial<Args> & {
  source?: Source
}

export abstract class GlyphAPI {
  abstract _glyph<G extends Glyph>(cls: HasPropsFactory<G>, method: string, positional: NamesOf<G>, args: unknown[], overrides?: object): GlyphRenderer<G>

  annular_wedge(): GlyphRendererWithSource<AnnularWedge, ColumnDataSource>
  annular_wedge<Source extends GlyphSource = ColumnDataSource>(args: GlyphOptions<AnnularWedgeArgs, Source>): GlyphRendererWithSource<AnnularWedge, SourceOf<Source>>
  annular_wedge<Source extends GlyphSource = ColumnDataSource>(
    x: AnnularWedgeArgs["x"],
    y: AnnularWedgeArgs["y"],
    inner_radius: AnnularWedgeArgs["inner_radius"],
    outer_radius: AnnularWedgeArgs["outer_radius"],
    start_angle: AnnularWedgeArgs["start_angle"],
    end_angle: AnnularWedgeArgs["end_angle"],
    args?: GlyphOptions<AnnularWedgeArgs, Source>): GlyphRendererWithSource<AnnularWedge, SourceOf<Source>>
  annular_wedge(...args: unknown[]): GlyphRenderer<AnnularWedge> {
    return this._glyph(AnnularWedge, "annular_wedge", ["x", "y", "inner_radius", "outer_radius", "start_angle", "end_angle"], args)
  }

  annulus(): GlyphRendererWithSource<Annulus, ColumnDataSource>
  annulus<Source extends GlyphSource = ColumnDataSource>(args: GlyphOptions<AnnulusArgs, Source>): GlyphRendererWithSource<Annulus, SourceOf<Source>>
  annulus<Source extends GlyphSource = ColumnDataSource>(
    x: AnnulusArgs["x"],
    y: AnnulusArgs["y"],
    inner_radius: AnnulusArgs["inner_radius"],
    outer_radius: AnnulusArgs["outer_radius"],
    args?: GlyphOptions<AnnulusArgs, Source>): GlyphRendererWithSource<Annulus, SourceOf<Source>>
  annulus(...args: unknown[]): GlyphRenderer<Annulus> {
    return this._glyph(Annulus, "annulus", ["x", "y", "inner_radius", "outer_radius"], args)
  }

  arrow(): GlyphRendererWithSource<Segment, ColumnDataSource>
  arrow<Source extends GlyphSource = ColumnDataSource>(args: GlyphOptions<ArrowArgs, Source>): GlyphRendererWithSource<Segment, SourceOf<Source>>
  arrow<Source extends GlyphSource = ColumnDataSource>(
    x_start: ArrowArgs["x_start"],
    y_start: ArrowArgs["y_start"],
    x_end: ArrowArgs["x_end"],
    y_end: ArrowArgs["y_end"],
    args?: GlyphOptions<ArrowArgs, Source>): GlyphRendererWithSource<Segment, SourceOf<Source>>
  arrow(...args: unknown[]): GlyphRenderer<Segment> {
    const signature = () => "the method signature is arrow(x_start, y_start, x_end, y_end, args?)"
    let attrs: Partial<ArrowArgs>
    if (args.length == 0) {
      attrs = {}
    } else if (args.length == 1 && isPlainObject(args[0]) && !isVectorized(args[0])) {
      attrs = {...args[0] as Partial<ArrowArgs>}
    } else if (args.length == 4 || args.length == 5) {
      const [x_start, y_start, x_end, y_end, options] = args
      if (options != null && (!isPlainObject(options) || isVectorized(options))) {
        throw new Error(`expected optional arguments: ${signature()}`)
      }
      attrs = {
        ...(options as Partial<ArrowArgs> | undefined),
        x_start: x_start as ArrowArgs["x_start"],
        y_start: y_start as ArrowArgs["y_start"],
        x_end: x_end as ArrowArgs["x_end"],
        y_end: y_end as ArrowArgs["y_end"],
      }
    } else {
      throw new Error(`wrong number of arguments: ${signature()}`)
    }

    const {
      x_start = {field: "x_start"},
      y_start = {field: "y_start"},
      x_end = {field: "x_end"},
      y_end = {field: "y_end"},
      start = null,
      end = "auto",
      start_inset = 0,
      end_inset = 0,
      ...segment_attrs
    } = attrs
    const renderer = this.segment({
      ...segment_attrs,
      x0: x_start,
      y0: y_start,
      x1: x_end,
      y1: y_end,
      level: segment_attrs.level ?? "annotation",
    })
    if (start != null) {
      renderer.add_path_decoration(start, {node: "start", inset: start_inset})
    }
    const end_marking = end == "auto" ? OpenHead.create({inherit_visuals: ["line_color", "line_alpha", "line_width"]}) : end
    if (end_marking != null) {
      renderer.add_path_decoration(end_marking, {node: "end", inset: end_inset})
    }
    return renderer
  }

  arc(): GlyphRendererWithSource<Arc, ColumnDataSource>
  arc<Source extends GlyphSource = ColumnDataSource>(args: GlyphOptions<ArcArgs, Source>): GlyphRendererWithSource<Arc, SourceOf<Source>>
  arc<Source extends GlyphSource = ColumnDataSource>(
    x: ArcArgs["x"],
    y: ArcArgs["y"],
    radius: ArcArgs["radius"],
    start_angle: ArcArgs["start_angle"],
    end_angle: ArcArgs["end_angle"],
    args?: GlyphOptions<ArcArgs, Source>): GlyphRendererWithSource<Arc, SourceOf<Source>>
  arc(...args: unknown[]): GlyphRenderer<Arc> {
    return this._glyph(Arc, "arc", ["x", "y", "radius", "start_angle", "end_angle"], args)
  }

  bezier(): GlyphRendererWithSource<Bezier, ColumnDataSource>
  bezier<Source extends GlyphSource = ColumnDataSource>(args: GlyphOptions<BezierArgs, Source>): GlyphRendererWithSource<Bezier, SourceOf<Source>>
  bezier<Source extends GlyphSource = ColumnDataSource>(
    x0: BezierArgs["x0"],
    y0: BezierArgs["y0"],
    x1: BezierArgs["x1"],
    y1: BezierArgs["y1"],
    cx0: BezierArgs["cx0"],
    cy0: BezierArgs["cy0"],
    cx1: BezierArgs["cx1"],
    cy1: BezierArgs["cy1"],
    args?: GlyphOptions<BezierArgs, Source>): GlyphRendererWithSource<Bezier, SourceOf<Source>>
  bezier(...args: unknown[]): GlyphRenderer<Bezier> {
    return this._glyph(Bezier, "bezier", ["x0", "y0", "x1", "y1", "cx0", "cy0", "cx1", "cy1"], args)
  }

  block(): GlyphRendererWithSource<Block, ColumnDataSource>
  block<Source extends GlyphSource = ColumnDataSource>(args: GlyphOptions<BlockArgs, Source>): GlyphRendererWithSource<Block, SourceOf<Source>>
  block<Source extends GlyphSource = ColumnDataSource>(
    x: BlockArgs["x"],
    y: BlockArgs["y"],
    width: BlockArgs["width"],
    height: BlockArgs["height"],
    args?: GlyphOptions<BlockArgs, Source>): GlyphRendererWithSource<Block, SourceOf<Source>>
  block(...args: unknown[]): GlyphRenderer<Block> {
    return this._glyph(Block, "block", ["x", "y", "width", "height"], args)
  }

  circle(): GlyphRendererWithSource<Circle, ColumnDataSource>
  circle<Source extends GlyphSource = ColumnDataSource>(args: GlyphOptions<CircleArgs, Source>): GlyphRendererWithSource<Circle, SourceOf<Source>>
  circle<Source extends GlyphSource = ColumnDataSource>(
    x: CircleArgs["x"],
    y: CircleArgs["y"],
    radius: CircleArgs["radius"],
    args?: GlyphOptions<CircleArgs, Source>): GlyphRendererWithSource<Circle, SourceOf<Source>>
  circle(...args: unknown[]): GlyphRenderer<Circle> {
    return this._glyph(Circle, "circle", ["x", "y", "radius"], args)
  }

  ellipse(): GlyphRendererWithSource<Ellipse, ColumnDataSource>
  ellipse<Source extends GlyphSource = ColumnDataSource>(args: GlyphOptions<EllipseArgs, Source>): GlyphRendererWithSource<Ellipse, SourceOf<Source>>
  ellipse<Source extends GlyphSource = ColumnDataSource>(
    x: EllipseArgs["x"],
    y: EllipseArgs["y"],
    width: EllipseArgs["width"],
    height: EllipseArgs["height"],
    args?: GlyphOptions<EllipseArgs, Source>): GlyphRendererWithSource<Ellipse, SourceOf<Source>>
  ellipse(...args: unknown[]): GlyphRenderer<Ellipse> {
    return this._glyph(Ellipse, "ellipse", ["x", "y", "width", "height"], args)
  }

  harea(): GlyphRendererWithSource<HArea, ColumnDataSource>
  harea<Source extends GlyphSource = ColumnDataSource>(args: GlyphOptions<HAreaArgs, Source>): GlyphRendererWithSource<HArea, SourceOf<Source>>
  harea<Source extends GlyphSource = ColumnDataSource>(
    x1: HAreaArgs["x1"],
    x2: HAreaArgs["x2"],
    y: HAreaArgs["y"],
    args?: GlyphOptions<HAreaArgs, Source>): GlyphRendererWithSource<HArea, SourceOf<Source>>
  harea(...args: unknown[]): GlyphRenderer<HArea> {
    return this._glyph(HArea, "harea", ["x1", "x2", "y"], args)
  }

  harea_step(): GlyphRendererWithSource<HAreaStep, ColumnDataSource>
  harea_step<Source extends GlyphSource = ColumnDataSource>(args: GlyphOptions<HAreaStepArgs, Source>): GlyphRendererWithSource<HAreaStep, SourceOf<Source>>
  harea_step<Source extends GlyphSource = ColumnDataSource>(
    x1: HAreaStepArgs["x1"],
    x2: HAreaStepArgs["x2"],
    y: HAreaStepArgs["y"],
    step_mode: HAreaStepArgs["step_mode"],
    args?: GlyphOptions<HAreaStepArgs, Source>): GlyphRendererWithSource<HAreaStep, SourceOf<Source>>
  harea_step(...args: unknown[]): GlyphRenderer<HAreaStep> {
    return this._glyph(HAreaStep, "harea_step", ["x1", "x2", "y", "step_mode"], args)
  }

  hbar(): GlyphRendererWithSource<HBar, ColumnDataSource>
  hbar<Source extends GlyphSource = ColumnDataSource>(args: GlyphOptions<HBarArgs, Source>): GlyphRendererWithSource<HBar, SourceOf<Source>>
  hbar<Source extends GlyphSource = ColumnDataSource>(
    y: HBarArgs["y"],
    height: HBarArgs["height"],
    right: HBarArgs["right"],
    left: HBarArgs["left"],
    args?: GlyphOptions<HBarArgs, Source>): GlyphRendererWithSource<HBar, SourceOf<Source>>
  hbar(...args: unknown[]): GlyphRenderer<HBar> {
    return this._glyph(HBar, "hbar", ["y", "height", "right", "left"], args)
  }

  hspan(): GlyphRendererWithSource<HSpan, ColumnDataSource>
  hspan<Source extends GlyphSource = ColumnDataSource>(args: GlyphOptions<HSpanArgs, Source>): GlyphRendererWithSource<HSpan, SourceOf<Source>>
  hspan<Source extends GlyphSource = ColumnDataSource>(
    y: HSpanArgs["y"],
    args?: GlyphOptions<HSpanArgs, Source>): GlyphRendererWithSource<HSpan, SourceOf<Source>>
  hspan(...args: unknown[]): GlyphRenderer<HSpan> {
    return this._glyph(HSpan, "hspan", ["y"], args)
  }

  hstrip(): GlyphRendererWithSource<HStrip, ColumnDataSource>
  hstrip<Source extends GlyphSource = ColumnDataSource>(args: GlyphOptions<HStripArgs, Source>): GlyphRendererWithSource<HStrip, SourceOf<Source>>
  hstrip<Source extends GlyphSource = ColumnDataSource>(
    y0: HStripArgs["y0"],
    y1: HStripArgs["y1"],
    args?: GlyphOptions<HStripArgs, Source>): GlyphRendererWithSource<HStrip, SourceOf<Source>>
  hstrip(...args: unknown[]): GlyphRenderer<HStrip> {
    return this._glyph(HStrip, "hstrip", ["y0", "y1"], args)
  }

  hex_tile(): GlyphRendererWithSource<HexTile, ColumnDataSource>
  hex_tile<Source extends GlyphSource = ColumnDataSource>(args: GlyphOptions<HexTileArgs, Source>): GlyphRendererWithSource<HexTile, SourceOf<Source>>
  hex_tile<Source extends GlyphSource = ColumnDataSource>(
    q: HexTileArgs["q"],
    r: HexTileArgs["r"],
    args?: GlyphOptions<HexTileArgs, Source>): GlyphRendererWithSource<HexTile, SourceOf<Source>>
  hex_tile(...args: unknown[]): GlyphRenderer<HexTile> {
    return this._glyph(HexTile, "hex_tile", ["q", "r"], args)
  }

  image(): GlyphRendererWithSource<Image, ColumnDataSource>
  image<Source extends GlyphSource = ColumnDataSource>(args: GlyphOptions<ImageArgs, Source>): GlyphRendererWithSource<Image, SourceOf<Source>>
  image<Source extends GlyphSource = ColumnDataSource>(
    image: ImageArgs["image"],
    x: ImageArgs["x"],
    y: ImageArgs["y"],
    dw: ImageArgs["dw"],
    dh: ImageArgs["dh"],
    args?: GlyphOptions<ImageArgs, Source>): GlyphRendererWithSource<Image, SourceOf<Source>>
  image(...args: unknown[]): GlyphRenderer<Image> {
    return this._glyph(Image, "image", ["color_mapper", "image", "x", "y", "dw", "dh"], args)
  }

  image_stack(): GlyphRendererWithSource<ImageStack, ColumnDataSource>
  image_stack<Source extends GlyphSource = ColumnDataSource>(args: GlyphOptions<ImageStackArgs, Source>): GlyphRendererWithSource<ImageStack, SourceOf<Source>>
  image_stack<Source extends GlyphSource = ColumnDataSource>(
    image: ImageStackArgs["image"],
    x: ImageStackArgs["x"],
    y: ImageStackArgs["y"],
    dw: ImageStackArgs["dw"],
    dh: ImageStackArgs["dh"],
    args?: GlyphOptions<ImageStackArgs, Source>): GlyphRendererWithSource<ImageStack, SourceOf<Source>>
  image_stack(...args: unknown[]): GlyphRenderer<ImageStack> {
    return this._glyph(ImageStack, "image_stack", ["color_mapper", "image", "x", "y", "dw", "dh"], args)
  }

  image_rgba(): GlyphRendererWithSource<ImageRGBA, ColumnDataSource>
  image_rgba<Source extends GlyphSource = ColumnDataSource>(args: GlyphOptions<ImageRGBAArgs, Source>): GlyphRendererWithSource<ImageRGBA, SourceOf<Source>>
  image_rgba<Source extends GlyphSource = ColumnDataSource>(
    image: ImageRGBAArgs["image"],
    x: ImageRGBAArgs["x"],
    y: ImageRGBAArgs["y"],
    dw: ImageRGBAArgs["dw"],
    dh: ImageRGBAArgs["dh"],
    args?: GlyphOptions<ImageRGBAArgs, Source>): GlyphRendererWithSource<ImageRGBA, SourceOf<Source>>
  image_rgba(...args: unknown[]): GlyphRenderer<ImageRGBA> {
    return this._glyph(ImageRGBA, "image_rgba", ["image", "x", "y", "dw", "dh"], args)
  }

  image_url(): GlyphRendererWithSource<ImageURL, ColumnDataSource>
  image_url<Source extends GlyphSource = ColumnDataSource>(args: GlyphOptions<ImageURLArgs, Source>): GlyphRendererWithSource<ImageURL, SourceOf<Source>>
  image_url<Source extends GlyphSource = ColumnDataSource>(
    url: ImageURLArgs["url"],
    x: ImageURLArgs["x"],
    y: ImageURLArgs["y"],
    w: ImageURLArgs["w"],
    h: ImageURLArgs["h"],
    args?: GlyphOptions<ImageURLArgs, Source>): GlyphRendererWithSource<ImageURL, SourceOf<Source>>
  image_url(...args: unknown[]): GlyphRenderer<ImageURL> {
    return this._glyph(ImageURL, "image_url", ["url", "x", "y", "w", "h"], args)
  }

  line(): GlyphRendererWithSource<Line, ColumnDataSource>
  line<Source extends GlyphSource = ColumnDataSource>(args: GlyphOptions<LineArgs, Source>): GlyphRendererWithSource<Line, SourceOf<Source>>
  line<Source extends GlyphSource = ColumnDataSource>(
    x: LineArgs["x"],
    y: LineArgs["y"],
    args?: GlyphOptions<LineArgs, Source>): GlyphRendererWithSource<Line, SourceOf<Source>>
  line(...args: unknown[]): GlyphRenderer<Line> {
    return this._glyph(Line, "line", ["x", "y"], args)
  }

  mathml(): GlyphRendererWithSource<MathML, ColumnDataSource>
  mathml<Source extends GlyphSource = ColumnDataSource>(args: GlyphOptions<MathMLArgs, Source>): GlyphRendererWithSource<MathML, SourceOf<Source>>
  mathml<Source extends GlyphSource = ColumnDataSource>(
    x: MathMLArgs["x"],
    y: MathMLArgs["y"],
    text: MathMLArgs["text"],
    args?: GlyphOptions<MathMLArgs, Source>): GlyphRendererWithSource<MathML, SourceOf<Source>>
  mathml(...args: unknown[]): GlyphRenderer<MathML> {
    return this._glyph(MathML, "mathml", ["x", "y", "text"], args)
  }

  multi_line(): GlyphRendererWithSource<MultiLine, ColumnDataSource>
  multi_line<Source extends GlyphSource = ColumnDataSource>(args: GlyphOptions<MultiLineArgs, Source>): GlyphRendererWithSource<MultiLine, SourceOf<Source>>
  multi_line<Source extends GlyphSource = ColumnDataSource>(
    xs: MultiLineArgs["xs"],
    ys: MultiLineArgs["ys"],
    args?: GlyphOptions<MultiLineArgs, Source>): GlyphRendererWithSource<MultiLine, SourceOf<Source>>
  multi_line(...args: unknown[]): GlyphRenderer<MultiLine> {
    return this._glyph(MultiLine, "multi_line", ["xs", "ys"], args)
  }

  multi_polygons(): GlyphRendererWithSource<MultiPolygons, ColumnDataSource>
  multi_polygons<Source extends GlyphSource = ColumnDataSource>(args: GlyphOptions<MultiPolygonsArgs, Source>): GlyphRendererWithSource<MultiPolygons, SourceOf<Source>>
  multi_polygons<Source extends GlyphSource = ColumnDataSource>(
    xs: MultiPolygonsArgs["xs"],
    ys: MultiPolygonsArgs["ys"],
    args?: GlyphOptions<MultiPolygonsArgs, Source>): GlyphRendererWithSource<MultiPolygons, SourceOf<Source>>
  multi_polygons(...args: unknown[]): GlyphRenderer<MultiPolygons> {
    return this._glyph(MultiPolygons, "multi_polygons", ["xs", "ys"], args)
  }

  ngon(): GlyphRendererWithSource<Ngon, ColumnDataSource>
  ngon<Source extends GlyphSource = ColumnDataSource>(args: GlyphOptions<NgonArgs, Source>): GlyphRendererWithSource<Ngon, SourceOf<Source>>
  ngon<Source extends GlyphSource = ColumnDataSource>(
    x: NgonArgs["x"],
    y: NgonArgs["y"],
    radius: NgonArgs["radius"],
    args?: GlyphOptions<NgonArgs, Source>): GlyphRendererWithSource<Ngon, SourceOf<Source>>
  ngon(...args: unknown[]): GlyphRenderer<Ngon> {
    return this._glyph(Ngon, "ngon", ["x", "y", "radius"], args)
  }

  patch(): GlyphRendererWithSource<Patch, ColumnDataSource>
  patch<Source extends GlyphSource = ColumnDataSource>(args: GlyphOptions<PatchArgs, Source>): GlyphRendererWithSource<Patch, SourceOf<Source>>
  patch<Source extends GlyphSource = ColumnDataSource>(
    x: PatchArgs["x"],
    y: PatchArgs["y"],
    args?: GlyphOptions<PatchArgs, Source>): GlyphRendererWithSource<Patch, SourceOf<Source>>
  patch(...args: unknown[]): GlyphRenderer<Patch> {
    return this._glyph(Patch, "patch", ["x", "y"], args)
  }

  patches(): GlyphRendererWithSource<Patches, ColumnDataSource>
  patches<Source extends GlyphSource = ColumnDataSource>(args: GlyphOptions<PatchesArgs, Source>): GlyphRendererWithSource<Patches, SourceOf<Source>>
  patches<Source extends GlyphSource = ColumnDataSource>(
    xs: PatchesArgs["xs"],
    ys: PatchesArgs["ys"],
    args?: GlyphOptions<PatchesArgs, Source>): GlyphRendererWithSource<Patches, SourceOf<Source>>
  patches(...args: unknown[]): GlyphRenderer<Patches> {
    return this._glyph(Patches, "patches", ["xs", "ys"], args)
  }

  quad(): GlyphRendererWithSource<Quad, ColumnDataSource>
  quad<Source extends GlyphSource = ColumnDataSource>(args: GlyphOptions<QuadArgs, Source>): GlyphRendererWithSource<Quad, SourceOf<Source>>
  quad<Source extends GlyphSource = ColumnDataSource>(
    left: QuadArgs["left"],
    right: QuadArgs["right"],
    bottom: QuadArgs["bottom"],
    top: QuadArgs["top"],
    args?: GlyphOptions<QuadArgs, Source>): GlyphRendererWithSource<Quad, SourceOf<Source>>
  quad(...args: unknown[]): GlyphRenderer<Quad> {
    return this._glyph(Quad, "quad", ["left", "right", "bottom", "top"], args)
  }

  quadratic(): GlyphRendererWithSource<Quadratic, ColumnDataSource>
  quadratic<Source extends GlyphSource = ColumnDataSource>(args: GlyphOptions<QuadraticArgs, Source>): GlyphRendererWithSource<Quadratic, SourceOf<Source>>
  quadratic<Source extends GlyphSource = ColumnDataSource>(
    x0: QuadraticArgs["x0"],
    y0: QuadraticArgs["y0"],
    x1: QuadraticArgs["x1"],
    y1: QuadraticArgs["y1"],
    cx: QuadraticArgs["cx"],
    cy: QuadraticArgs["cy"],
    args?: GlyphOptions<QuadraticArgs, Source>): GlyphRendererWithSource<Quadratic, SourceOf<Source>>
  quadratic(...args: unknown[]): GlyphRenderer<Quadratic> {
    return this._glyph(Quadratic, "quadratic", ["x0", "y0", "x1", "y1", "cx", "cy"], args)
  }

  ray(): GlyphRendererWithSource<Ray, ColumnDataSource>
  ray<Source extends GlyphSource = ColumnDataSource>(args: GlyphOptions<RayArgs, Source>): GlyphRendererWithSource<Ray, SourceOf<Source>>
  ray<Source extends GlyphSource = ColumnDataSource>(
    x: RayArgs["x"],
    y: RayArgs["y"],
    length: RayArgs["length"],
    args?: GlyphOptions<RayArgs, Source>): GlyphRendererWithSource<Ray, SourceOf<Source>>
  ray(...args: unknown[]): GlyphRenderer<Ray> {
    return this._glyph(Ray, "ray", ["x", "y", "length"], args)
  }

  rect(): GlyphRendererWithSource<Rect, ColumnDataSource>
  rect<Source extends GlyphSource = ColumnDataSource>(args: GlyphOptions<RectArgs, Source>): GlyphRendererWithSource<Rect, SourceOf<Source>>
  rect<Source extends GlyphSource = ColumnDataSource>(
    x: RectArgs["x"],
    y: RectArgs["y"],
    width: RectArgs["width"],
    height: RectArgs["height"],
    args?: GlyphOptions<RectArgs, Source>): GlyphRendererWithSource<Rect, SourceOf<Source>>
  rect(...args: unknown[]): GlyphRenderer<Rect> {
    return this._glyph(Rect, "rect", ["x", "y", "width", "height"], args)
  }

  segment(): GlyphRendererWithSource<Segment, ColumnDataSource>
  segment<Source extends GlyphSource = ColumnDataSource>(args: GlyphOptions<SegmentArgs, Source>): GlyphRendererWithSource<Segment, SourceOf<Source>>
  segment<Source extends GlyphSource = ColumnDataSource>(
    x0: SegmentArgs["x0"],
    y0: SegmentArgs["y0"],
    x1: SegmentArgs["x1"],
    y1: SegmentArgs["y1"],
    args?: GlyphOptions<SegmentArgs, Source>): GlyphRendererWithSource<Segment, SourceOf<Source>>
  segment(...args: unknown[]): GlyphRenderer<Segment> {
    return this._glyph(Segment, "segment", ["x0", "y0", "x1", "y1"], args)
  }

  spline(): GlyphRendererWithSource<Spline, ColumnDataSource>
  spline<Source extends GlyphSource = ColumnDataSource>(args: GlyphOptions<SplineArgs, Source>): GlyphRendererWithSource<Spline, SourceOf<Source>>
  spline<Source extends GlyphSource = ColumnDataSource>(
    x: SplineArgs["x"],
    y: SplineArgs["y"],
    args?: GlyphOptions<SplineArgs, Source>): GlyphRendererWithSource<Spline, SourceOf<Source>>
  spline(...args: unknown[]): GlyphRenderer<Spline> {
    return this._glyph(Spline, "spline", ["x", "y"], args)
  }

  step(): GlyphRendererWithSource<Step, ColumnDataSource>
  step<Source extends GlyphSource = ColumnDataSource>(args: GlyphOptions<StepArgs, Source>): GlyphRendererWithSource<Step, SourceOf<Source>>
  step<Source extends GlyphSource = ColumnDataSource>(
    x: StepArgs["x"],
    y: StepArgs["y"],
    mode: StepArgs["mode"],
    args?: GlyphOptions<StepArgs, Source>): GlyphRendererWithSource<Step, SourceOf<Source>>
  step(...args: unknown[]): GlyphRenderer<Step> {
    return this._glyph(Step, "step", ["x", "y", "mode"], args)
  }

  tex(): GlyphRendererWithSource<TeX, ColumnDataSource>
  tex<Source extends GlyphSource = ColumnDataSource>(args: GlyphOptions<TeXArgs, Source>): GlyphRendererWithSource<TeX, SourceOf<Source>>
  tex<Source extends GlyphSource = ColumnDataSource>(
    x: TeXArgs["x"],
    y: TeXArgs["y"],
    text: TeXArgs["text"],
    args?: GlyphOptions<TeXArgs, Source>): GlyphRendererWithSource<TeX, SourceOf<Source>>
  tex(...args: unknown[]): GlyphRenderer<TeX> {
    return this._glyph(TeX, "tex", ["x", "y", "text"], args)
  }

  text(): GlyphRendererWithSource<Text, ColumnDataSource>
  text<Source extends GlyphSource = ColumnDataSource>(args: GlyphOptions<TextArgs, Source>): GlyphRendererWithSource<Text, SourceOf<Source>>
  text<Source extends GlyphSource = ColumnDataSource>(
    x: TextArgs["x"],
    y: TextArgs["y"],
    text: TextArgs["text"],
    args?: GlyphOptions<TextArgs, Source>): GlyphRendererWithSource<Text, SourceOf<Source>>
  text(...args: unknown[]): GlyphRenderer<Text> {
    return this._glyph(Text, "text", ["x", "y", "text"], args)
  }

  varea(): GlyphRendererWithSource<VArea, ColumnDataSource>
  varea<Source extends GlyphSource = ColumnDataSource>(args: GlyphOptions<VAreaArgs, Source>): GlyphRendererWithSource<VArea, SourceOf<Source>>
  varea<Source extends GlyphSource = ColumnDataSource>(
    x: VAreaArgs["x"],
    y1: VAreaArgs["y1"],
    y2: VAreaArgs["y2"],
    args?: GlyphOptions<VAreaArgs, Source>): GlyphRendererWithSource<VArea, SourceOf<Source>>
  varea(...args: unknown[]): GlyphRenderer<VArea> {
    return this._glyph(VArea, "varea", ["x", "y1", "y2"], args)
  }

  varea_step(): GlyphRendererWithSource<VAreaStep, ColumnDataSource>
  varea_step<Source extends GlyphSource = ColumnDataSource>(args: GlyphOptions<VAreaStepArgs, Source>): GlyphRendererWithSource<VAreaStep, SourceOf<Source>>
  varea_step<Source extends GlyphSource = ColumnDataSource>(
    x: VAreaStepArgs["x"],
    y1: VAreaStepArgs["y1"],
    y2: VAreaStepArgs["y2"],
    step_mode: VAreaStepArgs["step_mode"],
    args?: GlyphOptions<VAreaStepArgs, Source>): GlyphRendererWithSource<VAreaStep, SourceOf<Source>>
  varea_step(...args: unknown[]): GlyphRenderer<VAreaStep> {
    return this._glyph(VAreaStep, "varea_step", ["x", "y1", "y2", "step_mode"], args)
  }

  vbar(): GlyphRendererWithSource<VBar, ColumnDataSource>
  vbar<Source extends GlyphSource = ColumnDataSource>(args: GlyphOptions<VBarArgs, Source>): GlyphRendererWithSource<VBar, SourceOf<Source>>
  vbar<Source extends GlyphSource = ColumnDataSource>(
    x: VBarArgs["x"],
    width: VBarArgs["width"],
    top: VBarArgs["top"],
    bottom: VBarArgs["bottom"],
    args?: GlyphOptions<VBarArgs, Source>): GlyphRendererWithSource<VBar, SourceOf<Source>>
  vbar(...args: unknown[]): GlyphRenderer<VBar> {
    return this._glyph(VBar, "vbar", ["x", "width", "top", "bottom"], args)
  }

  vspan(): GlyphRendererWithSource<VSpan, ColumnDataSource>
  vspan<Source extends GlyphSource = ColumnDataSource>(args: GlyphOptions<VSpanArgs, Source>): GlyphRendererWithSource<VSpan, SourceOf<Source>>
  vspan<Source extends GlyphSource = ColumnDataSource>(
    x: VSpanArgs["x"],
    args?: GlyphOptions<VSpanArgs, Source>): GlyphRendererWithSource<VSpan, SourceOf<Source>>
  vspan(...args: unknown[]): GlyphRenderer<VSpan> {
    return this._glyph(VSpan, "vspan", ["x"], args)
  }

  vstrip(): GlyphRendererWithSource<VStrip, ColumnDataSource>
  vstrip<Source extends GlyphSource = ColumnDataSource>(args: GlyphOptions<VStripArgs, Source>): GlyphRendererWithSource<VStrip, SourceOf<Source>>
  vstrip<Source extends GlyphSource = ColumnDataSource>(
    x0: VStripArgs["x0"],
    x1: VStripArgs["x1"],
    args?: GlyphOptions<VStripArgs, Source>): GlyphRendererWithSource<VStrip, SourceOf<Source>>
  vstrip(...args: unknown[]): GlyphRenderer<VStrip> {
    return this._glyph(VStrip, "vstrip", ["x0", "x1"], args)
  }

  wedge(): GlyphRendererWithSource<Wedge, ColumnDataSource>
  wedge<Source extends GlyphSource = ColumnDataSource>(args: GlyphOptions<WedgeArgs, Source>): GlyphRendererWithSource<Wedge, SourceOf<Source>>
  wedge<Source extends GlyphSource = ColumnDataSource>(
    x: WedgeArgs["x"],
    y: WedgeArgs["y"],
    radius: WedgeArgs["radius"],
    start_angle: WedgeArgs["start_angle"],
    end_angle: WedgeArgs["end_angle"],
    args?: GlyphOptions<WedgeArgs, Source>): GlyphRendererWithSource<Wedge, SourceOf<Source>>
  wedge(...args: unknown[]): GlyphRenderer<Wedge> {
    return this._glyph(Wedge, "wedge", ["x", "y", "radius", "start_angle", "end_angle"], args)
  }

  private _scatter(args: unknown[], marker?: MarkerType): GlyphRenderer<Scatter> {
    return this._glyph(Scatter, marker ?? "scatter", ["x", "y"], args, marker != null ? {marker} : undefined)
  }

  scatter(): GlyphRendererWithSource<Scatter, ColumnDataSource>
  scatter<Source extends GlyphSource = ColumnDataSource>(args: GlyphOptions<ScatterArgs, Source>): GlyphRendererWithSource<Scatter, SourceOf<Source>>
  scatter<Source extends GlyphSource = ColumnDataSource>(x: MarkerArgs["x"], y: MarkerArgs["y"], args?: GlyphOptions<ScatterArgs, Source>): GlyphRendererWithSource<Scatter, SourceOf<Source>>
  scatter(...args: unknown[]): GlyphRenderer<Scatter> {
    return this._scatter(args)
  }

  /** @deprecated */ asterisk(): GlyphRendererWithSource<Scatter, ColumnDataSource>
  /** @deprecated */ asterisk<Source extends GlyphSource = ColumnDataSource>(args: GlyphOptions<MarkerArgs, Source>): GlyphRendererWithSource<Scatter, SourceOf<Source>>
  /** @deprecated */ asterisk<Source extends GlyphSource = ColumnDataSource>(x: MarkerArgs["x"], y: MarkerArgs["y"], args?: GlyphOptions<MarkerArgs, Source>): GlyphRendererWithSource<Scatter, SourceOf<Source>>
  /** @deprecated */ asterisk(...args: unknown[]): GlyphRenderer<Scatter> {
    return this._scatter(args, "asterisk")
  }

  /** @deprecated */ circle_cross(): GlyphRendererWithSource<Scatter, ColumnDataSource>
  /** @deprecated */ circle_cross<Source extends GlyphSource = ColumnDataSource>(args: GlyphOptions<MarkerArgs, Source>): GlyphRendererWithSource<Scatter, SourceOf<Source>>
  /** @deprecated */ circle_cross<Source extends GlyphSource = ColumnDataSource>(x: MarkerArgs["x"], y: MarkerArgs["y"], args?: GlyphOptions<MarkerArgs, Source>): GlyphRendererWithSource<Scatter, SourceOf<Source>>
  /** @deprecated */ circle_cross(...args: unknown[]): GlyphRenderer<Scatter> {
    return this._scatter(args, "circle_cross")
  }

  /** @deprecated */ circle_dot(): GlyphRendererWithSource<Scatter, ColumnDataSource>
  /** @deprecated */ circle_dot<Source extends GlyphSource = ColumnDataSource>(args: GlyphOptions<MarkerArgs, Source>): GlyphRendererWithSource<Scatter, SourceOf<Source>>
  /** @deprecated */ circle_dot<Source extends GlyphSource = ColumnDataSource>(x: MarkerArgs["x"], y: MarkerArgs["y"], args?: GlyphOptions<MarkerArgs, Source>): GlyphRendererWithSource<Scatter, SourceOf<Source>>
  /** @deprecated */ circle_dot(...args: unknown[]): GlyphRenderer<Scatter> {
    return this._scatter(args, "circle_dot")
  }

  /** @deprecated */ circle_x(): GlyphRendererWithSource<Scatter, ColumnDataSource>
  /** @deprecated */ circle_x<Source extends GlyphSource = ColumnDataSource>(args: GlyphOptions<MarkerArgs, Source>): GlyphRendererWithSource<Scatter, SourceOf<Source>>
  /** @deprecated */ circle_x<Source extends GlyphSource = ColumnDataSource>(x: MarkerArgs["x"], y: MarkerArgs["y"], args?: GlyphOptions<MarkerArgs, Source>): GlyphRendererWithSource<Scatter, SourceOf<Source>>
  /** @deprecated */ circle_x(...args: unknown[]): GlyphRenderer<Scatter> {
    return this._scatter(args, "circle_x")
  }

  /** @deprecated */ circle_y(): GlyphRendererWithSource<Scatter, ColumnDataSource>
  /** @deprecated */ circle_y<Source extends GlyphSource = ColumnDataSource>(args: GlyphOptions<MarkerArgs, Source>): GlyphRendererWithSource<Scatter, SourceOf<Source>>
  /** @deprecated */ circle_y<Source extends GlyphSource = ColumnDataSource>(x: MarkerArgs["x"], y: MarkerArgs["y"], args?: GlyphOptions<MarkerArgs, Source>): GlyphRendererWithSource<Scatter, SourceOf<Source>>
  /** @deprecated */ circle_y(...args: unknown[]): GlyphRenderer<Scatter> {
    return this._scatter(args, "circle_y")
  }

  /** @deprecated */ cross(): GlyphRendererWithSource<Scatter, ColumnDataSource>
  /** @deprecated */ cross<Source extends GlyphSource = ColumnDataSource>(args: GlyphOptions<MarkerArgs, Source>): GlyphRendererWithSource<Scatter, SourceOf<Source>>
  /** @deprecated */ cross<Source extends GlyphSource = ColumnDataSource>(x: MarkerArgs["x"], y: MarkerArgs["y"], args?: GlyphOptions<MarkerArgs, Source>): GlyphRendererWithSource<Scatter, SourceOf<Source>>
  /** @deprecated */ cross(...args: unknown[]): GlyphRenderer<Scatter> {
    return this._scatter(args, "cross")
  }

  /** @deprecated */ dash(): GlyphRendererWithSource<Scatter, ColumnDataSource>
  /** @deprecated */ dash<Source extends GlyphSource = ColumnDataSource>(args: GlyphOptions<MarkerArgs, Source>): GlyphRendererWithSource<Scatter, SourceOf<Source>>
  /** @deprecated */ dash<Source extends GlyphSource = ColumnDataSource>(x: MarkerArgs["x"], y: MarkerArgs["y"], args?: GlyphOptions<MarkerArgs, Source>): GlyphRendererWithSource<Scatter, SourceOf<Source>>
  /** @deprecated */ dash(...args: unknown[]): GlyphRenderer<Scatter> {
    return this._scatter(args, "dash")
  }

  /** @deprecated */ diamond(): GlyphRendererWithSource<Scatter, ColumnDataSource>
  /** @deprecated */ diamond<Source extends GlyphSource = ColumnDataSource>(args: GlyphOptions<MarkerArgs, Source>): GlyphRendererWithSource<Scatter, SourceOf<Source>>
  /** @deprecated */ diamond<Source extends GlyphSource = ColumnDataSource>(x: MarkerArgs["x"], y: MarkerArgs["y"], args?: GlyphOptions<MarkerArgs, Source>): GlyphRendererWithSource<Scatter, SourceOf<Source>>
  /** @deprecated */ diamond(...args: unknown[]): GlyphRenderer<Scatter> {
    return this._scatter(args, "diamond")
  }

  /** @deprecated */ diamond_cross(): GlyphRendererWithSource<Scatter, ColumnDataSource>
  /** @deprecated */ diamond_cross<Source extends GlyphSource = ColumnDataSource>(args: GlyphOptions<MarkerArgs, Source>): GlyphRendererWithSource<Scatter, SourceOf<Source>>
  /** @deprecated */ diamond_cross<Source extends GlyphSource = ColumnDataSource>(x: MarkerArgs["x"], y: MarkerArgs["y"], args?: GlyphOptions<MarkerArgs, Source>): GlyphRendererWithSource<Scatter, SourceOf<Source>>
  /** @deprecated */ diamond_cross(...args: unknown[]): GlyphRenderer<Scatter> {
    return this._scatter(args, "diamond_cross")
  }

  /** @deprecated */ diamond_dot(): GlyphRendererWithSource<Scatter, ColumnDataSource>
  /** @deprecated */ diamond_dot<Source extends GlyphSource = ColumnDataSource>(args: GlyphOptions<MarkerArgs, Source>): GlyphRendererWithSource<Scatter, SourceOf<Source>>
  /** @deprecated */ diamond_dot<Source extends GlyphSource = ColumnDataSource>(x: MarkerArgs["x"], y: MarkerArgs["y"], args?: GlyphOptions<MarkerArgs, Source>): GlyphRendererWithSource<Scatter, SourceOf<Source>>
  /** @deprecated */ diamond_dot(...args: unknown[]): GlyphRenderer<Scatter> {
    return this._scatter(args, "diamond_dot")
  }

  /** @deprecated */ dot(): GlyphRendererWithSource<Scatter, ColumnDataSource>
  /** @deprecated */ dot<Source extends GlyphSource = ColumnDataSource>(args: GlyphOptions<MarkerArgs, Source>): GlyphRendererWithSource<Scatter, SourceOf<Source>>
  /** @deprecated */ dot<Source extends GlyphSource = ColumnDataSource>(x: MarkerArgs["x"], y: MarkerArgs["y"], args?: GlyphOptions<MarkerArgs, Source>): GlyphRendererWithSource<Scatter, SourceOf<Source>>
  /** @deprecated */ dot(...args: unknown[]): GlyphRenderer<Scatter> {
    return this._scatter(args, "dot")
  }

  /** @deprecated */ hex(): GlyphRendererWithSource<Scatter, ColumnDataSource>
  /** @deprecated */ hex<Source extends GlyphSource = ColumnDataSource>(args: GlyphOptions<MarkerArgs, Source>): GlyphRendererWithSource<Scatter, SourceOf<Source>>
  /** @deprecated */ hex<Source extends GlyphSource = ColumnDataSource>(x: MarkerArgs["x"], y: MarkerArgs["y"], args?: GlyphOptions<MarkerArgs, Source>): GlyphRendererWithSource<Scatter, SourceOf<Source>>
  /** @deprecated */ hex(...args: unknown[]): GlyphRenderer<Scatter> {
    return this._scatter(args, "hex")
  }

  /** @deprecated */ hex_dot(): GlyphRendererWithSource<Scatter, ColumnDataSource>
  /** @deprecated */ hex_dot<Source extends GlyphSource = ColumnDataSource>(args: GlyphOptions<MarkerArgs, Source>): GlyphRendererWithSource<Scatter, SourceOf<Source>>
  /** @deprecated */ hex_dot<Source extends GlyphSource = ColumnDataSource>(x: MarkerArgs["x"], y: MarkerArgs["y"], args?: GlyphOptions<MarkerArgs, Source>): GlyphRendererWithSource<Scatter, SourceOf<Source>>
  /** @deprecated */ hex_dot(...args: unknown[]): GlyphRenderer<Scatter> {
    return this._scatter(args, "hex_dot")
  }

  /** @deprecated */ inverted_triangle(): GlyphRendererWithSource<Scatter, ColumnDataSource>
  /** @deprecated */ inverted_triangle<Source extends GlyphSource = ColumnDataSource>(args: GlyphOptions<MarkerArgs, Source>): GlyphRendererWithSource<Scatter, SourceOf<Source>>
  /** @deprecated */ inverted_triangle<Source extends GlyphSource = ColumnDataSource>(x: MarkerArgs["x"], y: MarkerArgs["y"], args?: GlyphOptions<MarkerArgs, Source>): GlyphRendererWithSource<Scatter, SourceOf<Source>>
  /** @deprecated */ inverted_triangle(...args: unknown[]): GlyphRenderer<Scatter> {
    return this._scatter(args, "inverted_triangle")
  }

  /** @deprecated */ plus(): GlyphRendererWithSource<Scatter, ColumnDataSource>
  /** @deprecated */ plus<Source extends GlyphSource = ColumnDataSource>(args: GlyphOptions<MarkerArgs, Source>): GlyphRendererWithSource<Scatter, SourceOf<Source>>
  /** @deprecated */ plus<Source extends GlyphSource = ColumnDataSource>(x: MarkerArgs["x"], y: MarkerArgs["y"], args?: GlyphOptions<MarkerArgs, Source>): GlyphRendererWithSource<Scatter, SourceOf<Source>>
  /** @deprecated */ plus(...args: unknown[]): GlyphRenderer<Scatter> {
    return this._scatter(args, "plus")
  }

  /** @deprecated */ square(): GlyphRendererWithSource<Scatter, ColumnDataSource>
  /** @deprecated */ square<Source extends GlyphSource = ColumnDataSource>(args: GlyphOptions<MarkerArgs, Source>): GlyphRendererWithSource<Scatter, SourceOf<Source>>
  /** @deprecated */ square<Source extends GlyphSource = ColumnDataSource>(x: MarkerArgs["x"], y: MarkerArgs["y"], args?: GlyphOptions<MarkerArgs, Source>): GlyphRendererWithSource<Scatter, SourceOf<Source>>
  /** @deprecated */ square(...args: unknown[]): GlyphRenderer<Scatter> {
    return this._scatter(args, "square")
  }

  /** @deprecated */ square_cross(): GlyphRendererWithSource<Scatter, ColumnDataSource>
  /** @deprecated */ square_cross<Source extends GlyphSource = ColumnDataSource>(args: GlyphOptions<MarkerArgs, Source>): GlyphRendererWithSource<Scatter, SourceOf<Source>>
  /** @deprecated */ square_cross<Source extends GlyphSource = ColumnDataSource>(x: MarkerArgs["x"], y: MarkerArgs["y"], args?: GlyphOptions<MarkerArgs, Source>): GlyphRendererWithSource<Scatter, SourceOf<Source>>
  /** @deprecated */ square_cross(...args: unknown[]): GlyphRenderer<Scatter> {
    return this._scatter(args, "square_cross")
  }

  /** @deprecated */ square_dot(): GlyphRendererWithSource<Scatter, ColumnDataSource>
  /** @deprecated */ square_dot<Source extends GlyphSource = ColumnDataSource>(args: GlyphOptions<MarkerArgs, Source>): GlyphRendererWithSource<Scatter, SourceOf<Source>>
  /** @deprecated */ square_dot<Source extends GlyphSource = ColumnDataSource>(x: MarkerArgs["x"], y: MarkerArgs["y"], args?: GlyphOptions<MarkerArgs, Source>): GlyphRendererWithSource<Scatter, SourceOf<Source>>
  /** @deprecated */ square_dot(...args: unknown[]): GlyphRenderer<Scatter> {
    return this._scatter(args, "square_dot")
  }

  /** @deprecated */ square_pin(): GlyphRendererWithSource<Scatter, ColumnDataSource>
  /** @deprecated */ square_pin<Source extends GlyphSource = ColumnDataSource>(args: GlyphOptions<MarkerArgs, Source>): GlyphRendererWithSource<Scatter, SourceOf<Source>>
  /** @deprecated */ square_pin<Source extends GlyphSource = ColumnDataSource>(x: MarkerArgs["x"], y: MarkerArgs["y"], args?: GlyphOptions<MarkerArgs, Source>): GlyphRendererWithSource<Scatter, SourceOf<Source>>
  /** @deprecated */ square_pin(...args: unknown[]): GlyphRenderer<Scatter> {
    return this._scatter(args, "square_pin")
  }

  /** @deprecated */ square_x(): GlyphRendererWithSource<Scatter, ColumnDataSource>
  /** @deprecated */ square_x<Source extends GlyphSource = ColumnDataSource>(args: GlyphOptions<MarkerArgs, Source>): GlyphRendererWithSource<Scatter, SourceOf<Source>>
  /** @deprecated */ square_x<Source extends GlyphSource = ColumnDataSource>(x: MarkerArgs["x"], y: MarkerArgs["y"], args?: GlyphOptions<MarkerArgs, Source>): GlyphRendererWithSource<Scatter, SourceOf<Source>>
  /** @deprecated */ square_x(...args: unknown[]): GlyphRenderer<Scatter> {
    return this._scatter(args, "square_x")
  }

  /** @deprecated */ star(): GlyphRendererWithSource<Scatter, ColumnDataSource>
  /** @deprecated */ star<Source extends GlyphSource = ColumnDataSource>(args: GlyphOptions<MarkerArgs, Source>): GlyphRendererWithSource<Scatter, SourceOf<Source>>
  /** @deprecated */ star<Source extends GlyphSource = ColumnDataSource>(x: MarkerArgs["x"], y: MarkerArgs["y"], args?: GlyphOptions<MarkerArgs, Source>): GlyphRendererWithSource<Scatter, SourceOf<Source>>
  /** @deprecated */ star(...args: unknown[]): GlyphRenderer<Scatter> {
    return this._scatter(args, "star")
  }

  /** @deprecated */ star_dot(): GlyphRendererWithSource<Scatter, ColumnDataSource>
  /** @deprecated */ star_dot<Source extends GlyphSource = ColumnDataSource>(args: GlyphOptions<MarkerArgs, Source>): GlyphRendererWithSource<Scatter, SourceOf<Source>>
  /** @deprecated */ star_dot<Source extends GlyphSource = ColumnDataSource>(x: MarkerArgs["x"], y: MarkerArgs["y"], args?: GlyphOptions<MarkerArgs, Source>): GlyphRendererWithSource<Scatter, SourceOf<Source>>
  /** @deprecated */ star_dot(...args: unknown[]): GlyphRenderer<Scatter> {
    return this._scatter(args, "star_dot")
  }

  /** @deprecated */ triangle(): GlyphRendererWithSource<Scatter, ColumnDataSource>
  /** @deprecated */ triangle<Source extends GlyphSource = ColumnDataSource>(args: GlyphOptions<MarkerArgs, Source>): GlyphRendererWithSource<Scatter, SourceOf<Source>>
  /** @deprecated */ triangle<Source extends GlyphSource = ColumnDataSource>(x: MarkerArgs["x"], y: MarkerArgs["y"], args?: GlyphOptions<MarkerArgs, Source>): GlyphRendererWithSource<Scatter, SourceOf<Source>>
  /** @deprecated */ triangle(...args: unknown[]): GlyphRenderer<Scatter> {
    return this._scatter(args, "triangle")
  }

  /** @deprecated */ triangle_dot(): GlyphRendererWithSource<Scatter, ColumnDataSource>
  /** @deprecated */ triangle_dot<Source extends GlyphSource = ColumnDataSource>(args: GlyphOptions<MarkerArgs, Source>): GlyphRendererWithSource<Scatter, SourceOf<Source>>
  /** @deprecated */ triangle_dot<Source extends GlyphSource = ColumnDataSource>(x: MarkerArgs["x"], y: MarkerArgs["y"], args?: GlyphOptions<MarkerArgs, Source>): GlyphRendererWithSource<Scatter, SourceOf<Source>>
  /** @deprecated */ triangle_dot(...args: unknown[]): GlyphRenderer<Scatter> {
    return this._scatter(args, "triangle_dot")
  }

  /** @deprecated */ triangle_pin(): GlyphRendererWithSource<Scatter, ColumnDataSource>
  /** @deprecated */ triangle_pin<Source extends GlyphSource = ColumnDataSource>(args: GlyphOptions<MarkerArgs, Source>): GlyphRendererWithSource<Scatter, SourceOf<Source>>
  /** @deprecated */ triangle_pin<Source extends GlyphSource = ColumnDataSource>(x: MarkerArgs["x"], y: MarkerArgs["y"], args?: GlyphOptions<MarkerArgs, Source>): GlyphRendererWithSource<Scatter, SourceOf<Source>>
  /** @deprecated */ triangle_pin(...args: unknown[]): GlyphRenderer<Scatter> {
    return this._scatter(args, "triangle_pin")
  }

  /** @deprecated */ x(): GlyphRendererWithSource<Scatter, ColumnDataSource>
  /** @deprecated */ x<Source extends GlyphSource = ColumnDataSource>(args: GlyphOptions<MarkerArgs, Source>): GlyphRendererWithSource<Scatter, SourceOf<Source>>
  /** @deprecated */ x<Source extends GlyphSource = ColumnDataSource>(x: MarkerArgs["x"], y: MarkerArgs["y"], args?: GlyphOptions<MarkerArgs, Source>): GlyphRendererWithSource<Scatter, SourceOf<Source>>
  /** @deprecated */ x(...args: unknown[]): GlyphRenderer<Scatter> {
    return this._scatter(args, "x")
  }

  /** @deprecated */ y(): GlyphRendererWithSource<Scatter, ColumnDataSource>
  /** @deprecated */ y<Source extends GlyphSource = ColumnDataSource>(args: GlyphOptions<MarkerArgs, Source>): GlyphRendererWithSource<Scatter, SourceOf<Source>>
  /** @deprecated */ y<Source extends GlyphSource = ColumnDataSource>(x: MarkerArgs["x"], y: MarkerArgs["y"], args?: GlyphOptions<MarkerArgs, Source>): GlyphRendererWithSource<Scatter, SourceOf<Source>>
  /** @deprecated */ y(...args: unknown[]): GlyphRenderer<Scatter> {
    return this._scatter(args, "y")
  }
}
