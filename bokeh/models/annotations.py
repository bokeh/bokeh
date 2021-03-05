#-----------------------------------------------------------------------------
# Copyright (c) 2012 - 2021, Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------
''' Renderers for various kinds of annotations that can be added to
Bokeh plots

'''
#-----------------------------------------------------------------------------
# Boilerplate
#-----------------------------------------------------------------------------
import logging # isort:skip
log = logging.getLogger(__name__)

#-----------------------------------------------------------------------------
# Imports
#-----------------------------------------------------------------------------

# Bokeh imports
from ..core.enums import (
    Anchor,
    AngleUnits,
    Dimension,
    FontStyle,
    LegendClickPolicy,
    LegendLocation,
    Orientation,
    RenderMode,
    SpatialUnits,
    TextAlign,
    TooltipAttachment,
    VerticalAlign,
)
from ..core.has_props import abstract
from ..core.properties import (
    Alpha,
    Angle,
    AngleSpec,
    Auto,
    Bool,
    Color,
    Datetime,
    Dict,
    Either,
    Enum,
    Float,
    Include,
    Instance,
    Int,
    List,
    NonNullable,
    Null,
    Nullable,
    NullStringSpec,
    NumberSpec,
    Override,
    PropertyUnitsSpec,
    Seq,
    String,
    StringSpec,
    Tuple,
    field,
    value,
)
from ..core.property_mixins import (
    FillProps,
    LineProps,
    ScalarFillProps,
    ScalarHatchProps,
    ScalarLineProps,
    ScalarTextProps,
    TextProps,
)
from ..core.validation import error
from ..core.validation.errors import (
    BAD_COLUMN_NAME,
    NON_MATCHING_DATA_SOURCES_ON_LEGEND_ITEM_RENDERERS,
)
from ..model import Model
from ..util.serialization import convert_datetime_type
from .formatters import TickFormatter
from .labeling import LabelingPolicy, NoOverlap
from .mappers import ColorMapper
from .renderers import GlyphRenderer, Renderer
from .sources import ColumnDataSource, DataSource
from .tickers import Ticker

#-----------------------------------------------------------------------------
# Globals and constants
#-----------------------------------------------------------------------------

__all__ = (
    'Annotation',
    'Arrow',
    'Band',
    'BoxAnnotation',
    'ColorBar',
    'DataAnnotation',
    'Label',
    'LabelSet',
    'Legend',
    'LegendItem',
    'PolyAnnotation',
    'Slope',
    'Span',
    'TextAnnotation',
    'Title',
    'Tooltip',
    'ToolbarPanel',
    'Whisker',
)

#-----------------------------------------------------------------------------
# Private API
#-----------------------------------------------------------------------------

# This only exists to prevent a circular import.
def _DEFAULT_ARROW():
    from .arrow_heads import OpenHead
    return OpenHead()

# This only exists to prevent a circular import.
def _DEFAULT_TEE():
    from .arrow_heads import TeeHead
    return TeeHead(size=10)

#-----------------------------------------------------------------------------
# General API
#-----------------------------------------------------------------------------

@abstract
class Annotation(Renderer):
    ''' Base class for all annotation models.

    '''

    level = Override(default="annotation")

@abstract
class DataAnnotation(Annotation):
    ''' Base class for annotations that utilize a data source.

    '''

    source = Instance(DataSource, default=lambda: ColumnDataSource(), help="""
    Local data source to use when rendering annotations on the plot.
    """)

@abstract
class TextAnnotation(Annotation):
    ''' Base class for text annotation models such as labels and titles.

    '''

    render_mode = Enum(RenderMode, default="canvas", help="""
    Specifies whether the text is rendered as a canvas element or as a
    CSS element overlaid on the canvas. The default mode is "canvas".

    .. note::
        The CSS labels won't be present in the output using the "save" tool.

    .. warning::
        Not all visual styling properties are supported if the render_mode is
        set to "css". The border_line_dash property isn't fully supported and
        border_line_dash_offset isn't supported at all. Setting text_alpha will
        modify the opacity of the entire background box and border in addition
        to the text. Finally, clipping Label annotations inside of the plot
        area isn't supported in "css" mode.

    """)

