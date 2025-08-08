#-----------------------------------------------------------------------------
# Copyright (c) Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------

# Standard library imports
from typing import TypedDict, Unpack

# Bokeh imports
from .._specs import (
    AlphaArg,
    AngleArg,
    ColorArg,
    DashPatternArg,
    DistanceArg,
    FloatArg,
    FontSizeArg,
    FontStyleArg,
    HatchPatternArg,
    Image2dArg,
    Image3dArg,
    IntArg,
    LineCapArg,
    LineJoinArg,
    MarkerArg,
    NonNegative,
    NullDistanceArg,
    Number1dArg,
    Number3dArg,
    NumberArg,
    OutlineShapeNameArg,
    SizeArg,
    StringArg,
    TextAlignArg,
    TextAnchorArg,
    TextBaselineArg,
)
from .._types import Color
from ..core.enums import (
    AnchorType as Anchor,
    AngleUnitsType as AngleUnits,
    DirectionType as Direction,
    PaletteType as Palette,
    RadiusDimensionType as RadiusDimension,
    RenderLevelType as RendererLevel,
    SpatialUnitsType as SpatialUnits,
    StepModeType as StepMode,
    TeXDisplayType as TeXDisplay,
)
from ..core.property_aliases import (
    BorderRadiusType as BorderRadius,
    PaddingType as Padding,
)
from ..models import glyphs
from ..models.annotations import Legend
from ..models.callbacks import CustomJS
from ..models.coordinates import CoordinateMapping
from ..models.plots import Plot
from ..models.renderers import GlyphRenderer
from ..models.sources import CDSView, ColumnarDataSource, DataDictLike
from ..models.textures import Texture

class AuxVisuals(TypedDict, total=False):
    color: ColorArg
    alpha: AlphaArg

    selection_color: ColorArg
    selection_alpha: AlphaArg

    nonselection_color: ColorArg
    nonselection_alpha: AlphaArg

    hover_color: ColorArg
    hover_alpha: AlphaArg

    muted_color: ColorArg
    muted_alpha: AlphaArg

class AuxHatchVisuals(TypedDict, total=False):
    selection_hatch_color: ColorArg
    selection_hatch_alpha: AlphaArg

    nonselection_hatch_color: ColorArg
    nonselection_hatch_alpha: AlphaArg

    hover_hatch_color: ColorArg
    hover_hatch_alpha: AlphaArg

    muted_hatch_color: ColorArg
    muted_hatch_alpha: AlphaArg

class AuxFillVisuals(TypedDict, total=False):
    selection_fill_color: ColorArg
    selection_fill_alpha: AlphaArg

    nonselection_fill_color: ColorArg
    nonselection_fill_alpha: AlphaArg

    hover_fill_color: ColorArg
    hover_fill_alpha: AlphaArg

    muted_fill_color: ColorArg
    muted_fill_alpha: AlphaArg

class AuxImageVisuals(TypedDict, total=False):
    pass

class AuxLineVisuals(TypedDict, total=False):
    selection_line_color: ColorArg
    selection_line_alpha: AlphaArg

    nonselection_line_color: ColorArg
    nonselection_line_alpha: AlphaArg

    hover_line_color: ColorArg
    hover_line_alpha: AlphaArg

    muted_line_color: ColorArg
    muted_line_alpha: AlphaArg

class AuxTextVisuals(TypedDict, total=False):
    selection_text_color: ColorArg
    selection_text_alpha: AlphaArg

    nonselection_text_color: ColorArg
    nonselection_text_alpha: AlphaArg

    hover_text_color: ColorArg
    hover_text_alpha: AlphaArg

    muted_text_color: ColorArg
    muted_text_alpha: AlphaArg

class FillVisuals(AuxFillVisuals, total=False):
    fill_color: ColorArg
    fill_alpha: AlphaArg

class HatchVisuals(AuxHatchVisuals, total=False):
    hatch_color: ColorArg
    hatch_alpha: AlphaArg
    hatch_scale: FloatArg
    hatch_pattern: HatchPatternArg
    hatch_weight: FloatArg
    hatch_extra: dict[str, Texture]

class ImageVisuals(AuxImageVisuals, total=False):
    global_alpha: AlphaArg

