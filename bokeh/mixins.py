"""Classes that can be mixed-in to HasProps classes to get them the corresponding attributes. """

from .properties import HasProps, ColorSpec, DataSpec, Enum, DashPattern, Int, String

class FillProps(HasProps):
    """ Mirrors the BokehJS properties.fill_properties class """
    fill_color = ColorSpec("gray")
    fill_alpha = DataSpec(1.0)

class LineProps(HasProps):
    """ Mirrors the BokehJS properties.line_properties class """
    line_color = ColorSpec("black")
    line_width = DataSpec #
    line_alpha = DataSpec(1.0)
    line_join = Enum("miter", "round", "bevel")
    line_cap = Enum("butt", "round", "square")
    line_dash = DashPattern  # This is a list of ints, or a dash pattern name
    line_dash_offset = Int(0)

class TextProps(HasProps):
    """ Mirrors the BokehJS properties.text_properties class """
    text_font = String("Helvetica")
    text_font_size = String("10pt")
    text_font_style = Enum("normal", "italic", "bold")
    text_color = ColorSpec("black")
    text_alpha = DataSpec(1.0)
    text_align = Enum("left", "right", "center")
    text_baseline = Enum("top", "middle", "bottom")
