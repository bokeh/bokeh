from __future__ import absolute_import

from bokeh.models import Glyph
from bokeh.core.properties import NumberSpec, AngleSpec, Include
from bokeh.core.property_mixins import LineProps, FillProps

class Gear(Glyph):
    """ Render gears.

    The details and nomenclature concerning gear construction can
    be quite involved. For more information, consult the `Wikipedia
    article for Gear`_.

    .. _Wikipedia article for Gear: http://en.wikipedia.org/wiki/Gear
    """

    __implementation__ = "gear.coffee"

    x = NumberSpec(help="""
    The x-coordinates of the center of the gears.
    """)

    y = NumberSpec(help="""
    The y-coordinates of the center of the gears.
    """)

    angle = AngleSpec(default=0, help="""
    The angle the gears are rotated from horizontal. [rad]
    """)

    module = NumberSpec(help="""
    A scaling factor, given by::

        m = p / pi

    where *p* is the circular pitch, defined as the distance from one
    face of a tooth to the corresponding face of an adjacent tooth on
    the same gear, measured along the pitch circle. [float]
    """)

    teeth = NumberSpec(help="""
    How many teeth the gears have. [int]
    """)

    pressure_angle = NumberSpec(default=20, help="""
    The complement of the angle between the direction that the teeth
    exert force on each other, and the line joining the centers of the
    two gears. [deg]
    """)

    shaft_size = NumberSpec(default=0.3, help="""
    The central gear shaft size as a percentage of the overall gear
    size. [float]
    """)

    internal = NumberSpec(default=False, help="""
    Whether the gear teeth are internal. [bool]
    """)

    line_props = Include(LineProps, use_prefix=False, help="""
    The %s values for the gears.
    """)

    fill_props = Include(FillProps, use_prefix=False, help="""
    The %s values for the gears.
    """)