class LineVisuals(AuxLineVisuals, total=False):
    line_color: ColorArg
    line_alpha: AlphaArg
    line_width: FloatArg
    line_join: LineJoinArg
    line_cap: LineCapArg
    line_dash: DashPatternArg
    line_dash_offset: IntArg

class TextVisuals(AuxTextVisuals, total=False):
    text_color: ColorArg
    text_outline_color: ColorArg
    text_alpha: AlphaArg
    text_font: StringArg
    text_font_size: FontSizeArg
    text_font_style: FontStyleArg
    text_align: TextAlignArg
    text_baseline: TextBaselineArg
    text_line_height: NumberArg

class AuxGlyphArgs(TypedDict, total=False):
    # Model
    name: str | None

    # Renderer
    coordinates: CoordinateMapping | None
    x_range_name: str
    y_range_name: str
    level: RendererLevel
    visible: bool

    # GlyphRenderer
    source: ColumnarDataSource | DataDictLike
    view: CDSView
    muted: bool

    legend: Legend
    legend_name: str
    legend_label: str
    legend_field: str
    legend_group: str

class GlyphArgs(AuxGlyphArgs, AuxVisuals, total=False):
    pass

class AnnularWedgeArgs(GlyphArgs, LineVisuals, FillVisuals, HatchVisuals, total=False):
    # x: NumberArg
    # y: NumberArg
    # inner_radius: DistanceArg
    inner_radius_units: SpatialUnits
    # outer_radius: DistanceArg
    outer_radius_units: SpatialUnits
    # start_angle: AngleArg
    start_angle_units: AngleUnits
    # end_angle: AngleArg
    end_angle_units: AngleUnits
    # direction: Direction

class AnnulusArgs(GlyphArgs, LineVisuals, FillVisuals, HatchVisuals, total=False):
    # x: NumberArg
    # y: NumberArg
    # inner_radius: DistanceArg
    inner_radius_units: SpatialUnits
    # outer_radius: DistanceArg
    outer_radius_units: SpatialUnits

class ArcArgs(GlyphArgs, LineVisuals, total=False):
    # x: NumberArg
    # y: NumberArg
    # radius: DistanceArg
    radius_units: SpatialUnits
    # start_angle: AngleArg
    start_angle_units: AngleUnits
    # end_angle: AngleArg
    end_angle_units: AngleUnits
    # direction: Direction

class BezierArgs(GlyphArgs, LineVisuals, total=False):
    # x0: NumberArg
    # y0: NumberArg
    # x1: NumberArg
    # y1: NumberArg
    # cx0: NumberArg
    # cy0: NumberArg
    # cx1: NumberArg
    # cy1: NumberArg
    pass

class BlockArgs(GlyphArgs, LineVisuals, FillVisuals, HatchVisuals, total=False):
    # x: NumberArg
    # y: NumberArg
    # width: DistanceArg
    width_units: SpatialUnits
    # height: DistanceArg
    height_units: SpatialUnits

class CircleArgs(GlyphArgs, LineVisuals, FillVisuals, HatchVisuals, total=False):
    # x: NumberArg
    # y: NumberArg
    # radius: DistanceArg
    radius_units: SpatialUnits
    radius_dimension: RadiusDimension
    hit_dilation: NonNegative[float]

class EllipseArgs(GlyphArgs, LineVisuals, FillVisuals, HatchVisuals, total=False):
    # x: NumberArg
    # y: NumberArg
    # width: DistanceArg
    width_units: SpatialUnits
    # height: DistanceArg
    height_units: SpatialUnits
    # angle: AngleArg
    angel_units: AngleUnits

class HAreaArgs(GlyphArgs, FillVisuals, HatchVisuals, total=False):
    # x1: NumberArg
    # x2: NumberArg
    # y: NumberArg
    pass

class HAreaStepArgs(GlyphArgs, FillVisuals, HatchVisuals, total=False):
    # x1: NumberArg
    # x2: NumberArg
    # y: NumberArg
    step_mode: StepMode

class HBarArgs(GlyphArgs, LineVisuals, FillVisuals, HatchVisuals, total=False):
    # y: NumberArg
    # height: DistanceArg
    height_units: SpatialUnits
    # left: NumberArg
    # right: NumberArg

class HSpanArgs(GlyphArgs, LineVisuals, total=False):
    # y: NumberArg
    pass

