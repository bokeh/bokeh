""" Guide renderers for various kinds of axes that can be added to
Bokeh plots

"""
from __future__ import absolute_import

from ..core.properties import abstract
from ..core.properties import (Int, Float, String, Enum, Datetime, Auto, Instance,
                          Tuple, Either, Include, Override)
from ..core.property_mixins import LineProps, TextProps

from .renderers import GuideRenderer
from .tickers import Ticker, BasicTicker, LogTicker, CategoricalTicker, DatetimeTicker
from .formatters import (TickFormatter, BasicTickFormatter, LogTickFormatter,
                         CategoricalTickFormatter, DatetimeTickFormatter)

@abstract
class Axis(GuideRenderer):
    """ A base class that defines common properties for all axis types.
    ``Axis`` is not generally useful to instantiate on its own.

    """

    bounds = Either(Auto, Tuple(Float, Float), Tuple(Datetime, Datetime), help="""
    Bounds for the rendered axis. If unset, the axis will span the
    entire plot in the given dimension.
    """)

    x_range_name = String('default', help="""
    A particular (named) x-range to use for computing screen
    locations when rendering an axis on the plot. If unset, use the
    default x-range.
    """)

    y_range_name = String('default', help="""
    A particular (named) y-range to use for computing screen
    locations when rendering an axis on the plot. If unset, use the
    default y-range.
    """)

    ticker = Instance(Ticker, help="""
    A Ticker to use for computing locations of axis components.
    """)

    formatter = Instance(TickFormatter, help="""
    A TickFormatter to use for formatting the visual appearance
    of ticks.
    """)

    axis_label = String(default='', help="""
    A text label for the axis, displayed parallel to the axis rule.

    .. note::
        LaTeX notation is not currently supported; please see
        :bokeh-issue:`647` to track progress or contribute.

    """)

    axis_label_standoff = Int(default=5, help="""
    The distance in pixels that the axis labels should be offset
    from the tick labels.
    """)

    axis_label_props = Include(TextProps, help="""
    The %s of the axis label.
    """)

    axis_label_text_font_size = Override(default={'value': "10pt"})

    axis_label_text_font_style = Override(default="italic")

    major_label_standoff = Int(default=5, help="""
    The distance in pixels that the major tick labels should be
    offset from the associated ticks.
    """)

    major_label_orientation = Either(Enum("horizontal", "vertical"), Float, help="""
    What direction the major label text should be oriented. If a i
    number is supplied, the angle of the text is measured from horizontal.
    """)

    major_label_props = Include(TextProps, help="""
    The %s of the major tick labels.
    """)

    major_label_text_align = Override(default="center")

    major_label_text_baseline = Override(default="alphabetic")

    major_label_text_font_size = Override(default={'value': "8pt"})

    axis_props = Include(LineProps, help="""
    The %s of the axis line.
    """)

    major_tick_props = Include(LineProps, help="""
    The %s of the major ticks.
    """)

    major_tick_in = Int(default=2, help="""
    The distance in pixels that major ticks should extend into the
    main plot area.
    """)

    major_tick_out = Int(default=6, help="""
    The distance in pixels that major ticks should extend out of the
    main plot area.
    """)

    minor_tick_props = Include(LineProps, help="""
    The %s of the minor ticks.
    """)

    minor_tick_in = Int(default=0, help="""
    The distance in pixels that minor ticks should extend into the
    main plot area.
    """)

    minor_tick_out = Int(default=4, help="""
    The distance in pixels that major ticks should extend out of the
    main plot area.
    """)

@abstract
class ContinuousAxis(Axis):
    """ A base class for all numeric, non-categorical axes types.
    ``ContinuousAxis`` is not generally useful to instantiate on its own.

    """
    pass

class LinearAxis(ContinuousAxis):
    """ An axis that picks nice numbers for tick locations on a
    linear scale. Configured with a ``BasicTickFormatter`` by default.

    """
    ticker = Override(default=lambda: BasicTicker())

    formatter = Override(default=lambda: BasicTickFormatter())

class LogAxis(ContinuousAxis):
    """ An axis that picks nice numbers for tick locations on a
    log scale. Configured with a ``LogTickFormatter`` by default.

    """
    ticker = Override(default=lambda: LogTicker())

    formatter = Override(default=lambda: LogTickFormatter())

class CategoricalAxis(Axis):
    """ An axis that picks evenly spaced tick locations for a
    collection of categories/factors.

    """
    ticker = Override(default=lambda: CategoricalTicker())

    formatter = Override(default=lambda: CategoricalTickFormatter())

class DatetimeAxis(LinearAxis):
    """ An LinearAxis that picks nice numbers for tick locations on
    a datetime scale. Configured with a ``DatetimeTickFormatter`` by
    default.

    """

    ticker = Override(default=lambda: DatetimeTicker())

    formatter = Override(default=lambda: DatetimeTickFormatter())
