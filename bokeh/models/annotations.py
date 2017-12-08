''' Renderers for various kinds of annotations that can be added to
Bokeh plots

'''
from __future__ import absolute_import

from six import string_types

from ..core.enums import (AngleUnits, Dimension, FontStyle, LegendClickPolicy, LegendLocation,
                          Orientation, RenderMode, SpatialUnits, VerticalAlign, TextAlign,
                          TooltipAttachment)
from ..core.has_props import abstract
from ..core.properties import (Angle, AngleSpec, Auto, Bool, ColorSpec, Datetime, Dict, DistanceSpec, Either,
                               Enum, Float, FontSizeSpec, Include, Instance, Int, List, NumberSpec, Override,
                               Seq, String, StringSpec, Tuple, value)
from ..core.property_mixins import FillProps, LineProps, TextProps
from ..core.validation import error
from ..core.validation.errors import BAD_COLUMN_NAME, NON_MATCHING_DATA_SOURCES_ON_LEGEND_ITEM_RENDERERS
from ..model import Model
from ..util.serialization import convert_datetime_type

from .formatters import BasicTickFormatter, TickFormatter
from .mappers import ContinuousColorMapper
from .renderers import GlyphRenderer, Renderer
from .sources import ColumnDataSource, DataSource
from .tickers import BasicTicker, Ticker

@abstract
class Annotation(Renderer):
    ''' Base class for all annotation models.

    '''

    plot = Instance(".models.plots.Plot", help="""
    The plot to which this annotation is attached.
    """)

    level = Override(default="annotation")

@abstract
class TextAnnotation(Annotation):
    ''' Base class for text annotation models such as labels and titles.

    '''