class LegendItem(Model):
    '''

    '''
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        if isinstance(self.label, str):
            # Allow convenience of setting label as a string
            self.label = value(self.label)

    label = NullStringSpec(help="""
    A label for this legend. Can be a string, or a column of a
    ColumnDataSource. If ``label`` is a field, then it must
    be in the renderers' data_source.
    """)

    renderers = List(Instance(GlyphRenderer), help="""
    A list of the glyph renderers to draw in the legend. If ``label`` is a field,
    then all data_sources of renderers must be the same.
    """)

    index = Nullable(Int, help="""
    The column data index to use for drawing the representative items.

    If None (the default), then Bokeh will automatically choose an index to
    use. If the label does not refer to a data column name, this is typically
    the first data point in the data source. Otherwise, if the label does
    refer to a column name, the legend will have "groupby" behavior, and will
    choose and display representative points from every "group" in the column.

    If set to a number, Bokeh will use that number as the index in all cases.
    """)

    @error(NON_MATCHING_DATA_SOURCES_ON_LEGEND_ITEM_RENDERERS)
    def _check_data_sources_on_renderers(self):
        if self.label and 'field' in self.label:
            if len({r.data_source for r in self.renderers}) != 1:
                return str(self)

    @error(BAD_COLUMN_NAME)
    def _check_field_label_on_data_source(self):
        if self.label and 'field' in self.label:
            if len(self.renderers) < 1:
                return str(self)
            source = self.renderers[0].data_source
            if self.label.get('field') not in source.column_names:
                return str(self)

class Legend(Annotation):
    ''' Render informational legends for a plot.

    See :ref:`userguide_plotting_legends` for information on plotting legends.

    '''

    location = Either(Enum(LegendLocation), Tuple(Float, Float), default="top_right", help="""
    The location where the legend should draw itself. It's either one of
    ``bokeh.core.enums.LegendLocation``'s enumerated values, or a ``(x, y)``
    tuple indicating an absolute location absolute location in screen
    coordinates (pixels from the bottom-left corner).
    """)

    orientation = Enum(Orientation, default="vertical", help="""
    Whether the legend entries should be placed vertically or horizontally
    when they are drawn.
    """)

    title = Nullable(String, help="""
    The title text to render.
    """)

    title_props = Include(ScalarTextProps, help="""
    The %s values for the title text.
    """)

    title_text_font_size = Override(default="13px")

    title_text_font_style = Override(default="italic")

    title_standoff = Int(5, help="""
    The distance (in pixels) to separate the title from the legend.
    """)

    border_props = Include(ScalarLineProps, help="""
    The %s for the legend border outline.
    """)

    border_line_color = Override(default="#e5e5e5")

    border_line_alpha = Override(default=0.5)

    background_props = Include(ScalarFillProps, help="""
    The %s for the legend background style.
    """)

    inactive_props = Include(ScalarFillProps, help="""
    The %s for the legend item style when inactive. These control an overlay
    on the item that can be used to obscure it when the corresponding glyph
    is inactive (e.g. by making it semi-transparent).
    """)

    click_policy = Enum(LegendClickPolicy, default="none", help="""
    Defines what happens when a lengend's item is clicked.
    """)

    background_fill_color = Override(default="#ffffff")

    background_fill_alpha = Override(default=0.95)

    inactive_fill_color = Override(default="white")

    inactive_fill_alpha = Override(default=0.7)

    label_props = Include(ScalarTextProps, help="""
    The %s for the legend labels.
    """)

    label_text_baseline = Override(default='middle')

    label_text_font_size = Override(default='13px')

    label_standoff = Int(5, help="""
    The distance (in pixels) to separate the label from its associated glyph.
    """)

    label_height = Int(20, help="""
    The minimum height (in pixels) of the area that legend labels should occupy.
    """)

    label_width = Int(20, help="""
    The minimum width (in pixels) of the area that legend labels should occupy.
    """)

    glyph_height = Int(20, help="""
    The height (in pixels) that the rendered legend glyph should occupy.
    """)

    glyph_width = Int(20, help="""
    The width (in pixels) that the rendered legend glyph should occupy.
    """)

    margin = Int(10, help="""
    Amount of margin around the legend.
    """)

    padding = Int(10, help="""
    Amount of padding around the contents of the legend. Only applicable when
    border is visible, otherwise collapses to 0.
    """)

    spacing = Int(3, help="""
    Amount of spacing (in pixels) between legend entries.
    """)

    items = List(Instance(LegendItem), help="""
    A list of :class:`~bokeh.model.annotations.LegendItem` instances to be
    rendered in the legend.

    This can be specified explicitly, for instance:

    .. code-block:: python

        legend = Legend(items=[
            LegendItem(label="sin(x)"   , renderers=[r0, r1]),
            LegendItem(label="2*sin(x)" , renderers=[r2]),
            LegendItem(label="3*sin(x)" , renderers=[r3, r4])
        ])

    But as a convenience, can also be given more compactly as a list of tuples:

    .. code-block:: python

        legend = Legend(items=[
            ("sin(x)"   , [r0, r1]),
            ("2*sin(x)" , [r2]),
            ("3*sin(x)" , [r3, r4])
        ])

    where each tuple is of the form: *(label, renderers)*.

    """).accepts(List(Tuple(String, List(Instance(GlyphRenderer)))), lambda items: [LegendItem(label=item[0], renderers=item[1]) for item in items])

