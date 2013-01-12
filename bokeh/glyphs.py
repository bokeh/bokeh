
from attributes import (Attribute, Enum, Float, Int, Color, Size, Percent,
        Bool, Pattern, Align, Angle, Text)

# Size is a way to preserve a data-space-related metric all the way until
#   render time, when the screen dimensions are known
# Percent is useful for alphas and coverage and extents; more semantically
#   meaningful than Float(0..1)
# Align may be "center", "min", "max", or "jitter(func)" where func is name
#   of a random distribution to draw random samples from. Defaults to uniform
#   but gaussian could certainly be useful.

class Scene(object):
    """ A set of related plots, each with their own panel(s) and each 
    panel representing some coherent coordinate space onto which Glyphs
    are positioned and rendered.
    """

class _MetaGlyph(type):
    
    def __new__(cls, classname, bases, class_dict):
        # Look through the class_dict for all Attributes and make sure they
        # are properly set up as descriptors.  We support Attribute 
        # declaration with or without parentheses.
        all_attributes = []
        for name,val in class_dict.items():
            if isinstance(val, type) and issubclass(val, Attribute):
                class_dict[name] = val()
                all_attributes.append(name)
        class_dict["all_attributes"] = all_attributes

        return type.__new__(cls, classname, bases, class_dict)


class Glyph(object):
    """ Base class for all glyphs/marks/geoms/whatever-you-call-'em in Bokeh.

    Instead of using fancy AST parsing tricks and deferred nodes, we set
    up a different kind of object system.  Glyphs instances fundamentally
    capture dataflow relationships (usually expressed as mathematical
    expressions) between each others' attributes.
    """

    __metaclass__ = _MetaGlyph

    # Common attributes for all glyphs
    color = Color
    alpha = Percent
    visible = Bool
    margin = Size   # the amount of desired space around this glyph
    halign = Align  # when there is horizontal wiggle room (e.g. categorical)
    valign = Align  # when there is vertical wiggle room

    # The name that will be used for the 'type' field of the glyph when we 
    # create the JS dict representation of this glyph
    jstypename = "glyph"

    def to_dict(self):
        """ Returns a dict mapping attributes to values, that is amenable for
        inclusion in a GlyphRenderer definition.
        """
        # Use the all_attributes variable to generate the list...
        # TODO: should we use setters to detect when something has been overriden
        # relative to defaults?
        d = dict((name, getattr(self, name)) for name in self.all_attributes)
        d["type"] = self.jstypename
        return d

class Marker(Glyph):

    x = Float
    y = Float
    size = Size

    # TODO: Remove this and use the color attributes in Glyph instead
    stroke_color = Color
    fill_color = Color
    fill_pattern = Pattern
    shape = Enum("dot", "square", "tri", "diamond", "x", "+", "char")
    char_value = Text

    jstypename = "marker"

class Square(Marker):
    shape = "square"

class Diamond(Marker):
    shape = "diamond"

class Triangle(Marker):
    shape = "triangle"

class Circles(Glyph):
    jstypename = "circles"
    x = Float
    y = Float
    radius = Float
    outline_color = Color
    outline_width = Size

class Rects(Glyph):
    jstypename = "rects"
    x = Float
    y = Float
    width = Float
    height = Float
    angle = Float
    outline_color = Color
    outline_width = Size

class RectRegion(Glyph):
    jstypename = "rectregion"
    left = Float
    right = Float
    bottom = Float
    top = Float
    angle = Float
    outline_color = Color
    outline_width = Size

