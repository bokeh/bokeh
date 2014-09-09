"""Definitions of common enumerations to be used together with ``Enum`` property. """

from six import string_types

from . import colors, icons

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
ColumnType = enumeration("string", "numeric", "date", "checkbox", "select", "dropdown", "autocomplete", "password", "handsontable")
ButtonType = enumeration("default", "primary", "success", "warning", "danger", "link")
NamedColor = enumeration(*colors.__colors__)
NamedIcon = enumeration(*icons.__icons__)
