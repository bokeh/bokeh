#-----------------------------------------------------------------------------
# Copyright (c) Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------
'''

'''

#-----------------------------------------------------------------------------
# Boilerplate
#-----------------------------------------------------------------------------
from __future__ import annotations

import logging # isort:skip
log = logging.getLogger(__name__)

#-----------------------------------------------------------------------------
# Imports
#-----------------------------------------------------------------------------

# Standard library imports
from typing import TYPE_CHECKING, Any

# Bokeh imports
from ...core.enums import (
    Align,
    AlternationPolicy,
    Anchor as HVAlign,
    HAlign,
    LegendClickPolicy,
    LegendLocation,
    Location,
    Orientation,
    VAlign,
)
from ...core.has_props import abstract
from ...core.properties import (
    Auto,
    Bool,
    CoordinateLike,
    Dict,
    Either,
    Enum,
    Float,
    Include,
    Instance,
    InstanceDefault,
    Int,
    List,
    NonNegative,
    Nullable,
    NullStringSpec,
    Override,
    Positive,
    Seq,
    String,
    TextLike,
    Tuple,
    value,
)
from ...core.property.vectorization import Field
from ...core.property_aliases import AutoAnchor
from ...core.property_mixins import (
    ScalarFillProps,
    ScalarHatchProps,
    ScalarLineProps,
    ScalarTextProps,
)
from ...core.validation import error
from ...core.validation.errors import (
    BAD_COLUMN_NAME,
    NON_MATCHING_DATA_SOURCES_ON_LEGEND_ITEM_RENDERERS,
    NON_MATCHING_SCALE_BAR_UNIT,
)
from ...events import LegendItemClick
from ...model import Model
from ..formatters import TickFormatter
from ..labeling import LabelingPolicy, NoOverlap
from ..mappers import ColorMapper
from ..ranges import Range
from ..renderers import GlyphRenderer
from ..tickers import FixedTicker, Ticker
from .annotation import Annotation
from .dimensional import Dimensional, MetricLength

if TYPE_CHECKING:
    from ...util.callback_manager import EventCallback as PyEventCallback
    from ..callbacks import Callback as JsEventCallback

#-----------------------------------------------------------------------------
# Globals and constants
#-----------------------------------------------------------------------------

__all__ = (
    "ColorBar",
    "ContourColorBar",
    "Legend",
    "LegendItem",
    "ScaleBar",
)

#-----------------------------------------------------------------------------
# General API
#-----------------------------------------------------------------------------

