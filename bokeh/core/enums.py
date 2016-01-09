''' Common enumerations to be used together with |Enum| property.

Typical usage of the enumerations in this module look similar to this:

.. code-block:: python

    from bokeh.model import Model
    from bokeh.core.enums import StartEnd
    from bokeh.core.properties import Enum

    class MyModel(Model):

        location = Enum(StartEnd, help="""
        Whether the thing should be located at the start or the end.
        """)

.. |Enum| replace:: :class:`~bokeh.core.properties.Enum`

'''

from __future__ import absolute_import

from six import string_types

from .. import colors, icons, palettes

class Enumeration(object):
    ''' Represent an enumerated collection of values.

    '''
    __slots__ = ()

    def __iter__(self):
        return iter(self._values)

    def __contains__(self, value):
        if not self._case_sensitive:
            value = value.lower()
        return value in self._values

    def __str__(self):
        return "Enumeration(%s)" % ", ".join(self._values)

    __repr__ = __str__

def enumeration(*values, **kwargs):
    ''' Create an |Enumeration| from a sequence of values.

    Args:
        case_sensitive (bool, optional) :
            Whether validation should consider case or not (default: True)

    Returns:
        |Enumeration|: enum

    .. |Enumeration| replace:: :class:`~bokeh.core.enums.Enumeration`

    '''
    if not (values and all(isinstance(value, string_types) and value for value in values)):
        raise ValueError("expected a non-empty sequence of strings, got %s" % values)

    if len(values) != len(set(values)):
        raise ValueError("enumeration items must be unique, got %s" % values)

    attrs = dict([ (value, value) for value in values ])
    attrs.update({
        "_values": list(values),
        "_default": values[0],
        "_case_sensitive": kwargs.get("case_sensitive", True),
    })

    return type("Enumeration", (Enumeration,), attrs)()

#: Specify how stroked lines should be joined together
LineJoin = enumeration("miter", "round", "bevel")

#: Specify a named dash pattern for stroking lines
LineDash = enumeration("solid", "dashed", "dotted", "dotdash", "dashdot")

#: Specify how stroked lines should be terminated
LineCap = enumeration("butt", "round", "square")

#: Specify the font style for rendering text
FontStyle = enumeration("normal", "italic", "bold")

#: Specify the horizontal alignment for rendering text
TextAlign = enumeration("left", "right", "center")

#: Specify the baseline location for rendering text
TextBaseline = enumeration("top", "middle", "bottom", "alphabetic", "hanging")

#: Specify a stroke direction for circles, wedges, etc.
Direction = enumeration("clock", "anticlock")

#: Specify a left/right side
Side = enumeration("left", "right")

#: Specify units for mapping values
Units = enumeration("screen", "data")

# Specify units for mapping values
SpatialUnits = Units

#: Specify the units for an angle value
AngleUnits = enumeration("deg", "rad")

#: Specify a date/time scale
DatetimeUnits = enumeration("microseconds", "milliseconds", "seconds", "minsec",
                            "minutes", "hourmin", "hours", "days", "months", "years")

#: Specify a vertival/horizontal dimension
Dimension = enumeration("width", "height", "x", "y")

#: Specify a fixed location for a Bokeh legend
LegendLocation = Anchor = enumeration("top_left", "top_center", "top_right",
    "right_center", "bottom_right", "bottom_center", "bottom_left", "left_center", "center")

#: Specify a location in plot layouts
Location = enumeration("above", "below", "left", "right")

#: Specify a named dashing patter for stroking lines
DashPattern = enumeration("solid", "dashed", "dotted", "dotdash", "dashdot")

#: Specify a style for button widgets
ButtonType = enumeration("default", "primary", "success", "warning", "danger", "link")

#: Specify one of the 137 named CSS colors
NamedColor = enumeration(*colors.__colors__, case_sensitive=False)

#: Specify the name of an from :ref:`bokeh.icons`
NamedIcon = enumeration(*icons.__icons__)

#: Specify the name of a palette from :ref:`bokeh.palettes`
Palette = enumeration(*palettes.__palettes__)

#: Specify a style for a Google map
MapType = enumeration("satellite", "roadmap", "terrain", "hybrid")

#: Specify a format for printing dates
DateFormat = enumeration("ATOM", "W3C", "RFC-3339", "ISO-8601", "COOKIE", "RFC-822",
                         "RFC-850", "RFC-1036", "RFC-1123", "RFC-2822", "RSS", "TICKS", "TIMESTAMP")

#: Specify a policy for  how numbers should be rounded
RoundingFunction = enumeration("round", "nearest", "floor", "rounddown", "ceil", "roundup")

#: Specify a locale for printing numeric values
NumeralLanguage = enumeration("be-nl", "chs", "cs", "da-dk", "de-ch", "de", "en",
                              "en-gb", "es-ES", "es", "et", "fi", "fr-CA", "fr-ch",
                              "fr", "hu", "it", "ja", "nl-nl", "pl", "pt-br",
                              "pt-pt", "ru", "ru-UA", "sk", "th", "tr", "uk-UA")

#: Specify a position in the render order for a Bokeh renderer
RenderLevel = enumeration("image", "underlay", "glyph", "annotation", "overlay", "tool")

#: Specify a render mode for renderers that support both Canvas or CSS rendering
RenderMode = enumeration("canvas", "css")

#: Specify an aggregation type for different charts
Aggregation = enumeration("sum", "mean", "count", "nunique", "median", "min", "max")

#: Specify the language used in a CustomJS callback
ScriptingLanguage = enumeration("javascript", "coffeescript")

#: Specify a start/end value
StartEnd = enumeration("start", "end")
