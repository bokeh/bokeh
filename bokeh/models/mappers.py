""" Models for mapping values from one range or space to another.

"""
from __future__ import absolute_import

from ..plot_object import PlotObject
from ..properties import abstract
from ..properties import Float, Color, Enum, Seq, String
from ..enums import Palette
from .. import colors as bkColors
from .. import palettes as bkPalettes

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

class SegmentedColorMapper(ColorMapper):
    """ Map numbers in a range [*low*, *high*] linearly into a
    sequence of colors which are defined by a seires of breaks
    correlated to different colors.

    For example, if the breaks are specified 0, 0.5, 1 and the
    colors are defined as 'red', 'white', 'green', values 
    between 0 and 0.5 will smoothy vary between red and white
    while values between 0.5 and 1 will vary between white and
    green.
    """

    palette = Seq(Color, help="""
    A sequence of colors to use as the target palette for mapping.

    This property can also be set as a ``String``, to the name of
    any of the palettes shown in :ref:`bokeh_dot_palettes`.
    """).accepts(Enum(Palette), lambda pal: getattr(palettes, pal))

    segments = Seq(Float, help="""
    A listing of values which are directly tied to the 
    colors defined in the palette.  The list must have
    at least two elements.  If there are exactly two
    elements, then the resulting colormap will be
    interpolated between these two values and across
    all of the colors defined in the palette.  If there
    are more than two colors, the length must match the
    number of colors in the palette.  In this configuration
    each segment value is tied to the palette color of the
    same index.  This argument is optional.  If it is
    not provided, the min and max of the data will be used.
    """)

    alpha = Seq(Float, help="""
    A python array, the same length as the dictionary with the
    desired alpha values
    """
    )

    interpolationMethod = String(default='linear', help="""
    A string which describes the method of interpolation.  The default, 'linear',
    will result in a gradual transition from one color to the next.  Other
    options are 'step' which will result in a single color for all values 
    which fall between the segment markers (an effective floor function) 
    """)

    def __init__(self, palette=None, segments=None, alpha=1, interpolationMethod='linear', **kwargs):
        if palette is not None: 
            # Lets do some work on the Palette to ensure that only hex values
            # or integers make it to the Javascipt.  The interpolation routines
            # require that we have the actual value of the colors.  Although 
            # it seems possible to convert named colors to individual colors
            # in the browser, it seemed hackish and non-trustworthy.  Lets
            # just do it here with some logic and always pass the JS a list 
            # of hex codes.

            # Define a dict to hold any alpha values that we might extract
            # from the different colors in the passed palette.  These can 
            # come from a 4-tuple or a 
            alpha_hold = {}

            # Check to see if this is a single string.  If this is the case,
            # this is likely a named preknown colormap.
            if not isinstance(palette, list):
                # We have a single item which has been passed.
                if not isinstance(palette, str):
                    ##### THROW ERROR: palette must be the name of a known palette if it is passed as a scalar
                    pass
                else:
                    # This is a string, lets see if we can validate the name
                    if any([x == palette for x in dir(bkPalettes)]):
                        palette = eval('bkPalettes.' + palette)
                    else:
                        pass
                        ##### THROW ERROR: The named palette does not seem to exist

            else:
                # This is a list object.  Lets itterate over each element of it
                # and try to make a good list of hex numbers

                # Create a temporary placeholder to store the converted colors
                tmpPalette = [None] * len(palette)

                # Loop over each of the palette entries and attempt to convert the entry
                # into a hex number which can be stored in the tmpPalette variable.
                for i in range(len(palette)):
                    if type(palette[i]) == str:
                        if any([x == palette[i] for x in dir(bkColors)]):
                            tmpPalette[i] = eval('bkColors.' + palette[i] + '.to_hex()')
                        if palette[i][0] == '#':
                            if len(palette[i]) >= 7:
                                tmpPalette[i] = palette[i][0:7]
                            if len(palette[i]) == 9:
                                alpha_hold[i] = int(palette[i][7:9], 16)/255

                    if type(palette[i]) == int:
                        tmpPalette[i] = '#' + format(palette[i] & 0xFFFFFFFF, '06X')

                    if type(palette[i]).__name__ == 'NamedColor':
                        tmpPalette[i] = palette[i].to_hex()

                    if type(palette[i]) == tuple:
                        if len(palette[i]) >= 3:
                            tmpPalette[i] = '#' + format(palette[i][0], '02X') + format(palette[i][1], '02X') + format(palette[i][2], '02X')
                        if len(palette[i]) == 4:
                            alpha_hold[i] = palette[i][3]

                # Check to ensure that all of the colors were able to be converted
                none_indexs = [i for i in range(len(tmpPalette)) if tmpPalette[i] == None]
                if len(none_indexs) > 0:
                    ##### THROW ERROR: Some colors specified in the palette were unable to be converted into well formatted hex strings [indexs (list the indexs)]
                    pass

                # Make the data stored in tmpPalette authorative
                palette = tmpPalette

            kwargs['palette'] = palette
        
        if not isinstance(alpha, list):
            # Convert the scalar object to a vector so that the Seq property 
            # type can be used.
            alpha = [alpha] * len(palette)

        # Overwrite the alpha values with those specified by the colors in the palette.
        # This may not be the desired functionality.  Who should win, the information in
        # the palette, or the direct alpha information specified in the alpha parameter?
        for k,v in list(alpha_hold.items()):
            alpha[k] = v

        kwargs['alpha'] = alpha

        if segments is not None: kwargs['segments'] = segments

        kwargs['interpolationMethod'] = interpolationMethod

        super(SegmentedColorMapper, self).__init__(**kwargs)