class ColorBar(Annotation):
    ''' Render a color bar based on a color mapper.

    See :ref:`userguide_plotting_color_bars` for information on plotting color bars.

    '''

    location = Either(Enum(Anchor), Tuple(Float, Float), default="top_right", help="""
    The location where the color bar should draw itself. It's either one of
    ``bokeh.core.enums.Anchor``'s enumerated values, or a ``(x, y)``
    tuple indicating an absolute location absolute location in screen
    coordinates (pixels from the bottom-left corner).

    .. warning::
        If the color bar is placed in a side panel, the location will likely
        have to be set to `(0,0)`.
    """)

    orientation = Either(Enum(Orientation), Auto, default="auto", help="""
    Whether the color bar should be oriented vertically or horizontally.
    """)

    height = Either(Auto, Int, help="""
    The height (in pixels) that the color scale should occupy.
    """)

    width = Either(Auto, Int, help="""
    The width (in pixels) that the color scale should occupy.
    """)

    scale_alpha = Float(1.0, help="""
    The alpha with which to render the color scale.
    """)

    title = Nullable(String, help="""
    The title text to render.
    """)

    title_props = Include(ScalarTextProps, help="""
    The %s values for the title text.
    """)

    title_text_font_size = Override(default="13px")

    title_text_font_style = Override(default="italic")

    title_standoff = Int(2, help="""
    The distance (in pixels) to separate the title from the color bar.
    """)

    ticker = Either(Instance(Ticker), Auto, default="auto", help="""
    A Ticker to use for computing locations of axis components.
    """)

    formatter = Either(Instance(TickFormatter), Auto, default="auto", help="""
    A ``TickFormatter`` to use for formatting the visual appearance of ticks.
    """)

    major_label_overrides = Dict(Either(Float, String), String, default={}, help="""
    Provide explicit tick label values for specific tick locations that
    override normal formatting.
    """)

    major_label_policy = Instance(LabelingPolicy, default=lambda: NoOverlap(), help="""
    Allows to filter out labels, e.g. declutter labels to avoid overlap.
    """)

    color_mapper = Instance(ColorMapper, help="""
    A color mapper containing a color palette to render.

    .. warning::
        If the `low` and `high` attributes of the ``ColorMapper`` aren't set, ticks
        and tick labels won't be rendered. Additionally, if a ``LogTicker`` is
        passed to the `ticker` argument and either or both of the logarithms
        of `low` and `high` values of the color_mapper are non-numeric
        (i.e. `low=0`), the tick and tick labels won't be rendered.
    """)

    margin = Int(30, help="""
    Amount of margin (in pixels) around the outside of the color bar.
    """)

    padding = Int(10, help="""
    Amount of padding (in pixels) between the color scale and color bar border.
    """)

    major_label_props = Include(ScalarTextProps, help="""
    The %s of the major tick labels.
    """)

    major_label_text_font_size = Override(default="11px")

    label_standoff = Int(5, help="""
    The distance (in pixels) to separate the tick labels from the color bar.
    """)

    major_tick_props = Include(ScalarLineProps, help="""
    The %s of the major ticks.
    """)

    major_tick_line_color = Override(default="#ffffff")

    major_tick_in = Int(default=5, help="""
    The distance (in pixels) that major ticks should extend into the
    main plot area.
    """)

    major_tick_out = Int(default=0, help="""
    The distance (in pixels) that major ticks should extend out of the
    main plot area.
    """)

    minor_tick_props = Include(ScalarLineProps, help="""
    The %s of the minor ticks.
    """)

    minor_tick_line_color = Override(default=None)

    minor_tick_in = Int(default=0, help="""
    The distance (in pixels) that minor ticks should extend into the
    main plot area.
    """)

    minor_tick_out = Int(default=0, help="""
    The distance (in pixels) that major ticks should extend out of the
    main plot area.
    """)

    bar_props = Include(ScalarLineProps, help="""
    The %s for the color scale bar outline.
    """)

    bar_line_color = Override(default=None)

    border_props = Include(ScalarLineProps, help="""
    The %s for the color bar border outline.
    """)

    border_line_color = Override(default=None)

    background_props = Include(ScalarFillProps, help="""
    The %s for the color bar background style.
    """)

    background_fill_color = Override(default="#ffffff")

    background_fill_alpha = Override(default=0.95)

