""" Models for mapping values from one range or space to another.

"""
from __future__ import absolute_import

from ..plot_object import PlotObject
from ..properties import abstract
from ..properties import Float, Color, Enum, Seq, Dict
from ..enums import Palette
from .. import palettes

@abstract
class ColorMapper(PlotObject):
    """ Base class for color mapper types. `ColorMapper`` is not
    generally useful to instantiate on its own.

    """

class LinearColorMapper(ColorMapper):
    """ Map numbers in a range [*low*, *high*] linearly into a
    sequence of colors (a palette).

    For example, if the range is [0, 99] and the palette is
    ``['red', 'green', 'blue']``, the values would be mapped as
    follows::

             x < 0  : 'red'     # values < low are clamped
        0 >= x < 33 : 'red'
       33 >= x < 66 : 'green'
       66 >= x < 99 : 'blue'
       99 >= x      : 'blue'    # values > high are clamped

    """

    palette = Seq(Color, help="""
    A sequence of colors to use as the target palette for mapping.

    This property can also be set as a ``String``, to the name of
    any of the palettes shown in :ref:`bokeh_dot_palettes`.
    """).accepts(Enum(Palette), lambda pal: getattr(palettes, pal))

    low = Float(help="""
    The minimum value of the range to map into the palette. Values below
    this are clamped to ``low``.
    """)

    high = Float(help="""
    The maximum value of the range to map into the palette. Values above
    this are clamped to ``high``.
    """)

    # TODO: (jc) what is the color code for transparent?
    # TODO: (bev) better docstring
    reserve_color = Color("#ffffff", help="""
    Used by Abstract Rendering.
    """)

    # TODO: (bev) better docstring
    reserve_val = Float(default=None, help="""
    Used by Abstract Rendering.
    """)

    def __init__(self, palette=None, **kwargs):
        if palette is not None: kwargs['palette'] = palette
        super(LinearColorMapper, self).__init__(**kwargs)

class LinearBreaksColorMapper(ColorMapper):
    """ Map numbers in a range [*low*, *high*] linearly into a
    sequence of colors which are defined by a seires of breaks
    correlated to different colors.

    For example, if the breaks are specified 0, 0.5, 1 and the
    colors are defined as 'red', 'white', 'green', values 
    between 0 and 0.5 will smoothy vary between red and white
    while values between 0.5 and 1 will vary between white and
    green.
    """

    palette = Dict(Float, Color, help="""
    A python dictionary correlating a value to a Color.
    """)

    alpha = Seq(Float, help="""
    A python array, the same length as the dictionary with the
    desired alpha values
    """
    )

    def __init__(self, palette, alpha=[1], **kwargs):
        if palette is not None: kwargs['palette'] = palette

        if len(alpha) == 1:
            alpha = alpha * len(palette)
        else:
            if len(alpha) != len(palette):
                # Got an error and I am not sure how to proceed
                error('The length of alpha values does not match the number of defined breaks in the palette.')

        kwargs['alpha'] = alpha

        super(LinearBreaksColorMapper, self).__init__(**kwargs)
