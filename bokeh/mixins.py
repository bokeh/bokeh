"""Classes that can be mixed-in to HasProps classes to get them the corresponding attributes. """

from .properties import HasProps, ColorSpec, DataSpec, Enum, DashPattern, Int, String
from .enums import LineJoin, LineCap, FontStyle, TextAlign, TextBaseline

class FillProps(HasProps):
    """ Mirrors the BokehJS properties.Fill class. """
    fill_color = ColorSpec(default="gray")
    fill_alpha = DataSpec(default=1.0)

class LineProps(HasProps):
    """ Mirrors the BokehJS properties.Line class. """
    line_color = ColorSpec(default="black")
    line_width = DataSpec
    line_alpha = DataSpec(default=1.0)
    line_join = Enum(LineJoin)
    line_cap = Enum(LineCap)
    line_dash = DashPattern
    line_dash_offset = Int(0)

class TextProps(HasProps):
    """ Mirrors the BokehJS properties.Text class. """
    text_font = String("Helvetica")
    text_font_size = String("12pt")
    text_font_style = Enum(FontStyle)
    text_color = ColorSpec(default="#444444")
    text_alpha = DataSpec(default=1.0)
    text_align = Enum(TextAlign)
    text_baseline = Enum(TextBaseline, default="bottom")