class Arrow(DataAnnotation):
    ''' Render arrows as an annotation.

    See :ref:`userguide_plotting_arrows` for information on plotting arrows.

    '''

    x_start = NumberSpec(default=field("x_start"), help="""
    The x-coordinates to locate the start of the arrows.
    """)

    y_start = NumberSpec(default=field("y_start"), help="""
    The y-coordinates to locate the start of the arrows.
    """)

    start_units = Enum(SpatialUnits, default='data', help="""
    The unit type for the start_x and start_y attributes. Interpreted as "data
    space" units by default.
    """)

    start = Nullable(Instance('.models.arrow_heads.ArrowHead'), help="""
    Instance of ``ArrowHead``.
    """)

    x_end = NumberSpec(default=field("x_end"), help="""
    The x-coordinates to locate the end of the arrows.
    """)

    y_end = NumberSpec(default=field("y_end"), help="""
    The y-coordinates to locate the end of the arrows.
    """)

    end_units = Enum(SpatialUnits, default='data', help="""
    The unit type for the end_x and end_y attributes. Interpreted as "data
    space" units by default.
    """)

    end = Nullable(Instance('.models.arrow_heads.ArrowHead'), default=_DEFAULT_ARROW, help="""
    Instance of ``ArrowHead``.
    """)

    body_props = Include(LineProps, use_prefix=False, help="""
    The %s values for the arrow body.
    """)