class LegendItem(Model):
    '''

    '''
    def __init__(self, *args, **kwargs):
        super(LegendItem, self).__init__(*args, **kwargs)
        if isinstance(self.label, string_types):
            # Allow convenience of setting label as a string
            self.label = value(self.label)

    label = StringSpec(default=None, help="""
    A label for this legend. Can be a string, or a column of a
    ColumnDataSource. If ``label`` is a field, then it must
    be in the renderers' data_source.
    """)

    renderers = List(Instance(GlyphRenderer), help="""
    A list of the glyph renderers to draw in the legend. If ``label`` is a field,
    then all data_sources of renderers must be the same.
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

    border_props = Include(LineProps, help="""
    The %s for the legend border outline.
    """)

    border_line_color = Override(default="#e5e5e5")

    border_line_alpha = Override(default=0.5)

    background_props = Include(FillProps, help="""
    The %s for the legend background style.
    """)

    inactive_props = Include(FillProps, help="""
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

    label_props = Include(TextProps, help="""
    The %s for the legend labels.
    """)

    label_text_baseline = Override(default='middle')

    label_text_font_size = Override(default={'value': '10pt'})

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
    when border is visible, otherwise collapses to 0.
    """)

    spacing = Int(3, help="""
    Amount of spacing (in pixles) between legend entries.
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

    '''

    location = Either(Enum(LegendLocation), Tuple(Float, Float),
        default="top_right", help="""
    The location where the color bar should draw itself. It's either one of
    ``bokeh.core.enums.LegendLocation``'s enumerated values, or a ``(x, y)``
    tuple indicating an absolute location absolute location in screen
    coordinates (pixels from the bottom-left corner).

    .. warning::
        If the color bar is placed in a side panel, the location will likely
        have to be set to `(0,0)`.
    """)

    orientation = Enum(Orientation, default="vertical", help="""
    Whether the color bar should be oriented vertically or horizontally.
    """)

    height = Either(Auto, Int(), help="""
    The height (in pixels) that the color scale should occupy.
    """)

    width = Either(Auto, Int(), help="""
    The width (in pixels) that the color scale should occupy.
    """)

    scale_alpha = Float(1.0, help="""
    The alpha with which to render the color scale.
    """)

    title = String(help="""
    The title text to render.
    """)

    title_props = Include(TextProps, help="""
    The %s values for the title text.
    """)

    title_text_font_size = Override(default={'value': "10pt"})

    title_text_font_style = Override(default="italic")

    title_standoff = Int(2, help="""
    The distance (in pixels) to separate the title from the color bar.
    """)

    ticker = Instance(Ticker, default=lambda: BasicTicker(), help="""
    A Ticker to use for computing locations of axis components.
    """)

    formatter = Instance(TickFormatter, default=lambda: BasicTickFormatter(), help="""
    A TickFormatter to use for formatting the visual appearance of ticks.
    """)

    major_label_overrides = Dict(Either(Float, String), String, default={}, help="""
    Provide explicit tick label values for specific tick locations that
    override normal formatting.
    """)

    color_mapper = Instance(ContinuousColorMapper, help="""
    A continuous color mapper containing a color palette to render.

    .. warning::
        If the `low` and `high` attributes of the ColorMapper aren't set, ticks
        and tick labels won't be rendered. Additionally, if a LogTicker is
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

    major_label_props = Include(TextProps, help="""
    The %s of the major tick labels.
    """)

    major_label_text_align = Override(default="center")

    major_label_text_baseline = Override(default="middle")

    major_label_text_font_size = Override(default={'value': "8pt"})

    label_standoff = Int(5, help="""
    The distance (in pixels) to separate the tick labels from the color bar.
    """)

    major_tick_props = Include(LineProps, help="""
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

    minor_tick_props = Include(LineProps, help="""
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

    bar_props = Include(LineProps, help="""
    The %s for the color scale bar outline.
    """)

    bar_line_color = Override(default=None)

    border_props = Include(LineProps, help="""
    The %s for the color bar border outline.
    """)

    border_line_color = Override(default=None)

    background_props = Include(FillProps, help="""
    The %s for the color bar background style.
    """)

    background_fill_color = Override(default="#ffffff")

    background_fill_alpha = Override(default=0.95)

# This only exists to prevent a circular import.
def _DEFAULT_ARROW():
    from .arrow_heads import OpenHead
    return OpenHead()

class Arrow(Annotation):
    ''' Render an arrow as an annotation.

    '''

    x_start = NumberSpec(help="""
    The x-coordinates to locate the start of the arrows.
    """)

    y_start = NumberSpec(help="""
    The y-coordinates to locate the start of the arrows.
    """)

    start_units = Enum(SpatialUnits, default='data', help="""
    The unit type for the start_x and start_y attributes. Interpreted as "data
    space" units by default.
    """)

    start = Instance('.models.arrow_heads.ArrowHead', default=None, help="""
    Instance of ArrowHead.
    """)

    x_end = NumberSpec(help="""
    The x-coordinates to locate the end of the arrows.
    """)

    y_end = NumberSpec(help="""
    The y-coordinates to locate the end of the arrows.
    """)

    end_units = Enum(SpatialUnits, default='data', help="""
    The unit type for the end_x and end_y attributes. Interpreted as "data
    space" units by default.
    """)

    end = Instance('.models.arrow_heads.ArrowHead', default=_DEFAULT_ARROW, help="""
    Instance of ArrowHead.
    """)

    body_props = Include(LineProps, use_prefix=False, help="""
    The %s values for the arrow body.
    """)

    source = Instance(DataSource, help="""
    Local data source to use when rendering annotations on the plot.
    """)

    x_range_name = String('default', help="""
    A particular (named) x-range to use for computing screen locations when
    rendering annotations on the plot. If unset, use the default x-range.
    """)

    y_range_name = String('default', help="""
    A particular (named) y-range to use for computing screen locations when
    rendering annotations on the plot. If unset, use the default y-range.
    """)

class BoxAnnotation(Annotation):
    ''' Render a shaded rectangular region as an annotation.

    '''

    left = Either(Auto, NumberSpec(), default=None, help="""
    The x-coordinates of the left edge of the box annotation.

    Datetime values are also accepted, but note that they are immediately
    converted to milliseconds-since-epoch.
    """)

    left_units = Enum(SpatialUnits, default='data', help="""
    The unit type for the left attribute. Interpreted as "data space" units
    by default.
    """)

    right = Either(Auto, NumberSpec(), default=None, help="""
    The x-coordinates of the right edge of the box annotation.

    Datetime values are also accepted, but note that they are immediately
    converted to milliseconds-since-epoch.
    """)

    right_units = Enum(SpatialUnits, default='data', help="""
    The unit type for the right attribute. Interpreted as "data space" units
    by default.
    """)

    bottom = Either(Auto, NumberSpec(), default=None, help="""
    The y-coordinates of the bottom edge of the box annotation.

    Datetime values are also accepted, but note that they are immediately
    converted to milliseconds-since-epoch.
    """)

    bottom_units = Enum(SpatialUnits, default='data', help="""
    The unit type for the bottom attribute. Interpreted as "data space" units
    by default.
    """)

    top = Either(Auto, NumberSpec(), default=None, help="""
    The y-coordinates of the top edge of the box annotation.

    Datetime values are also accepted, but note that they are immediately
    converted to milliseconds-since-epoch.
    """)

    top_units = Enum(SpatialUnits, default='data', help="""
    The unit type for the top attribute. Interpreted as "data space" units
    by default.
    """)

    x_range_name = String('default', help="""
    A particular (named) x-range to use for computing screen locations when
    rendering box annotations on the plot. If unset, use the default x-range.
    """)

    y_range_name = String('default', help="""
    A particular (named) y-range to use for computing screen locations when
    rendering box annotations on the plot. If unset, use the default y-range.
    """)

    line_props = Include(LineProps, use_prefix=False, help="""
    The %s values for the box.
    """)

    line_alpha = Override(default=0.3)

    line_color = Override(default="#cccccc")

    fill_props = Include(FillProps, use_prefix=False, help="""
    The %s values for the box.
    """)

    fill_alpha = Override(default=0.4)

    fill_color = Override(default="#fff9ba")

    render_mode = Enum(RenderMode, default="canvas", help="""
    Specifies whether the box is rendered as a canvas element or as an
    css element overlaid on the canvas. The default mode is "canvas".

    .. warning::
        The line_dash and line_dash_offset attributes aren't supported if
        the render_mode is set to "css"

    """)

class Band(Annotation):
    ''' Render a filled area band along a dimension.

    '''

    lower = DistanceSpec(help="""
    The coordinates of the lower portion of the filled area band.
    """)

    upper = DistanceSpec(help="""
    The coordinations of the upper portion of the filled area band.
    """)

    base = DistanceSpec(help="""
    The orthogonal coordinates of the upper and lower values.
    """)

    dimension = Enum(Dimension, default='height', help="""
    The direction of the band.
    """)

    source = Instance(DataSource, default=lambda: ColumnDataSource(), help="""
    Local data source to use when rendering annotations on the plot.
    """)

    x_range_name = String('default', help="""
    A particular (named) x-range to use for computing screen locations when
    rendering annotations on the plot. If unset, use the default x-range.
    """)

    y_range_name = String('default', help="""
    A particular (named) y-range to use for computing screen locations when
    rendering annotations on the plot. If unset, use the default y-range.
    """)

    line_props = Include(LineProps, use_prefix=False, help="""
    The %s values for the band.
    """)

    line_alpha = Override(default=0.3)

    line_color = Override(default="#cccccc")

    fill_props = Include(FillProps, use_prefix=False, help="""
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

    '''

    x = Float(help="""
    The x-coordinate in screen coordinates to locate the text anchors.

    Datetime values are also accepted, but note that they are immediately
    converted to milliseconds-since-epoch.
    """).accepts(Datetime, convert_datetime_type)

    x_units = Enum(SpatialUnits, default='data', help="""
    The unit type for the x attribute. Interpreted as "data space" units
    by default.
    """)

    y = Float(help="""
    The y-coordinate in screen coordinates to locate the text anchors.

    Datetime values are also accepted, but note that they are immediately
    converted to milliseconds-since-epoch.
    """).accepts(Datetime, convert_datetime_type)

    y_units = Enum(SpatialUnits, default='data', help="""
    The unit type for the y attribute. Interpreted as "data space" units
    by default.
    """)

    text = String(help="""
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

    # TODO (bev) these should probably not be dataspec properties
    text_props = Include(TextProps, use_prefix=False, help="""
    The %s values for the text.
    """)

    # TODO (bev) these should probably not be dataspec properties
    background_props = Include(FillProps, use_prefix=True, help="""
    The %s values for the text bounding box.
    """)

    background_fill_color = Override(default=None)

    # TODO (bev) these should probably not be dataspec properties
    border_props = Include(LineProps, use_prefix=True, help="""
    The %s values for the text bounding box.
    """)

    border_line_color = Override(default=None)

    x_range_name = String('default', help="""
    A particular (named) x-range to use for computing screen location when
    rendering an annotation on the plot. If unset, use the default x-range.
    """)

    y_range_name = String('default', help="""
    A particular (named) y-range to use for computing screen location when
    rendering an annotation on the plot. If unset, use the default y-range.
    """)

    render_mode = Enum(RenderMode, default="canvas", help="""
    Specifies whether the text is rendered as a canvas element or as an
    css element overlaid on the canvas. The default mode is "canvas".

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

class LabelSet(TextAnnotation):
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

    x = NumberSpec(help="""
    The x-coordinates to locate the text anchors.
    """)

    x_units = Enum(SpatialUnits, default='data', help="""
    The unit type for the xs attribute. Interpreted as "data space" units
    by default.
    """)

    y = NumberSpec(help="""
    The y-coordinates to locate the text anchors.
    """)

    y_units = Enum(SpatialUnits, default='data', help="""
    The unit type for the ys attribute. Interpreted as "data space" units
    by default.
    """)

    text = StringSpec("text", help="""
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

    x_range_name = String('default', help="""
    A particular (named) x-range to use for computing screen locations when
    rendering annotations on the plot. If unset, use the default x-range.
    """)

    y_range_name = String('default', help="""
    A particular (named) y-range to use for computing screen locations when
    rendering annotations on the plot. If unset, use the default y-range.
    """)

    render_mode = Enum(RenderMode, default="canvas", help="""
    Specifies whether the text is rendered as a canvas element or as an
    css element overlaid on the canvas. The default mode is "canvas".

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

class PolyAnnotation(Annotation):
    ''' Render a shaded polygonal region as an annotation.

    '''

    xs = Seq(Float, default=[], help="""
    The x-coordinates of the region to draw.
    """)

    xs_units = Enum(SpatialUnits, default='data', help="""
    The unit type for the xs attribute. Interpreted as "data space" units
    by default.
    """)

    ys = Seq(Float, default=[], help="""
    The y-coordinates of the region to draw.
    """)

    ys_units = Enum(SpatialUnits, default='data', help="""
    The unit type for the ys attribute. Interpreted as "data space" units
    by default.
    """)

    x_range_name = String('default', help="""
    A particular (named) x-range to use for computing screen locations when
    rendering box annotations on the plot. If unset, use the default x-range.
    """)

    y_range_name = String('default', help="""
    A particular (named) y-range to use for computing screen locations when
    rendering box annotations on the plot. If unset, use the default y-range.
    """)

    line_props = Include(LineProps, use_prefix=False, help="""
    The %s values for the polygon.
    """)

    line_alpha = Override(default=0.3)

    line_color = Override(default="#cccccc")

    fill_props = Include(FillProps, use_prefix=False, help="""
    The %s values for the polygon.
    """)

    fill_alpha = Override(default=0.4)

    fill_color = Override(default="#fff9ba")

class Span(Annotation):
    """ Render a horizontal or vertical line span.

    """

    location = Float(help="""
    The location of the span, along ``dimension``.
    """)

    location_units = Enum(SpatialUnits, default='data', help="""
    The unit type for the location attribute. Interpreted as "data space"
    units by default.
    """)

    dimension = Enum(Dimension, default='width', help="""
    The direction of the span.
    """)

    x_range_name = String('default', help="""
    A particular (named) x-range to use for computing screen locations when
    rendering annotations on the plot. If unset, use the default x-range.
    """)

    y_range_name = String('default', help="""
    A particular (named) y-range to use for computing screen locations when
    rendering annotations on the plot. If unset, use the default y-range.
    """)

    render_mode = Enum(RenderMode, default="canvas", help="""
    Specifies whether the span is rendered as a canvas element or as an
    css element overlaid on the canvas. The default mode is "canvas".

    .. warning::
        The line_dash and line_dash_offset attributes aren't supported if
        the render_mode is set to "css"

    """)

    line_props = Include(LineProps, use_prefix=False, help="""
    The %s values for the span.
    """)

class Title(TextAnnotation):
    ''' Render a single title box as an annotation.

    '''

    text = String(help="""
    The text value to render.
    """)

    vertical_align = Enum(VerticalAlign, default='bottom', help="""
    Aligment of the text in its enclosing space, *across* the direction of the text.
    """)

    align = Enum(TextAlign, default='left', help="""
    Aligment of the text in its enclosing space, *along* the direction of the text.
    """)

    offset = Float(default=0, help="""
    Offset the text by a number of pixels (can be positive or negative). Shifts the text in
    different directions based on the location of the title:

        * above: shifts title right
        * right: shifts title down
        * below: shifts title right
        * left: shifts title up

    """)

    text_font = String(default="helvetica", help="""
    Name of a font to use for rendering text, e.g., ``'times'``,
    ``'helvetica'``.

    """)

    text_font_size = FontSizeSpec(default=value("10pt"))

    text_font_style = Enum(FontStyle, default="bold", help="""
    A style to use for rendering text.

    Acceptable values are:

    - ``'normal'`` normal text
    - ``'italic'`` *italic text*
    - ``'bold'`` **bold text**

    """)

    text_color = ColorSpec(default="#444444", help="""
    A color to use to fill text with.

    Acceptable values are:

    - any of the 147 named `CSS colors`_, e.g ``'green'``, ``'indigo'``
    - an RGB(A) hex value, e.g., ``'#FF0000'``, ``'#44444444'``
    - a 3-tuple of integers (r,g,b) between 0 and 255
    - a 4-tuple of (r,g,b,a) where r,g,b are integers between 0..255 and a is between 0..1

    .. _CSS colors: http://www.w3schools.com/cssref/css_colornames.asp

    """)

    text_alpha = NumberSpec(default=1.0, help="""
    An alpha value to use to fill text with.

    Acceptable values are floating point numbers between 0 (transparent)
    and 1 (opaque).

    """)

    background_props = Include(FillProps, use_prefix=True, help="""
    The %s values for the text bounding box.
    """)

    background_fill_color = Override(default=None)

    border_props = Include(LineProps, use_prefix=True, help="""
    The %s values for the text bounding box.
    """)

    border_line_color = Override(default=None)

    render_mode = Enum(RenderMode, default="canvas", help="""
    Specifies whether the text is rendered as a canvas element or as an
    css element overlaid on the canvas. The default mode is "canvas".

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
    """)

    show_arrow = Bool(default=True, help="""
    Whether tooltip's arrow should be showed.
    """)

# This only exists to prevent a circular import.
def _DEFAULT_TEE():
    from .arrow_heads import TeeHead
    return TeeHead(level="underlay", size=10)

class Whisker(Annotation):
    ''' Render a whisker along a dimension.

    '''

    lower = DistanceSpec(help="""
    The coordinates of the lower end of the whiskers.
    """)

    lower_head = Instance('.models.arrow_heads.ArrowHead', default=_DEFAULT_TEE, help="""
    Instance of ArrowHead.
    """)

    upper = DistanceSpec(help="""
    The coordinations of the upper end of the whiskers.
    """)

    upper_head = Instance('.models.arrow_heads.ArrowHead', default=_DEFAULT_TEE, help="""
    Instance of ArrowHead.
    """)

    base = DistanceSpec(help="""
    The orthogonal coordinates of the upper and lower values.
    """)

    dimension = Enum(Dimension, default='height', help="""
    The direction of the band.
    """)

    source = Instance(DataSource, default=lambda: ColumnDataSource(), help="""
    Local data source to use when rendering annotations on the plot.
    """)

    x_range_name = String('default', help="""
    A particular (named) x-range to use for computing screen locations when
    rendering annotations on the plot. If unset, use the default x-range.
    """)

    y_range_name = String('default', help="""
    A particular (named) y-range to use for computing screen locations when
    rendering annotations on the plot. If unset, use the default y-range.
    """)

    line_props = Include(LineProps, use_prefix=False, help="""
    The %s values for the whisker body.
    """)

    level = Override(default="underlay")

class ToolbarPanel(Annotation): # TODO: this shouldn't be an annotation

    toolbar = Instance(".models.tools.Toolbar", help="""
    A toolbar to display.
    """)