class HStripArgs(GlyphArgs, LineVisuals, FillVisuals, HatchVisuals, total=False):
    # y0: NumberArg
    # y1: NumberArg
    pass

class HexTileArgs(GlyphArgs, LineVisuals, FillVisuals, HatchVisuals, total=False):
    # r: NumberArg
    # q: NumberArg
    size: float
    aspect_scale: float
    scale: NumberArg
    orientation: str

class ImageArgs(GlyphArgs, total=False):
    # image: Image2dArg
    # x: NumberArg
    # y: NumberArg
    # dw: DistanceArg
    # dh: DistanceArg
    # dilate: bool
    palette: Palette | list[Color]

class ImageRGBAArgs(GlyphArgs, total=False):
    # image: Image2dArg
    # x: NumberArg
    # y: NumberArg
    # dw: DistanceArg
    # dh: DistanceArg
    # dilate: bool
    pass

class ImageStackArgs(GlyphArgs, total=False):
    # image: Image3dArg
    # x: NumberArg
    # y: NumberArg
    # dw: DistanceArg
    # dh: DistanceArg
    # dilate: bool
    pass

class ImageURLArgs(GlyphArgs, total=False):
    # url: StringArg
    # x: NumberArg
    # y: NumberArg
    # w: NullDistanceArg
    w_units: SpatialUnits
    # h: NullDistanceArg
    h_units: SpatialUnits
    # angle: AngleArg
    angle_units: AngleUnits
    global_alpha: NumberArg
    # dilate: bool
    anchor: Anchor
    retry_attempts: int
    retry_timeout: int

class LineArgs(GlyphArgs, LineVisuals, total=False):
    # x: NumberArg
    # y: NumberArg
    pass

class MarkerArgs(GlyphArgs, LineVisuals, FillVisuals, HatchVisuals, total=False):
    # x: NumberArg
    # y: NumberArg
    # size: SizeArg
    # angle: AngleArg
    hit_dilation: NonNegative[float]

class MathMLArgs(GlyphArgs, TextVisuals, total=False):
    pass

class MultiLineArgs(GlyphArgs, LineVisuals, total=False):
    # xs: Number1dArg
    # ys: Number1dArg
    pass

class MultiPolygonsArgs(GlyphArgs, LineVisuals, FillVisuals, HatchVisuals, total=False):
    # xs: Number3dArg
    # ys: Number3dArg
    pass

class NgonArgs(GlyphArgs, LineVisuals, FillVisuals, HatchVisuals, total=False):
    # x: NumberArg
    # y: NumberArg
    # radius: DistanceArg
    radius_units: SpatialUnits
    # angle: AngleArg
    angle_units: AngleUnits
    n: NumberArg
    radius_dimension: RadiusDimension

class PatchArgs(GlyphArgs, LineVisuals, FillVisuals, HatchVisuals, total=False):
    # x: NumberArg
    # y: NumberArg
    pass

class PatchesArgs(GlyphArgs, LineVisuals, FillVisuals, HatchVisuals, total=False):
    # xs: Number1dArg
    # ys: Number1dArg
    pass

class QuadArgs(GlyphArgs, LineVisuals, FillVisuals, HatchVisuals, total=False):
    # left: NumberArg
    # right: NumberArg
    # bottom: NumberArg
    # top: NumberArg
    pass

class QuadraticArgs(GlyphArgs, LineVisuals, total=False):
    # x0: NumberArg
    # y0: NumberArg
    # x1: NumberArg
    # y1: NumberArg
    # cx: NumberArg
    # cy: NumberArg
    pass

class RayArgs(GlyphArgs, LineVisuals, total=False):
    # x: NumberArg
    # y: NumberArg
    # length: DistanceArg
    length_units: SpatialUnits
    # angle: AngleArg
    angle_units: AngleUnits

class RectArgs(GlyphArgs, LineVisuals, FillVisuals, HatchVisuals, total=False):
    # x: NumberArg
    # y: NumberArg
    # width: DistanceArg
    width_units: SpatialUnits
    # height: DistanceArg
    height_units: SpatialUnits
    # angle: AngleArg
    angle_units: AngleUnits
    # dilate: bool
    border_radius: BorderRadius