class BoxAnnotation(Annotation):
    ''' Render a shaded rectangular region as an annotation.

    See :ref:`userguide_plotting_box_annotations` for information on plotting box annotations.

    '''

    left = Either(Null, Auto, NumberSpec(), help="""
    The x-coordinates of the left edge of the box annotation.

    Datetime values are also accepted, but note that they are immediately
    converted to milliseconds-since-epoch.
    """)

    left_units = Enum(SpatialUnits, default='data', help="""
    The unit type for the left attribute. Interpreted as "data space" units
    by default.
    """)

    right = Either(Null, Auto, NumberSpec(), help="""
    The x-coordinates of the right edge of the box annotation.

    Datetime values are also accepted, but note that they are immediately
    converted to milliseconds-since-epoch.
    """)

    right_units = Enum(SpatialUnits, default='data', help="""
    The unit type for the right attribute. Interpreted as "data space" units
    by default.
    """)

    bottom = Either(Null, Auto, NumberSpec(), help="""
    The y-coordinates of the bottom edge of the box annotation.

    Datetime values are also accepted, but note that they are immediately
    converted to milliseconds-since-epoch.
    """)

    bottom_units = Enum(SpatialUnits, default='data', help="""
    The unit type for the bottom attribute. Interpreted as "data space" units
    by default.
    """)

    top = Either(Null, Auto, NumberSpec(), help="""
    The y-coordinates of the top edge of the box annotation.

    Datetime values are also accepted, but note that they are immediately
    converted to milliseconds-since-epoch.
    """)

    top_units = Enum(SpatialUnits, default='data', help="""
    The unit type for the top attribute. Interpreted as "data space" units
    by default.
    """)

    line_props = Include(ScalarLineProps, use_prefix=False, help="""
    The %s values for the box.
    """)

    fill_props = Include(ScalarFillProps, use_prefix=False, help="""
    The %s values for the box.
    """)

    hatch_props = Include(ScalarHatchProps, use_prefix=False, help="""
    The %s values for the box.
    """)

    line_alpha = Override(default=0.3)

    line_color = Override(default="#cccccc")

    fill_alpha = Override(default=0.4)

    fill_color = Override(default="#fff9ba")

    render_mode = Enum(RenderMode, default="canvas", help="""
    Specifies whether the box is rendered as a canvas element or as an
    css element overlaid on the canvas. The default mode is "canvas".

    .. note:
        This property is deprecated and will be removed in bokeh 3.0.

    .. warning::
        The line_dash and line_dash_offset attributes aren't supported if
        the render_mode is set to "css"

    """)

class Band(DataAnnotation):
    ''' Render a filled area band along a dimension.

    See :ref:`userguide_plotting_bands` for information on plotting bands.

    '''
    lower = PropertyUnitsSpec(default=field("lower"), units_type=Enum(SpatialUnits), units_default="data", help="""
    The coordinates of the lower portion of the filled area band.
    """)

    upper = PropertyUnitsSpec(default=field("upper"), units_type=Enum(SpatialUnits), units_default="data", help="""
    The coordinates of the upper portion of the filled area band.
    """)

    base = PropertyUnitsSpec(default=field("base"), units_type=Enum(SpatialUnits), units_default="data", help="""
    The orthogonal coordinates of the upper and lower values.
    """)

    dimension = Enum(Dimension, default='height', help="""
    The direction of the band can be specified by setting this property
    to "height" (``y`` direction) or "width" (``x`` direction).
    """)

    line_props = Include(ScalarLineProps, use_prefix=False, help="""
    The %s values for the band.
    """)

    line_alpha = Override(default=0.3)

    line_color = Override(default="#cccccc")

    fill_props = Include(ScalarFillProps, use_prefix=False, help="""
    The %s values for the band.
    """)

    fill_alpha = Override(default=0.4)

    fill_color = Override(default="#fff9ba")

