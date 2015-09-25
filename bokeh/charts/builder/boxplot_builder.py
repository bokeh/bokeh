"""This is the Bokeh charts interface. It gives you a high level API to build
complex plot is a simple way.

This is the BoxPlot class which lets you build your BoxPlot plots just passing
the arguments to the Chart class and calling the proper functions.
It also add a new chained stacked method.
"""
#-----------------------------------------------------------------------------
# Copyright (c) 2012 - 2014, Continuum Analytics, Inc. All rights reserved.
#
# Powered by the Bokeh Development Team.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Imports
#-----------------------------------------------------------------------------

from __future__ import absolute_import

from .._builder import create_and_build
from ...models import Range1d
from ...properties import Bool, String
from .bar_builder import BarBuilder
from ..glyphs import BoxGlyph
from ..utils import title_from_columns

#-----------------------------------------------------------------------------
# Classes and functions
#-----------------------------------------------------------------------------


def BoxPlot(data, label=None, values=None, color=None, group=None,
            xscale="categorical", yscale="linear", xgrid=False,
            ygrid=True, continuous_range=None, **kw):
    """Generate a box plot from table-like and column-like inputs."""

    if continuous_range and not isinstance(continuous_range, Range1d):
        raise ValueError(
            "continuous_range must be an instance of bokeh.models.ranges.Range1d"
        )

    # The continuous_range is the y_range (until we implement HBar charts)
    y_range = continuous_range
    kw['label'] = label
    kw['values'] = values
    kw['color'] = color
    kw['group'] = group
    kw['xscale'] = xscale
    kw['yscale'] = yscale
    kw['xgrid'] = xgrid
    kw['ygrid'] = ygrid
    kw['y_range'] = y_range

    return create_and_build(BoxPlotBuilder, data, **kw)


class BoxPlotBuilder(BarBuilder):
    """Produces Box Glyphs for groups of data.

    Handles box plot options to produce one to many boxes,
    which are used to describe the distribution of a variable.

    """

    # TODO: (bev) should be an enumeration
    marker = String(help="""
    The marker type to use (e.g., ``circle``) if outliers=True.
    """)

    # ToDo: implement outliers toggle
    outliers = Bool(help="""
    Whether to display markers for any outliers.
    """)

    glyph = BoxGlyph

    def _setup(self):
        if self.ylabel is None:
            self.ylabel = self.values.selected_title

        if self.xlabel is None:
            self.xlabel = title_from_columns(self.attributes['label'].columns)