class ScatterArgs(MarkerArgs, total=False):
    # marker: MarkerArg
    defs: dict[str, CustomJS]

class SegmentArgs(GlyphArgs, LineVisuals, total=False):
    # x0: NumberArg
    # y0: NumberArg
    # x1: NumberArg
    # y1: NumberArg
    pass

class StepArgs(GlyphArgs, LineVisuals, total=False):
    # x: NumberArg
    # y: NumberArg
    mode: StepMode

class TeXArgs(GlyphArgs, TextVisuals, total=False):
    macros: dict[str, str | tuple[str, int]]
    display: TeXDisplay

class TextArgs(GlyphArgs, TextVisuals, total=False):
    # x: NumberArg
    # y: NumberArg
    # text: StringArg
    # angle: AngleArg
    angle_units: AngleUnits
    # x_offset: FloatArg
    # y_offset: FloatArg
    anchor: TextAnchorArg
    padding: Padding
    border_radius: BorderRadius
    outline_shape: OutlineShapeNameArg

class VAreaArgs(GlyphArgs, FillVisuals, HatchVisuals, total=False):
    # x: NumberArg
    # y1: NumberArg
    # y2: NumberArg
    pass

class VAreaStepArgs(GlyphArgs, FillVisuals, HatchVisuals, total=False):
    # x: NumberArg
    # y1: NumberArg
    # y2: NumberArg
    step_mode: StepMode

class VBarArgs(GlyphArgs, LineVisuals, FillVisuals, HatchVisuals, total=False):
    # x: NumberArg
    # width: DistanceArg
    width_units: SpatialUnits
    # bottom: NumberArg
    # top: NumberArg

class VSpanArgs(GlyphArgs, LineVisuals, total=False):
    # x: NumberArg
    pass

class VStripArgs(GlyphArgs, LineVisuals, FillVisuals, HatchVisuals, total=False):
    # x0: NumberArg
    # x1: NumberArg
    pass

class WedgeArgs(GlyphArgs, LineVisuals, FillVisuals, HatchVisuals, total=False):
    # x: NumberArg
    # y: NumberArg
    # radius: DistanceArg
    radius_units: SpatialUnits
    # start_angle: AngleArg
    start_angle_units: AngleUnits
    # end_angle: AngleArg
    end_angle_units: AngleUnits
    # direction: Direction