class Label(TextAnnotation):
    ''' Render a single text label as an annotation.

    ``Label`` will render a single text label at given ``x`` and ``y``
    coordinates, which can be in either screen (pixel) space, or data (axis
    range) space.

    The label can also be configured with a screen space offset from ``x`` and
    ``y``, by using the ``x_offset`` and ``y_offset`` properties.

    Additionally, the label can be rotated with the ``angle`` property.

    There are also standard text, fill, and line properties to control the
    appearance of the text, its background, as well as the rectangular bounding
    box border.

    See :ref:`userguide_plotting_labels` for information on plotting labels.

    '''

    x = NonNullable(Float, help="""
    The x-coordinate in screen coordinates to locate the text anchors.

    Datetime values are also accepted, but note that they are immediately
    converted to milliseconds-since-epoch.
    """).accepts(Datetime, convert_datetime_type)

    x_units = Enum(SpatialUnits, default='data', help="""
    The unit type for the x attribute. Interpreted as "data space" units
    by default.
    """)

    y = NonNullable(Float, help="""
    The y-coordinate in screen coordinates to locate the text anchors.

    Datetime values are also accepted, but note that they are immediately
    converted to milliseconds-since-epoch.
    """).accepts(Datetime, convert_datetime_type)

    y_units = Enum(SpatialUnits, default='data', help="""
    The unit type for the y attribute. Interpreted as "data space" units
    by default.
    """)

    text = String(default="", help="""
    The text value to render.
    """)

    angle = Angle(default=0, help="""
    The angle to rotate the text, as measured from the horizontal.

    .. warning::
        The center of rotation for canvas and css render_modes is different.
        For `render_mode="canvas"` the label is rotated from the top-left
        corner of the annotation, while for `render_mode="css"` the annotation
        is rotated around it's center.
    """)

    angle_units = Enum(AngleUnits, default='rad', help="""
    Acceptable values for units are ``"rad"`` and ``"deg"``
    """)

    x_offset = Float(default=0, help="""
    Offset value to apply to the x-coordinate.

    This is useful, for instance, if it is desired to "float" text a fixed
    distance in screen units from a given data position.
    """)

    y_offset = Float(default=0, help="""
    Offset value to apply to the y-coordinate.

    This is useful, for instance, if it is desired to "float" text a fixed
    distance in screen units from a given data position.
    """)

    text_props = Include(ScalarTextProps, use_prefix=False, help="""
    The %s values for the text.
    """)

    background_props = Include(ScalarFillProps, use_prefix=True, help="""
    The %s values for the text bounding box.
    """)

    background_fill_color = Override(default=None)

    border_props = Include(ScalarLineProps, use_prefix=True, help="""
    The %s values for the text bounding box.
    """)

    border_line_color = Override(default=None)

class LabelSet(TextAnnotation): # TODO: DataAnnotation
    ''' Render multiple text labels as annotations.

    ``LabelSet`` will render multiple text labels at given ``x`` and ``y``
    coordinates, which can be in either screen (pixel) space, or data (axis
    range) space. In this case (as opposed to the single ``Label`` model),
    ``x`` and ``y`` can also be the name of a column from a
    :class:`~bokeh.models.sources.ColumnDataSource`, in which case the labels
    will be "vectorized" using coordinate values from the specified columns.

    The label can also be configured with a screen space offset from ``x`` and
    ``y``, by using the ``x_offset`` and ``y_offset`` properties. These offsets
    may be vectorized by giving the name of a data source column.

    Additionally, the label can be rotated with the ``angle`` property (which
    may also be a column name.)

    There are also standard text, fill, and line properties to control the
    appearance of the text, its background, as well as the rectangular bounding
    box border.

    The data source is provided by setting the ``source`` property.

    '''

    x = NumberSpec(default=field("x"), help="""
    The x-coordinates to locate the text anchors.
    """)

    x_units = Enum(SpatialUnits, default='data', help="""
    The unit type for the ``xs`` attribute. Interpreted as "data space" units
    by default.
    """)

    y = NumberSpec(default=field("y"), help="""
    The y-coordinates to locate the text anchors.
    """)

    y_units = Enum(SpatialUnits, default='data', help="""
    The unit type for the ``ys`` attribute. Interpreted as "data space" units
    by default.
    """)

    text = StringSpec(default=field("text"), help="""
    The text values to render.
    """)

    angle = AngleSpec(default=0, help="""
    The angles to rotate the text, as measured from the horizontal.

    .. warning::
        The center of rotation for canvas and css render_modes is different.
        For `render_mode="canvas"` the label is rotated from the top-left
        corner of the annotation, while for `render_mode="css"` the annotation
        is rotated around it's center.
    """)

    x_offset = NumberSpec(default=0, help="""
    Offset values to apply to the x-coordinates.

    This is useful, for instance, if it is desired to "float" text a fixed
    distance in screen units from a given data position.
    """)

    y_offset = NumberSpec(default=0, help="""
    Offset values to apply to the y-coordinates.

    This is useful, for instance, if it is desired to "float" text a fixed
    distance in screen units from a given data position.
    """)

    text_props = Include(TextProps, use_prefix=False, help="""
    The %s values for the text.
    """)

    background_props = Include(FillProps, use_prefix=True, help="""
    The %s values for the text bounding box.
    """)

    background_fill_color = Override(default=None)

    border_props = Include(LineProps, use_prefix=True, help="""
    The %s values for the text bounding box.
    """)

    border_line_color = Override(default=None)

    source = Instance(DataSource, default=lambda: ColumnDataSource(), help="""
    Local data source to use when rendering annotations on the plot.
    """)