class LinearColorMapperReplacement(SegmentedColorMapper):

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

    def __init__(self, palette=None, low = None, high = None, alpha=1, reserve_color = None, reserve_val = None, **kwargs):

        palette = expandPalette(palette)

        # Reuse the expandPalette framework to convert the single reserve color
        # to a hex code which can be passed to the JS code.  (This feels a bit hackinsh
        # but it is better than simply dupliacting the code below.)
        reserve_color = expandPalette([reserve_color])[0]

        if not isinstance(palette, list):
            ##### THROW ERROR: 
            pass

        # Duplicate the final color to mimic the behavior of the original 
        # LinearColorMapper Class
        palette.append(palette[len(palette) - 1])

        kwargs['palette'] = palette
        kwargs['interpolationMethod'] = 'step'
        kwargs['alpha'] = alpha
        kwargs['low'] = low
        kwargs['high'] = high
        kwargs['reserve_color'] = reserve_color
        kwargs['reserve_val'] = reserve_val

        super(LinearColorMapperReplacement, self).__init__(**kwargs)

# Helper function to expand the palette.  Originally in the constructor of the
# SegmentedColorMapper, I pulled this out so the code could be reused in the 
# LinearColorMapper front end for SegmentedColorMapper.
def expandPalette(palette = None):
    if palette is not None: 
        # Lets do some work on the Palette to ensure that only hex values
        # or integers make it to the Javascipt.  The interpolation routines
        # require that we have the actual value of the colors.  Although 
        # it seems possible to convert named colors to individual colors
        # in the browser, it seemed hackish and non-trustworthy.  Lets
        # just do it here with some logic and always pass the JS a list 
        # of hex codes.

        # Define a dict to hold any alpha values that we might extract
        # from the different colors in the passed palette.  These can 
        # come from a 4-tuple or a 
        alpha_hold = {}

        # Check to see if this is a single string.  If this is the case,
        # this is likely a named preknown colormap.
        if not isinstance(palette, list):
            # We have a single item which has been passed.
            if not isinstance(palette, str):
                ##### THROW ERROR: palette must be the name of a known palette if it is passed as a scalar
                pass
            else:
                # This is a string, lets see if we can validate the name
                if any([x == palette for x in dir(bkPalettes)]):
                    palette = eval('bkPalettes.' + palette)
                else:
                    pass
                    ##### THROW ERROR: The named palette does not seem to exist

        else:
            # This is a list object.  Lets itterate over each element of it
            # and try to make a good list of hex numbers

            # Create a temporary placeholder to store the converted colors
            tmpPalette = [None] * len(palette)

            # Loop over each of the palette entries and attempt to convert the entry
            # into a hex number which can be stored in the tmpPalette variable.
            for i in range(len(palette)):
                if type(palette[i]) == str:
                    if any([x == palette[i] for x in dir(bkColors)]):
                        tmpPalette[i] = eval('bkColors.' + palette[i] + '.to_hex()')
                    if palette[i][0] == '#':
                        if len(palette[i]) >= 7:
                            tmpPalette[i] = palette[i][0:7]
                        if len(palette[i]) == 9:
                            alpha_hold[i] = int(palette[i][7:9], 16)/255

                if type(palette[i]) == int:
                    tmpPalette[i] = '#' + format(palette[i] & 0xFFFFFFFF, '06X')

                if type(palette[i]).__name__ == 'NamedColor':
                    tmpPalette[i] = palette[i].to_hex()

                if type(palette[i]) == tuple:
                    if len(palette[i]) >= 3:
                        tmpPalette[i] = '#' + format(palette[i][0], '02X') + format(palette[i][1], '02X') + format(palette[i][2], '02X')
                    if len(palette[i]) == 4:
                        alpha_hold[i] = palette[i][3]

            # Check to ensure that all of the colors were able to be converted
            none_indexs = [i for i in range(len(tmpPalette)) if tmpPalette[i] == None]
            if len(none_indexs) > 0:
                ##### THROW ERROR: Some colors specified in the palette were unable to be converted into well formatted hex strings [indexs (list the indexs)]
                pass

            # Make the data stored in tmpPalette authorative
            palette = tmpPalette
    return(palette)

