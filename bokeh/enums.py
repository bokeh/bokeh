"""Definitions of common enumerations to be used together with ``Enum`` property. """

from __future__ import absolute_import

from six import string_types

from . import colors, icons, palettes

class Enumeration(object):

    __slots__ = ()

    def __contains__(self, value):
        if not self._case_sensitive:
            value = value.lower()
        return value in self._values

    def __str__(self):
        return "Enumeration(%s)" % ", ".join(self._values)

    __repr__ = __str__

def enumeration(*values, **kwargs):
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

LineJoin = enumeration("miter", "round", "bevel")
LineDash = enumeration("solid", "dashed", "dotted", "dotdash", "dashdot")
LineCap = enumeration("butt", "round", "square")
FontStyle = enumeration("normal", "italic", "bold")
TextAlign = enumeration("left", "right", "center")
TextBaseline = enumeration("top", "middle", "bottom", "alphabetic", "hanging")
Direction = enumeration("clock", "anticlock")
Units = enumeration("screen", "data")
SpatialUnits = Units
AngleUnits = enumeration("deg", "rad")
DatetimeUnits = enumeration("microseconds", "milliseconds", "seconds", "minsec",
                            "minutes", "hourmin", "hours", "days", "months", "years")
Dimension = enumeration("width", "height", "x", "y")
Anchor = enumeration("top_left", "top_center", "top_right", "right_center",
                     "bottom_right", "bottom_center", "bottom_left", "left_center", "center")
Location = enumeration("above", "below", "left", "right")
Orientation = enumeration("top_right", "top_left", "bottom_left", "bottom_right")
DashPattern = enumeration("solid", "dashed", "dotted", "dotdash", "dashdot")
ButtonType = enumeration("default", "primary", "success", "warning", "danger", "link")
NamedColor = enumeration(*colors.__colors__, case_sensitive=False)
NamedIcon = enumeration(*icons.__icons__)
Palette = enumeration(*palettes.__palettes__)
MapType = enumeration("satellite", "roadmap", "terrain", "hybrid")
DateFormat = enumeration("ATOM", "W3C", "RFC-3339", "ISO-8601", "COOKIE", "RFC-822",
                         "RFC-850", "RFC-1036", "RFC-1123", "RFC-2822", "RSS", "TICKS", "TIMESTAMP")
RoundingFunction = enumeration("round", "nearest", "floor", "rounddown", "ceil", "roundup")
NumeralLanguage = enumeration("be-nl", "chs", "cs", "da-dk", "de-ch", "de", "en",
                              "en-gb", "es-ES", "es", "et", "fi", "fr-CA", "fr-ch",
                              "fr", "hu", "it", "ja", "nl-nl", "pl", "pt-br",
                              "pt-pt", "ru", "ru-UA", "sk", "th", "tr", "uk-UA")
RenderLevel = enumeration("image", "underlay", "glyph", "annotation",
                          "overlay", "tool")
Aggregation = enumeration("sum", "mean", "count", "nunique", "median", "min", "max")