class PolyAnnotation(Annotation):
    ''' Render a shaded polygonal region as an annotation.

    See :ref:`userguide_plotting_polygon_annotations` for information on
    plotting polygon annotations.

    '''

    xs = Seq(Float, default=[], help="""
    The x-coordinates of the region to draw.
    """)

    xs_units = Enum(SpatialUnits, default='data', help="""
    The unit type for the ``xs`` attribute. Interpreted as "data space" units
    by default.
    """)

    ys = Seq(Float, default=[], help="""
    The y-coordinates of the region to draw.
    """)

    ys_units = Enum(SpatialUnits, default='data', help="""
    The unit type for the ``ys`` attribute. Interpreted as "data space" units
    by default.
    """)

    line_props = Include(ScalarLineProps, use_prefix=False, help="""
    The %s values for the polygon.
    """)

    fill_props = Include(ScalarFillProps, use_prefix=False, help="""
    The %s values for the polygon.
    """)

    hatch_props = Include(ScalarHatchProps, use_prefix=False, help="""
    The %s values for the polygon.
    """)

    line_alpha = Override(default=0.3)

    line_color = Override(default="#cccccc")

    fill_alpha = Override(default=0.4)

    fill_color = Override(default="#fff9ba")

class Slope(Annotation):
    """ Render a sloped line as an annotation.

    See :ref:`userguide_plotting_slope` for information on plotting slopes.

    """

    gradient = Nullable(Float, help="""
    The gradient of the line, in data units
    """)

    y_intercept = Nullable(Float, help="""
    The y intercept of the line, in data units
    """)

    line_props = Include(ScalarLineProps, use_prefix=False, help="""
    The %s values for the line.
    """)

class Span(Annotation):
    """ Render a horizontal or vertical line span.

    See :ref:`userguide_plotting_spans` for information on plotting spans.

    """

    location = Nullable(Float, help="""
    The location of the span, along ``dimension``.

    Datetime values are also accepted, but note that they are immediately
    converted to milliseconds-since-epoch.
    """).accepts(Datetime, convert_datetime_type)

    location_units = Enum(SpatialUnits, default='data', help="""
    The unit type for the location attribute. Interpreted as "data space"
    units by default.
    """)

    dimension = Enum(Dimension, default='width', help="""
    The direction of the span can be specified by setting this property
    to "height" (``y`` direction) or "width" (``x`` direction).
    """)

    render_mode = Enum(RenderMode, default="canvas", help="""
    Specifies whether the span is rendered as a canvas element or as a
    CSS element overlaid on the canvas. The default mode is "canvas".

    .. note:
        This property is deprecated and will be removed in bokeh 3.0.

    .. warning::
        The line_dash and line_dash_offset attributes aren't supported if
        the render_mode is set to "css"

    """)

    line_props = Include(ScalarLineProps, use_prefix=False, help="""
    The %s values for the span.
    """)

