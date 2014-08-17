"""Definitions of common enumerations to be used together with ``Enum`` property. """

from six import string_types

class Enumeration(object):
    pass

def enumeration(*values):
    if not (values and all(isinstance(value, string_types) and value for value in values)):
        raise ValueError("expected a non-empty sequence of strings, got %s" % values)

    if len(values) != len(set(values)):
        raise ValueError("enumeration items must be unique, got %s" % values)

    attrs = dict([ (value, value) for value in values ])
    attrs.update({
        "__slots__": [],
        "_values": list(values),
        "_default": values[0],
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
AngleUnits = enumeration("deg", "rad")
DatetimeUnits = enumeration("microseconds", "milliseconds", "seconds", "minsec", "minutes", "hourmin", "hours", "days", "months", "years")
Dimension = enumeration("width", "height", "x", "y")
Location = enumeration("above", "below", "left", "right")
Orientation = enumeration("top_right", "top_left", "bottom_left", "bottom_right")
DashPattern = enumeration("solid", "dashed", "dotted", "dotdash", "dashdot")
NamedColor = enumeration(
    "indigo", "gold", "firebrick", "indianred", "yellow",
    "darkolivegreen", "darkseagreen", "darkslategrey", "mediumvioletred",
    "mediumorchid", "chartreuse", "mediumblue", "black", "springgreen",
    "orange", "lightsalmon", "brown", "turquoise", "olivedrab", "cyan",
    "silver", "skyblue", "gray", "darkturquoise", "goldenrod", "darkgreen",
    "darkviolet", "darkgray", "lightpink", "teal", "darkmagenta",
    "lightgoldenrodyellow", "lavender", "yellowgreen", "thistle", "violet",
    "navy", "dimgrey", "orchid", "blue", "ghostwhite", "honeydew",
    "cornflowerblue", "purple", "darkkhaki", "mediumpurple", "cornsilk", "red",
    "bisque", "slategray", "darkcyan", "khaki", "wheat", "deepskyblue",
    "darkred", "steelblue", "aliceblue", "lightslategrey", "gainsboro",
    "mediumturquoise", "floralwhite", "coral", "aqua", "burlywood",
    "darksalmon", "beige", "azure", "lightsteelblue", "oldlace", "greenyellow",
    "royalblue", "lightseagreen", "mistyrose", "sienna", "lightcoral",
    "orangered", "navajowhite", "lime", "palegreen", "lightcyan", "seashell",
    "mediumspringgreen", "fuchsia", "papayawhip", "blanchedalmond", "peru",
    "aquamarine", "white", "darkslategray", "ivory", "darkgoldenrod",
    "lawngreen", "lightgreen", "crimson", "forestgreen", "maroon", "olive",
    "mintcream", "antiquewhite", "dimgray", "hotpink", "moccasin", "limegreen",
    "saddlebrown", "grey", "darkslateblue", "lightskyblue", "deeppink",
    "plum", "lightgrey", "dodgerblue", "slateblue", "sandybrown", "magenta",
    "tan", "rosybrown", "pink", "lightblue", "palevioletred", "mediumseagreen",
    "linen", "darkorange", "powderblue", "seagreen", "snow", "mediumslateblue",
    "midnightblue", "paleturquoise", "palegoldenrod", "whitesmoke",
    "darkorchid", "salmon", "lightslategray", "lemonchiffon", "chocolate",
    "tomato", "cadetblue", "lightyellow", "lavenderblush", "darkblue",
    "mediumaquamarine", "green", "blueviolet", "peachpuff", "darkgrey")
