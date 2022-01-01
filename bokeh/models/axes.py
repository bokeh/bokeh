#-----------------------------------------------------------------------------
# Copyright (c) 2012 - 2022, Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------
''' Guide renderers for various kinds of axes that can be added to
Bokeh plots

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

# Bokeh imports
from ..core.enums import TickLabelOrientation
from ..core.has_props import abstract
from ..core.properties import (
    Auto,
    Datetime,
    Dict,
    Either,
    Enum,
    Factor,
    Float,
    Include,
    Instance,
    Int,
    Null,
    Nullable,
    Override,
    Seq,
    String,
    TextLike,
    Tuple,
)
from ..core.property_mixins import ScalarLineProps, ScalarTextProps
from .formatters import (
    BasicTickFormatter,
    CategoricalTickFormatter,
    DatetimeTickFormatter,
    LogTickFormatter,
    MercatorTickFormatter,
    TickFormatter,
)
from .labeling import AllLabels, LabelingPolicy
from .renderers import GuideRenderer
from .tickers import (
    BasicTicker,
    CategoricalTicker,
    DatetimeTicker,
    FixedTicker,
    LogTicker,
    MercatorTicker,
    Ticker,
)

#-----------------------------------------------------------------------------
# Globals and constants
#-----------------------------------------------------------------------------

__all__ = (
    'Axis',
    'CategoricalAxis',
    'ContinuousAxis',
    'DatetimeAxis',
    'LinearAxis',
    'LogAxis',
    'MercatorAxis',
)

#-----------------------------------------------------------------------------
# General API
#-----------------------------------------------------------------------------

@abstract
class Axis(GuideRenderer):
    ''' A base class that defines common properties for all axis types.

    '''

    bounds = Either(Auto, Tuple(Float, Float), Tuple(Datetime, Datetime), help="""
    Bounds for the rendered axis. If unset, the axis will span the
    entire plot in the given dimension.
    """)

    ticker = Instance(Ticker, help="""
    A Ticker to use for computing locations of axis components.

    The property may also be passed a sequence of floating point numbers as
    a shorthand for creating and configuring a ``FixedTicker``, e.g. the
    following code

    .. code-block:: python

        from bokeh.plotting import figure

        p = figure()
        p.xaxis.ticker = [10, 20, 37.4]

    is equivalent to:

    .. code-block:: python

        from bokeh.plotting import figure
        from bokeh.models import FixedTicker

        p = figure()
        p.xaxis.ticker = FixedTicker(ticks=[10, 20, 37.4])

    """).accepts(Seq(Float), lambda ticks: FixedTicker(ticks=ticks))

    formatter = Instance(TickFormatter, help="""
    A ``TickFormatter`` to use for formatting the visual appearance
    of ticks.
    """)

    axis_label = Nullable(TextLike, help="""
    A text or LaTeX notation label for the axis, displayed parallel to the axis rule.
    """)

    axis_label_standoff = Int(default=5, help="""
    The distance in pixels that the axis labels should be offset
    from the tick labels.
    """)

    axis_label_props = Include(ScalarTextProps, prefix="axis_label", help="""
    The {prop} of the axis label.
    """)

    axis_label_text_font_size = Override(default="13px")

    axis_label_text_font_style = Override(default="italic")

    major_label_standoff = Int(default=5, help="""
    The distance in pixels that the major tick labels should be
    offset from the associated ticks.
    """)

    major_label_orientation = Either(Enum("horizontal", "vertical"), Float, help="""
    What direction the major label text should be oriented. If a
    number is supplied, the angle of the text is measured from horizontal.
    """)

    major_label_overrides = Dict(Either(Float, String), TextLike, default={}, help="""
    Provide explicit tick label values for specific tick locations that
    override normal formatting.
    """)

    major_label_policy = Instance(LabelingPolicy, default=lambda: AllLabels(), help="""
    Allows to filter out labels, e.g. declutter labels to avoid overlap.
    """)

    major_label_props = Include(ScalarTextProps, prefix="major_label", help="""
    The {prop} of the major tick labels.
    """)

    major_label_text_align = Override(default="center")

    major_label_text_baseline = Override(default="alphabetic")

    major_label_text_font_size = Override(default="11px")

    axis_props = Include(ScalarLineProps, prefix="axis", help="""
    The {prop} of the axis line.
    """)

    major_tick_props = Include(ScalarLineProps,prefix="major_tick", help="""
    The {prop} of the major ticks.
    """)

    major_tick_in = Int(default=2, help="""
    The distance in pixels that major ticks should extend into the
    main plot area.
    """)

    major_tick_out = Int(default=6, help="""
    The distance in pixels that major ticks should extend out of the
    main plot area.
    """)

    minor_tick_props = Include(ScalarLineProps, prefix="minor_tick", help="""
    The {prop} of the minor ticks.
    """)

    minor_tick_in = Int(default=0, help="""
    The distance in pixels that minor ticks should extend into the
    main plot area.
    """)

    minor_tick_out = Int(default=4, help="""
    The distance in pixels that major ticks should extend out of the
    main plot area.
    """)

    fixed_location = Either(Null, Float, Factor, help="""
    Set to specify a fixed coordinate location to draw the axis. The direction
    of ticks and major labels is determined by the side panel that the axis
    belongs to.

    .. note::
        Axes labels are suppressed when axes are positioned at fixed locations
        inside the central plot area.
    """)

@abstract
class ContinuousAxis(Axis):
    ''' A base class for all numeric, non-categorical axes types.

    '''
    pass

class LinearAxis(ContinuousAxis):
    ''' An axis that picks nice numbers for tick locations on a
    linear scale. Configured with a ``BasicTickFormatter`` by default.

    '''
    ticker = Override(default=lambda: BasicTicker())

    formatter = Override(default=lambda: BasicTickFormatter())

class LogAxis(ContinuousAxis):
    ''' An axis that picks nice numbers for tick locations on a
    log scale. Configured with a ``LogTickFormatter`` by default.

    '''
    ticker = Override(default=lambda: LogTicker())

    formatter = Override(default=lambda: LogTickFormatter())

class CategoricalAxis(Axis):
    ''' An axis that displays ticks and labels for categorical ranges.

    The ``CategoricalAxis`` can handle factor ranges with up to two levels of
    nesting, including drawing a separator line between top-level groups of
    factors.

    '''
    ticker = Override(default=lambda: CategoricalTicker())

    formatter = Override(default=lambda: CategoricalTickFormatter())

    separator_props = Include(ScalarLineProps, prefix="separator", help="""
    The {prop} of the separator line between top-level categorical groups.

    This property always applies to factors in the outermost level of nesting.
    """)

    separator_line_color = Override(default="lightgrey")
    separator_line_width = Override(default=2)

    group_props = Include(ScalarTextProps, prefix="group", help="""
    The {prop} of the group categorical labels.

    This property always applies to factors in the outermost level of nesting.
    If the list of categorical factors is flat (i.e. no nesting) then this
    property has no effect.
    """)

    group_label_orientation = Either(Enum(TickLabelOrientation), Float, default="parallel", help="""
    What direction the group label text should be oriented.

    If a number is supplied, the angle of the text is measured from horizontal.

    This property always applies to factors in the outermost level of nesting.
    If the list of categorical factors is flat (i.e. no nesting) then this
    property has no effect.
    """)

    group_text_font_size = Override(default="11px")
    group_text_font_style = Override(default="bold")
    group_text_color = Override(default="grey")

    subgroup_props = Include(ScalarTextProps, prefix="subgroup", help="""
    The {prop} of the subgroup categorical labels.

    This property always applies to factors in the middle level of nesting.
    If the list of categorical factors is has only zero or one levels of nesting,
    then this property has no effect.
    """)

    subgroup_label_orientation = Either(Enum(TickLabelOrientation), Float, default="parallel", help="""
    What direction the subgroup label text should be oriented.

    If a number is supplied, the angle of the text is measured from horizontal.

    This property always applies to factors in the middle level of nesting.
    If the list of categorical factors is has only zero or one levels of nesting,
    then this property has no effect.
    """)

    subgroup_text_font_size = Override(default="11px")
    subgroup_text_font_style = Override(default="bold")

class DatetimeAxis(LinearAxis):
    ''' A ``LinearAxis`` that picks nice numbers for tick locations on
    a datetime scale. Configured with a ``DatetimeTickFormatter`` by
    default.

    '''

    ticker = Override(default=lambda: DatetimeTicker())

    formatter = Override(default=lambda: DatetimeTickFormatter())

class MercatorAxis(LinearAxis):
    ''' An axis that picks nice numbers for tick locations on a
    Mercator scale. Configured with a ``MercatorTickFormatter`` by default.

    Args:
        dimension ('lat' or 'lon', optional) :
            Whether this axis will display latitude or longitude values.
            (default: 'lat')

    '''
    def __init__(self, dimension='lat', **kw) -> None:
        super().__init__(**kw)

        # Just being careful. It would be defeat the purpose for anyone to actually
        # configure this axis with different kinds of tickers or formatters.
        if isinstance(self.ticker, MercatorTicker):
            self.ticker.dimension = dimension
        if isinstance(self.formatter, MercatorTickFormatter):
            self.formatter.dimension = dimension

    ticker = Override(default=lambda: MercatorTicker())

    formatter = Override(default=lambda: MercatorTickFormatter())

#-----------------------------------------------------------------------------
# Dev API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Private API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Code
#-----------------------------------------------------------------------------