class Title(TextAnnotation):
    ''' Render a single title box as an annotation.

    See :ref:`userguide_plotting_titles` for information on plotting titles.

    '''

    text = String(default="", help="""
    The text value to render.
    """)

    vertical_align = Enum(VerticalAlign, default='bottom', help="""
    Alignment of the text in its enclosing space, *across* the direction of the text.
    """)

    align = Enum(TextAlign, default='left', help="""
    Alignment of the text in its enclosing space, *along* the direction of the text.
    """)

    text_line_height = Float(default=1.0, help="""
    How much additional space should be allocated for the title. The value is provided
    as a number, but should be treated as a percentage of font size. The default is
    100%, which means no additional space will be used.
    """)

    offset = Float(default=0, help="""
    Offset the text by a number of pixels (can be positive or negative). Shifts the text in
    different directions based on the location of the title:

        * above: shifts title right
        * right: shifts title down
        * below: shifts title right
        * left: shifts title up

    """)

    standoff = Float(default=10, help="""
    """)

    text_font = String(default="helvetica", help="""
    Name of a font to use for rendering text, e.g., ``'times'``,
    ``'helvetica'``.

    """)

    text_font_size = String(default="13px")

    text_font_style = Enum(FontStyle, default="bold", help="""
    A style to use for rendering text.

    Acceptable values are:

    - ``'normal'`` normal text
    - ``'italic'`` *italic text*
    - ``'bold'`` **bold text**

    """)

    text_color = Color(default="#444444", help="""
    A color to use to fill text with.
    """)

    text_alpha = Alpha(help="""
    An alpha value to use to fill text with.
    """)

    background_props = Include(ScalarFillProps, use_prefix=True, help="""
    The %s values for the text bounding box.
    """)

    background_fill_color = Override(default=None)

    border_props = Include(ScalarLineProps, use_prefix=True, help="""
    The %s values for the text bounding box.
    """)

    border_line_color = Override(default=None)

class Tooltip(Annotation):
    ''' Render a tooltip.

    .. note::
        This model is currently managed by BokehJS and is not useful
        directly from python.

    '''
    level = Override(default="overlay")

    attachment = Enum(TooltipAttachment, help="""
    Whether the tooltip should be displayed to the left or right of the cursor
    position or above or below it, or if it should be automatically placed
    in the horizontal or vertical dimension.
    """)

    inner_only = Bool(default=True, help="""
    Whether to display outside a central plot frame area.

    .. note:
        This property is deprecated and will be removed in bokeh 3.0.

    """)

    show_arrow = Bool(default=True, help="""
    Whether tooltip's arrow should be shown.
    """)

class Whisker(DataAnnotation):
    ''' Render a whisker along a dimension.

    See :ref:`userguide_plotting_whiskers` for information on plotting whiskers.

    '''

    lower = PropertyUnitsSpec(default=field("lower"), units_type=Enum(SpatialUnits), units_default="data", help="""
    The coordinates of the lower end of the whiskers.
    """)

    lower_head = Nullable(Instance('.models.arrow_heads.ArrowHead'), default=_DEFAULT_TEE, help="""
    Instance of ``ArrowHead``.
    """)

    upper = PropertyUnitsSpec(default=field("upper"), units_type=Enum(SpatialUnits), units_default="data", help="""
    The coordinates of the upper end of the whiskers.
    """)

    upper_head = Nullable(Instance('.models.arrow_heads.ArrowHead'), default=_DEFAULT_TEE, help="""
    Instance of ``ArrowHead``.
    """)

    base = PropertyUnitsSpec(default=field("base"), units_type=Enum(SpatialUnits), units_default="data", help="""
    The orthogonal coordinates of the upper and lower values.
    """)

    dimension = Enum(Dimension, default='height', help="""
    The direction of the whisker can be specified by setting this property
    to "height" (``y`` direction) or "width" (``x`` direction).
    """)

    line_props = Include(LineProps, use_prefix=False, help="""
    The %s values for the whisker body.
    """)

    level = Override(default="underlay")

class ToolbarPanel(Annotation): # TODO: this shouldn't be an annotation

    toolbar = Instance(".models.tools.Toolbar", help="""
    A toolbar to display.
    """)

#-----------------------------------------------------------------------------
# Dev API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Code
#-----------------------------------------------------------------------------