class GlyphAPI:

    @property
    def plot(self) -> Plot | None: ...

    @property
    def coordinates(self) -> CoordinateMapping | None: ...

    def __init__(self, parent: Plot | None = None, coordinates: CoordinateMapping | None = None) -> None: ...

    def annular_wedge(self,
        x: NumberArg = ...,
        y: NumberArg = ...,
        inner_radius: DistanceArg = ...,
        outer_radius: DistanceArg = ...,
        start_angle: AngleArg = ...,
        end_angle: AngleArg = ...,
        direction: Direction = ...,
        **kwargs: Unpack[AnnularWedgeArgs],
    ) -> GlyphRenderer[glyphs.AnnularWedge]: ...

    def annulus(self,
        x: NumberArg = ...,
        y: NumberArg = ...,
        inner_radius: DistanceArg = ...,
        outer_radius: DistanceArg = ...,
        **kwargs: Unpack[AnnulusArgs],
    ) -> GlyphRenderer[glyphs.Annulus]: ...

    def arc(self,
        x: NumberArg = ...,
        y: NumberArg = ...,
        radius: DistanceArg = ...,
        start_angle: AngleArg = ...,
        end_angle: AngleArg = ...,
        direction: Direction = ...,
        **kwargs: Unpack[ArcArgs],
    ) -> GlyphRenderer[glyphs.Arc]: ...

    def bezier(self,
        x0: NumberArg = ...,
        y0: NumberArg = ...,
        x1: NumberArg = ...,
        y1: NumberArg = ...,
        cx0: NumberArg = ...,
        cy0: NumberArg = ...,
        cx1: NumberArg = ...,
        cy1: NumberArg = ...,
        **kwargs: Unpack[BezierArgs],
    ) -> GlyphRenderer[glyphs.Bezier]: ...

    def circle(self,
        x: NumberArg = ...,
        y: NumberArg = ...,
        radius: DistanceArg = ...,
        **kwargs: Unpack[CircleArgs],
    ) -> GlyphRenderer[glyphs.Circle]: ...

    def block(self,
        x: NumberArg = ...,
        y: NumberArg = ...,
        width: DistanceArg = ...,
        height: DistanceArg = ...,
        **kwargs: Unpack[BlockArgs],
    ) -> GlyphRenderer[glyphs.Block]: ...

    def harea(self,
        x1: NumberArg = ...,
        x2: NumberArg = ...,
        y: NumberArg = ...,
        **kwargs: Unpack[HAreaArgs],
    ) -> GlyphRenderer[glyphs.HArea]: ...

    def harea_step(self,
        x1: NumberArg = ...,
        x2: NumberArg = ...,
        y: NumberArg = ...,
        **kwargs: Unpack[HAreaStepArgs],
    ) -> GlyphRenderer[glyphs.HAreaStep]: ...

    def hbar(self,
        y: NumberArg = ...,
        height: DistanceArg = ...,
        right: NumberArg = ...,
        left: NumberArg = ...,
        **kwargs: Unpack[HBarArgs],
    ) -> GlyphRenderer[glyphs.HBar]: ...

    def hspan(self,
        y: NumberArg = ...,
        **kwargs: Unpack[HSpanArgs],
    ) -> GlyphRenderer[glyphs.HSpan]: ...

    def hstrip(self,
        y0: NumberArg = ...,
        y1: NumberArg = ...,
        **kwargs: Unpack[HStripArgs],
    ) -> GlyphRenderer[glyphs.HStrip]: ...

    def ellipse(self,
        x: NumberArg = ...,
        y: NumberArg = ...,
        width: DistanceArg = ...,
        height: DistanceArg = ...,
        angle: AngleArg = ...,
        **kwargs: Unpack[EllipseArgs],
    ) -> GlyphRenderer[glyphs.Ellipse]: ...

    def hex_tile(self,
        q: NumberArg = ...,
        r: NumberArg = ...,
        **kwargs: Unpack[HexTileArgs],
    ) -> GlyphRenderer[glyphs.HexTile]: ...

    def image(self,
        image: Image2dArg = ...,
        x: NumberArg = ...,
        y: NumberArg = ...,
        dw: DistanceArg = ...,
        dh: DistanceArg = ...,
        dilate: bool = ...,
        **kwargs: Unpack[ImageArgs],
    ) -> GlyphRenderer[glyphs.Image]: ...

    def image_rgba(self,
        image: Image2dArg = ...,
        x: NumberArg = ...,
        y: NumberArg = ...,
        dw: DistanceArg = ...,
        dh: DistanceArg = ...,
        dilate: bool = ...,
        **kwargs: Unpack[ImageRGBAArgs],
    ) -> GlyphRenderer[glyphs.ImageRGBA]: ...

    def image_stack(self,
        image: Image3dArg = ...,
        x: NumberArg = ...,
        y: NumberArg = ...,
        dw: DistanceArg = ...,
        dh: DistanceArg = ...,
        dilate: bool = ...,
        **kwargs: Unpack[ImageStackArgs],
    ) -> GlyphRenderer[glyphs.ImageStack]: ...

    def image_url(self,
        url: StringArg = ...,
        x: NumberArg = ...,
        y: NumberArg = ...,
        w: NullDistanceArg = ...,
        h: NullDistanceArg = ...,
        angle: AngleArg = ...,
        dilate: bool = ...,
        **kwargs: Unpack[ImageURLArgs],
    ) -> GlyphRenderer[glyphs.ImageURL]: ...

    def line(self,
        x: NumberArg = ...,
        y: NumberArg = ...,
        **kwargs: Unpack[LineArgs],
    ) -> GlyphRenderer[glyphs.Line]: ...

    def mathml(self,
        x: NumberArg = ...,
        y: NumberArg = ...,
        text: StringArg = ...,
        angle: AngleArg = ...,
        x_offset: FloatArg = ...,
        y_offset: FloatArg = ...,
        **kwargs: Unpack[MathMLArgs],
    ) -> GlyphRenderer[glyphs.MathMLGlyph]: ...

    def multi_line(self,
        xs: Number1dArg = ...,
        ys: Number1dArg = ...,
        **kwargs: Unpack[MultiLineArgs],
    ) -> GlyphRenderer[glyphs.MultiLine]: ...

    def multi_polygons(self,
        xs: Number3dArg = ...,
        ys: Number3dArg = ...,
        **kwargs: Unpack[MultiPolygonsArgs],
    ) -> GlyphRenderer[glyphs.MultiPolygons]: ...

    def ngon(self,
        x: NumberArg = ...,
        y: NumberArg = ...,
        radius: DistanceArg = ...,
        **kwargs: Unpack[NgonArgs],
    ) -> GlyphRenderer[glyphs.Ngon]: ...

    def patch(self,
        x: NumberArg = ...,
        y: NumberArg = ...,
        **kwargs: Unpack[PatchArgs],
    ) -> GlyphRenderer[glyphs.Patch]: ...

    def patches(self,
        xs: Number1dArg = ...,
        ys: Number1dArg = ...,
        **kwargs: Unpack[PatchesArgs],
    ) -> GlyphRenderer[glyphs.Patches]: ...

    def quad(self,
        left: NumberArg = ...,
        right: NumberArg = ...,
        top: NumberArg = ...,
        bottom: NumberArg = ...,
        **kwargs: Unpack[QuadArgs],
    ) -> GlyphRenderer[glyphs.Quad]: ...

    def quadratic(self,
        x0: NumberArg = ...,
        y0: NumberArg = ...,
        x1: NumberArg = ...,
        y1: NumberArg = ...,
        cx: NumberArg = ...,
        cy: NumberArg = ...,
        **kwargs: Unpack[QuadraticArgs],
    ) -> GlyphRenderer[glyphs.Quadratic]: ...

    def ray(self,
        x: NumberArg = ...,
        y: NumberArg = ...,
        length: DistanceArg = ...,
        angle: AngleArg = ...,
        **kwargs: Unpack[RayArgs],
    ) -> GlyphRenderer[glyphs.Ray]: ...

    def rect(self,
        x: NumberArg = ...,
        y: NumberArg = ...,
        width: DistanceArg = ...,
        height: DistanceArg = ...,
        angle: AngleArg = ...,
        dilate: bool = ...,
        **kwargs: Unpack[RectArgs],
    ) -> GlyphRenderer[glyphs.Rect]: ...

    def step(self,
        x: NumberArg = ...,
        y: NumberArg = ...,
        **kwargs: Unpack[StepArgs],
    ) -> GlyphRenderer[glyphs.Step]: ...

    def segment(self,
        x0: NumberArg = ...,
        y0: NumberArg = ...,
        x1: NumberArg = ...,
        y1: NumberArg = ...,
        **kwargs: Unpack[SegmentArgs],
    ) -> GlyphRenderer[glyphs.Segment]: ...

    def tex(self,
        x: NumberArg = ...,
        y: NumberArg = ...,
        text: StringArg = ...,
        angle: AngleArg = ...,
        x_offset: FloatArg = ...,
        y_offset: FloatArg = ...,
        **kwargs: Unpack[TeXArgs],
    ) -> GlyphRenderer[glyphs.TeXGlyph]: ...

    def text(self,
        x: NumberArg = ...,
        y: NumberArg = ...,
        text: StringArg = ...,
        angle: AngleArg = ...,
        x_offset: FloatArg = ...,
        y_offset: FloatArg = ...,
        **kwargs: Unpack[TextArgs],
    ) -> GlyphRenderer[glyphs.Text]: ...

    def varea(self,
        x: NumberArg = ...,
        y1: NumberArg = ...,
        y2: NumberArg = ...,
        **kwargs: Unpack[VAreaArgs],
    ) -> GlyphRenderer[glyphs.VArea]: ...

    def varea_step(self,
        x: NumberArg = ...,
        y1: NumberArg = ...,
        y2: NumberArg = ...,
        **kwargs: Unpack[VAreaStepArgs],
    ) -> GlyphRenderer[glyphs.VAreaStep]: ...

    def vbar(self,
        x: NumberArg = ...,
        width: DistanceArg = ...,
        top: NumberArg = ...,
        bottom: NumberArg = ...,
        **kwargs: Unpack[VBarArgs],
    ) -> GlyphRenderer[glyphs.VBar]: ...

    def vspan(self,
        x: NumberArg = ...,
        **kwargs: Unpack[VSpanArgs],
    ) -> GlyphRenderer[glyphs.VSpan]: ...

    def vstrip(self,
        x0: NumberArg = ...,
        x1: NumberArg = ...,
        **kwargs: Unpack[VStripArgs],
    ) -> GlyphRenderer[glyphs.VStrip]: ...

    def wedge(self,
        x: NumberArg = ...,
        y: NumberArg = ...,
        radius: DistanceArg = ...,
        start_angle: AngleArg = ...,
        end_angle: AngleArg = ...,
        direction: Direction = ...,
        **kwargs: Unpack[WedgeArgs],
    ) -> GlyphRenderer[glyphs.Wedge]: ...

    def scatter(self,
        x: NumberArg = ...,
        y: NumberArg = ...,
        size: SizeArg = ...,
        angle: AngleArg = ...,
        marker: MarkerArg = ...,
        **kwargs: Unpack[ScatterArgs],
    ) -> GlyphRenderer[glyphs.Scatter]: ...

    # Markers

    def asterisk(self,
        x: NumberArg = ...,
        y: NumberArg = ...,
        size: SizeArg = ...,
        angle: AngleArg = ...,
        **kwargs: Unpack[MarkerArgs],
    ) -> GlyphRenderer[glyphs.Marker]: ...

    def circle_cross(self,
        x: NumberArg = ...,
        y: NumberArg = ...,
        size: SizeArg = ...,
        angle: AngleArg = ...,
        **kwargs: Unpack[MarkerArgs],
    ) -> GlyphRenderer[glyphs.Marker]: ...

    def circle_dot(self,
        x: NumberArg = ...,
        y: NumberArg = ...,
        size: SizeArg = ...,
        angle: AngleArg = ...,
        **kwargs: Unpack[MarkerArgs],
    ) -> GlyphRenderer[glyphs.Marker]: ...

    def circle_x(self,
        x: NumberArg = ...,
        y: NumberArg = ...,
        size: SizeArg = ...,
        angle: AngleArg = ...,
        **kwargs: Unpack[MarkerArgs],
    ) -> GlyphRenderer[glyphs.Marker]: ...

    def circle_y(self,
        x: NumberArg = ...,
        y: NumberArg = ...,
        size: SizeArg = ...,
        angle: AngleArg = ...,
        **kwargs: Unpack[MarkerArgs],
    ) -> GlyphRenderer[glyphs.Marker]: ...

    def cross(self,
        x: NumberArg = ...,
        y: NumberArg = ...,
        size: SizeArg = ...,
        angle: AngleArg = ...,
        **kwargs: Unpack[MarkerArgs],
    ) -> GlyphRenderer[glyphs.Marker]: ...

    def dash(self,
        x: NumberArg = ...,
        y: NumberArg = ...,
        size: SizeArg = ...,
        angle: AngleArg = ...,
        **kwargs: Unpack[MarkerArgs],
    ) -> GlyphRenderer[glyphs.Marker]: ...

    def diamond(self,
        x: NumberArg = ...,
        y: NumberArg = ...,
        size: SizeArg = ...,
        angle: AngleArg = ...,
        **kwargs: Unpack[MarkerArgs],
    ) -> GlyphRenderer[glyphs.Marker]: ...

    def diamond_cross(self,
        x: NumberArg = ...,
        y: NumberArg = ...,
        size: SizeArg = ...,
        angle: AngleArg = ...,
        **kwargs: Unpack[MarkerArgs],
    ) -> GlyphRenderer[glyphs.Marker]: ...

    def diamond_dot(self,
        x: NumberArg = ...,
        y: NumberArg = ...,
        size: SizeArg = ...,
        angle: AngleArg = ...,
        **kwargs: Unpack[MarkerArgs],
    ) -> GlyphRenderer[glyphs.Marker]: ...

    def dot(self,
        x: NumberArg = ...,
        y: NumberArg = ...,
        size: SizeArg = ...,
        angle: AngleArg = ...,
        **kwargs: Unpack[MarkerArgs],
    ) -> GlyphRenderer[glyphs.Marker]: ...

    def hex(self,
        x: NumberArg = ...,
        y: NumberArg = ...,
        size: SizeArg = ...,
        angle: AngleArg = ...,
        **kwargs: Unpack[MarkerArgs],
    ) -> GlyphRenderer[glyphs.Marker]: ...

    def hex_dot(self,
        x: NumberArg = ...,
        y: NumberArg = ...,
        size: SizeArg = ...,
        angle: AngleArg = ...,
        **kwargs: Unpack[MarkerArgs],
    ) -> GlyphRenderer[glyphs.Marker]: ...

    def inverted_triangle(self,
        x: NumberArg = ...,
        y: NumberArg = ...,
        size: SizeArg = ...,
        angle: AngleArg = ...,
        **kwargs: Unpack[MarkerArgs],
    ) -> GlyphRenderer[glyphs.Marker]: ...

    def plus(self,
        x: NumberArg = ...,
        y: NumberArg = ...,
        size: SizeArg = ...,
        angle: AngleArg = ...,
        **kwargs: Unpack[MarkerArgs],
    ) -> GlyphRenderer[glyphs.Marker]: ...

    def square(self,
        x: NumberArg = ...,
        y: NumberArg = ...,
        size: SizeArg = ...,
        angle: AngleArg = ...,
        **kwargs: Unpack[MarkerArgs],
    ) -> GlyphRenderer[glyphs.Marker]: ...

    def square_cross(self,
        x: NumberArg = ...,
        y: NumberArg = ...,
        size: SizeArg = ...,
        angle: AngleArg = ...,
        **kwargs: Unpack[MarkerArgs],
    ) -> GlyphRenderer[glyphs.Marker]: ...

    def square_dot(self,
        x: NumberArg = ...,
        y: NumberArg = ...,
        size: SizeArg = ...,
        angle: AngleArg = ...,
        **kwargs: Unpack[MarkerArgs],
    ) -> GlyphRenderer[glyphs.Marker]: ...

    def square_pin(self,
        x: NumberArg = ...,
        y: NumberArg = ...,
        size: SizeArg = ...,
        angle: AngleArg = ...,
        **kwargs: Unpack[MarkerArgs],
    ) -> GlyphRenderer[glyphs.Marker]: ...

    def square_x(self,
        x: NumberArg = ...,
        y: NumberArg = ...,
        size: SizeArg = ...,
        angle: AngleArg = ...,
        **kwargs: Unpack[MarkerArgs],
    ) -> GlyphRenderer[glyphs.Marker]: ...

    def star(self,
        x: NumberArg = ...,
        y: NumberArg = ...,
        size: SizeArg = ...,
        angle: AngleArg = ...,
        **kwargs: Unpack[MarkerArgs],
    ) -> GlyphRenderer[glyphs.Marker]: ...

    def star_dot(self,
        x: NumberArg = ...,
        y: NumberArg = ...,
        size: SizeArg = ...,
        angle: AngleArg = ...,
        **kwargs: Unpack[MarkerArgs],
    ) -> GlyphRenderer[glyphs.Marker]: ...

    def triangle(self,
        x: NumberArg = ...,
        y: NumberArg = ...,
        size: SizeArg = ...,
        angle: AngleArg = ...,
        **kwargs: Unpack[MarkerArgs],
    ) -> GlyphRenderer[glyphs.Marker]: ...

    def triangle_dot(self,
        x: NumberArg = ...,
        y: NumberArg = ...,
        size: SizeArg = ...,
        angle: AngleArg = ...,
        **kwargs: Unpack[MarkerArgs],
    ) -> GlyphRenderer[glyphs.Marker]: ...

    def triangle_pin(self,
        x: NumberArg = ...,
        y: NumberArg = ...,
        size: SizeArg = ...,
        angle: AngleArg = ...,
        **kwargs: Unpack[MarkerArgs],
    ) -> GlyphRenderer[glyphs.Marker]: ...

    def x(self,
        x: NumberArg = ...,
        y: NumberArg = ...,
        size: SizeArg = ...,
        angle: AngleArg = ...,
        **kwargs: Unpack[MarkerArgs],
    ) -> GlyphRenderer[glyphs.Marker]: ...

    def y(self,
        x: NumberArg = ...,
        y: NumberArg = ...,
        size: SizeArg = ...,
        angle: AngleArg = ...,
        **kwargs: Unpack[MarkerArgs],
    ) -> GlyphRenderer[glyphs.Marker]: ...