@abstract
class BaseColorBar(Annotation):
    ''' Abstract base class for color bars.

    '''

    # explicit __init__ to support Init signatures
    def __init__(self, *args, **kwargs) -> None:
        super().__init__(*args, **kwargs)

    location = Either(Enum(HVAlign), Tuple(Float, Float), default="top_right", help="""
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

    title = Nullable(TextLike, help="""
    The title text to render.
    """)

    title_props = Include(ScalarTextProps, prefix="title", help="""
    The {prop} values for the title text.
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

    major_label_overrides = Dict(Either(Float, String), TextLike, default={}, help="""
    Provide explicit tick label values for specific tick locations that
    override normal formatting.
    """)

    major_label_policy = Instance(LabelingPolicy, default=InstanceDefault(NoOverlap), help="""
    Allows to filter out labels, e.g. declutter labels to avoid overlap.
    """)

    margin = Int(30, help="""
    Amount of margin (in pixels) around the outside of the color bar.
    """)

    padding = Int(10, help="""
    Amount of padding (in pixels) between the color scale and color bar border.
    """)

    major_label_props = Include(ScalarTextProps, prefix="major_label", help="""
    The {prop} of the major tick labels.
    """)

    major_label_text_font_size = Override(default="11px")

    label_standoff = Int(5, help="""
    The distance (in pixels) to separate the tick labels from the color bar.
    """)

    major_tick_props = Include(ScalarLineProps, prefix="major_tick", help="""
    The {prop} of the major ticks.
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

    minor_tick_props = Include(ScalarLineProps, prefix="minor_tick", help="""
    The {prop} of the minor ticks.
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

    bar_props = Include(ScalarLineProps, prefix="bar", help="""
    The {prop} for the color scale bar outline.
    """)

    bar_line_color = Override(default=None)

    border_props = Include(ScalarLineProps, prefix="border", help="""
    The {prop} for the color bar border outline.
    """)

    border_line_color = Override(default=None)

    background_props = Include(ScalarFillProps, prefix="background", help="""
    The {prop} for the color bar background style.
    """)

    background_fill_color = Override(default="#ffffff")

    background_fill_alpha = Override(default=0.95)


class ColorBar(BaseColorBar):
    ''' Render a color bar based on a color mapper.

    See :ref:`ug_basic_annotations_color_bars` for information on plotting color bars.

    '''
    # explicit __init__ to support Init signatures
    def __init__(self, *args, **kwargs) -> None:
        super().__init__(*args, **kwargs)

    color_mapper = Instance(ColorMapper, help="""
    A color mapper containing a color palette to render.

    .. warning::
        If the `low` and `high` attributes of the ``ColorMapper`` aren't set, ticks
        and tick labels won't be rendered. Additionally, if a ``LogTicker`` is
        passed to the `ticker` argument and either or both of the logarithms
        of `low` and `high` values of the color_mapper are non-numeric
        (i.e. `low=0`), the tick and tick labels won't be rendered.
    """)

    display_low = Nullable(Float, help="""
    The lowest value to display in the color bar. The whole of the color entry
    containing this value is shown.
    """)

    display_high = Nullable(Float, help="""
    The highest value to display in the color bar. The whole of the color entry
    containing this value is shown.
    """)


class ContourColorBar(BaseColorBar):
    ''' Color bar used for contours.

    Supports displaying hatch patterns and line styles that contour plots may
    have as well as the usual fill styles.

    Do not create these objects manually, instead use ``ContourRenderer.color_bar``.

    '''
    # explicit __init__ to support Init signatures
    def __init__(self, *args, **kwargs) -> None:
        super().__init__(*args, **kwargs)

    fill_renderer = Instance(GlyphRenderer, help="""
    Glyph renderer used for filled contour polygons.
    """)

    line_renderer = Instance(GlyphRenderer, help="""
    Glyph renderer used for contour lines.
    """)

    levels = Seq(Float, default=[], help="""
    Levels at which the contours are calculated.
    """)


class LegendItem(Model):
    '''

    '''
    def __init__(self, *args, **kwargs) -> None:
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

    visible = Bool(default=True, help="""
    Whether the legend item should be displayed. See
    :ref:`ug_basic_annotations_legends_item_visibility` in the user guide.
    """)

    @error(NON_MATCHING_DATA_SOURCES_ON_LEGEND_ITEM_RENDERERS)
    def _check_data_sources_on_renderers(self):
        if isinstance(self.label, Field):
            if len({r.data_source for r in self.renderers}) != 1:
                return str(self)

    @error(BAD_COLUMN_NAME)
    def _check_field_label_on_data_source(self):
        if isinstance(self.label, Field):
            if len(self.renderers) < 1:
                return str(self)
            source = self.renderers[0].data_source
            if self.label.field not in source.column_names:
                return str(self)

class Legend(Annotation):
    ''' Render informational legends for a plot.

    See :ref:`ug_basic_annotations_legends` for information on plotting legends.

    '''

    # explicit __init__ to support Init signatures
    def __init__(self, *args, **kwargs) -> None:
        super().__init__(*args, **kwargs)

    location = Either(Enum(LegendLocation), Tuple(Float, Float), default="top_right", help="""
    The location where the legend should draw itself. It's either one of
    :class:`~bokeh.core.enums.LegendLocation`'s enumerated values, or a ``(x, y)``
    tuple indicating an absolute location absolute location in screen
    coordinates (pixels from the bottom-left corner).
    """)

    orientation = Enum(Orientation, default="vertical", help="""
    Whether the legend entries should be placed vertically or horizontally
    when they are drawn.
    """)

    ncols = Either(Positive(Int), Auto, default="auto", help="""
    The number of columns in the legend's layout. By default it's either
    one column if the orientation is vertical or the number of items in
    the legend otherwise. ``ncols`` takes precendence over ``nrows`` for
    horizonal orientation.
    """)

    nrows = Either(Positive(Int), Auto, default="auto", help="""
    The number of rows in the legend's layout. By default it's either
    one row if the orientation is horizonal or the number of items in
    the legend otherwise. ``nrows`` takes precendence over ``ncols``
    for vertical orientation.
    """)

    title = Nullable(String, help="""
    The title text to render.
    """)

    title_props = Include(ScalarTextProps, prefix="title", help="""
    The {prop} values for the title text.
    """)

    title_text_font_size = Override(default="13px")

    title_text_font_style = Override(default="italic")

    title_location = Enum(Location, default="above", help="""
    Specifies on which side of the legend the title will be located.
    Titles on the left or right side will be rotated accordingly.
    """)

    title_standoff = Int(5, help="""
    The distance (in pixels) to separate the title from the legend.
    """)

    border_props = Include(ScalarLineProps, prefix="border", help="""
    The {prop} for the legend border outline.
    """)

    border_line_color = Override(default="#e5e5e5")

    border_line_alpha = Override(default=0.5)

    background_props = Include(ScalarFillProps, prefix="background", help="""
    The {prop} for the legend background style.
    """)

    item_background_props = Include(ScalarFillProps, prefix="item_background", help="""
    The {prop} for the legend items' background style.
    """)

    inactive_props = Include(ScalarFillProps, prefix="inactive", help="""
    The {prop} for the legend item style when inactive. These control an overlay
    on the item that can be used to obscure it when the corresponding glyph
    is inactive (e.g. by making it semi-transparent).
    """)

    click_policy = Enum(LegendClickPolicy, default="none", help="""
    Defines what happens when a lengend's item is clicked.
    """)

    item_background_policy = Enum(AlternationPolicy, default="none", help="""
    Defines which items to style, if ``item_background_fill`` is configured.
    """)

    background_fill_color = Override(default="#ffffff")

    background_fill_alpha = Override(default=0.95)

    item_background_fill_color = Override(default="#f1f1f1")

    item_background_fill_alpha = Override(default=0.8)

    inactive_fill_color = Override(default="white")

    inactive_fill_alpha = Override(default=0.7)

    label_props = Include(ScalarTextProps, prefix="label", help="""
    The {prop} for the legend labels.
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
            LegendItem(label="sin(x)",   renderers=[r0, r1]),
            LegendItem(label="2*sin(x)", renderers=[r2]),
            LegendItem(label="3*sin(x)", renderers=[r3, r4])
        ])

    But as a convenience, can also be given more compactly as a list of tuples:

    .. code-block:: python

        legend = Legend(items=[
            ("sin(x)",   [r0, r1]),
            ("2*sin(x)", [r2]),
            ("3*sin(x)", [r3, r4])
        ])

    where each tuple is of the form: *(label, renderers)*.

    """).accepts(List(Tuple(String, List(Instance(GlyphRenderer)))),
        lambda items: [LegendItem(label=item[0], renderers=item[1]) for item in items])

    def on_click(self, handler: PyEventCallback) -> None:
        """ Set up a handler for legend item clicks. """
        self.on_event(LegendItemClick, handler)

    def js_on_click(self, handler: JsEventCallback) -> None:
        """ Set up a JavaScript handler for legend item clicks. """
        self.js_on_event(LegendItemClick, handler)

X = Either(Enum(HAlign), Float, CoordinateLike)
Y = Either(Enum(VAlign), Float, CoordinateLike)

Position = Either(Enum(HVAlign), Tuple(X, Y))
PositionUnits = Enum("data", "screen", "view", "percent")

class ScaleBar(Annotation):
    """ Represents a scale bar annotation.
    """

    # explicit __init__ to support Init signatures
    def __init__(self, *args: Any, **kwargs: Any) -> None:
        super().__init__(*args, **kwargs)

    @error(NON_MATCHING_SCALE_BAR_UNIT)
    def _check_non_matching_scale_bar_unit(self):
        if not self.dimensional.is_known(self.unit):
            return str(self)

    range = Either(Instance(Range), Auto, default="auto", help="""
    The range for which to display the scale.

    This can be either a range reference or ``"auto"``, in which case the
    scale bar will pick the default x or y range of the frame, depending
    on the orientation of the scale bar.
    """)

    unit = String(default="m", help="""
    The unit of the ``range`` property.
    """)

    dimensional = Instance(Dimensional, default=InstanceDefault(MetricLength), help="""
    Defines the units of measurement.
    """)

    orientation = Enum(Orientation, help="""
    Whether the scale bar should be oriented horizontally or vertically.
    """)

    location = Position(default="top_right", help="""
    Position of the scale bar within the parent container (usually cartesian frame).
    """)

    x_units = PositionUnits(default="data", help="""
    The interpretation of x coordinate values provided in ``position`` property.
    """)

    y_units = PositionUnits(default="data", help="""
    The interpretation of y coordinate values provided in ``position`` property.
    """)

    anchor = AutoAnchor(default="auto", help="""
    The origin for scale bar positioning.

    If ``"auto"`` in any or both dimensions, then the anchor in these dimensions
    will be determined based on the position, so that the scale bar looks good.
    """)

    length_sizing = Enum("adaptive", "exact", help="""
    Defines how the length of the bar is interpreted.

    This can either be:

    * ``"adaptive"`` - the computed length is fit into a set of ticks provided
      be the dimensional model. If no ticks are provided, then the behavior
      is the same as if ``"exact"`` sizing was used
    * ``"exact"`` - the computed length is used as-is

    """)

    bar_length = NonNegative(Either(Float, Int))(default=0.2, help="""
    The length of the bar.

    This is either a fraction of the frame, a number of pixels or
    distance in the data space, depending on the configuration of
    ``bar_length_units``.
    """)

    bar_length_units = Enum("screen", "data", "percent", default="screen", help="""
    Defines how to interpret ``bar_length``.

    Supported values are:

    * ``"screen"`` - the length is provided in pixels or as a percentage of
      the parent container (e.g. the frame) if the value provided is in
      ``[0, 1]`` range
    * ``"data"`` - the length is provided in data space units
    * ``"percent"`` - the length is a percentage of the parent container (e.g. the frame)

    .. note::
        ``"data"`` units assume a linear scale or a linear like scale (e.g.
        categorical scale) is used. Otherwise the length of the bar would
        be position dependent.
    """)

    bar_line = Include(ScalarLineProps, prefix="bar", help="""
    The {prop} values for the bar line style.
    """)

    margin = Int(default=10, help="""
    Amount of margin (in pixels) around the outside of the scale bar.
    """)

    padding = Int(default=10, help="""
    Amount of padding (in pixels) between the contents of the scale bar
    and its border.
    """)

    label = String(default="@{value} @{unit}", help="""
    The label template.

    This can use special variables:

    * ``@{value}`` The current value. Optionally can provide a number
      formatter with e.g. ``@{value}{%.2f}``.
    * ``@{unit}`` The unit of measurement.

    """)

    label_text = Include(ScalarTextProps, prefix="label", help="""
    The {prop} values for the label text style.
    """)

    label_align = Enum(Align, default="center", help="""
    Specifies where to align scale bar's label along the bar.

    This property effective when placing the label above or below
    a horizontal scale bar, or left or right of a vertical one.
    """)

    label_location = Enum(Location, default="below", help="""
    Specifies on which side of the scale bar the label will be located.
    """)

    label_standoff = Int(default=5, help="""
    The distance (in pixels) to separate the label from the scale bar.
    """)

    title = String(default="", help="""
    The title text to render.
    """)

    title_text = Include(ScalarTextProps, prefix="title", help="""
    The {prop} values for the title text style.
    """)

    title_align = Enum(Align, default="center", help="""
    Specifies where to align scale bar's title along the bar.

    This property effective when placing the title above or below
    a horizontal scale bar, or left or right of a vertical one.
    """)

    title_location = Enum(Location, default="above", help="""
    Specifies on which side of the legend the title will be located.
    """)

    title_standoff = Int(default=5, help="""
    The distance (in pixels) to separate the title from the scale bar.
    """)

    ticker = Instance(Ticker, default=InstanceDefault(FixedTicker, ticks=[]), help="""
    A ticker to use for computing locations of axis components.

    Note that if using the default fixed ticker with no predefined ticks,
    then the appearance of the scale bar will be just a solid bar with
    no additional markings.
    """)

    border_line = Include(ScalarLineProps, prefix="border", help="""
    The {prop} for the scale bar border line style.
    """)

    background_fill = Include(ScalarFillProps, prefix="background", help="""
    The {prop} for the scale bar background fill style.
    """)

    background_hatch = Include(ScalarHatchProps, prefix="background", help="""
    The {prop} for the scale bar background hatch style.
    """)

    bar_line_width = Override(default=2)
    border_line_color = Override(default="#e5e5e5")
    border_line_alpha = Override(default=0.5)
    border_line_width = Override(default=1)
    background_fill_color = Override(default="#ffffff")
    background_fill_alpha = Override(default=0.95)
    label_text_font_size = Override(default="13px")
    label_text_baseline = Override(default="middle")
    title_text_font_size = Override(default="13px")
    title_text_font_style = Override(default="italic")

#-----------------------------------------------------------------------------
# Dev API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Private API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Code
#-----------------------------------------------------------------------------
