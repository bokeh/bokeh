
from .properties import (BaseProperty, HasProps, Enum, Float, Int, Color,
        Percent, Size, Bool, Pattern, Align, Angle, String)

# Size is a way to preserve a data-space-related metric all the way until
#   render time, when the screen dimensions are known
# Percent is useful for alphas and coverage and extents; more semantically
#   meaningful than Float(0..1)
# Align may be "center", "min", "max", or "jitter(func)" where func is name
#   of a random distribution to draw random samples from. Defaults to uniform
#   but gaussian could certainly be useful.

#class Scene(object):
#    """ A set of related plots, each with their own panel(s) and each 
#    panel representing some coherent coordinate space onto which Glyphs
#    are positioned and rendered.
#    """


class DataSpec(BaseProperty):
    """ Because the BokehJS glyphs support a fixed value or a named
    field for most data fields, we capture that in this property.

    We mirror the JS convention in this Python descriptor.  There are
    multiple ways to set a DataSpec, illustrated below with comments
    and example code.

    class Foo(HasProps):
        x = DataSpec("x", units="data")

    f = Foo()
    f.x = "fieldname"   # Sets x to a field named "fieldname"
    f.x = 12            # Sets x to a default value of 12
    f.x = {"name": "foo", "default": 12}
    
    Just reading out "f.x" will always retrieve what has been set.
    """

    def __init__(self, field=None, units="data", default=None):
        """
        Parameters
        ==========
        **field** is the string name of a data column to look up.
        **units** is either "data" or "screen"
        **default** is the default value to use if a datapoint is
        missing the field specified in **name**

        If a constant value is desired, then leave **field** as None and
        set **default** to the fixed value.
        """
        # Don't use .name because the HasProps metaclass uses that to 
        # store the attribute name on this descriptor.
        self.field = field
        self.units = units
        self.default = default

    @classmethod
    def autocreate(cls, name=None):
        # In this case, use the name the user assigned this DataSpec to
        # as the default field name.
        d = cls(field=name)
        return d

    def __get__(self, obj, type=None):
        # It's kind of an open question what we should return here if the
        # user hasn't set anything yet.  We use our best heuristic and
        # return a name, a default, or a dict with both, depending on
        # what is None.
        if hasattr(obj, "_"+self.name):
            return getattr(obj, "_"+self.name)
        else:
            if self.field is None:
                return self.default
            elif self.default is None:
                return self.field
            else:
                return {"field": self.field, "default": self.default}

    #def __set__(self, obj, value):
    #    setattr(obj, "_"+self.name, value)
        # Build the complete dict
        #if type(value) == str:
        #    d = {"name": value, "units": self.units, "default": self.default}
        #elif isinstance(value, dict):
        #    d = {"name": self.field, "units": self.units, "default": self.default}
        #    d.update(value)
        #else:
        #    # Assume value is a numeric type and is the default value.
        #    # We explicitly set the field name to None.
        #    d = {"name": None, "units": self.units, "default": value}
        #setattr(obj, self.name + "_dict", d)

    def __delete__(self, obj):
        if hasattr(obj, self.name + "_dict"):
            delattr(obj, self.name + "_dict")
        BaseProperty.__delete__(self, obj)


class Glyph(HasProps):
    """ Base class for all glyphs/marks/geoms/whatever-you-call-'em in Bokeh.

    Instead of using fancy AST parsing tricks and deferred nodes, we set
    up a different kind of object system.  Glyphs instances fundamentally
    capture dataflow relationships (usually expressed as mathematical
    expressions) between each others' attributes.
    """

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
        d = dict((name, getattr(self, name)) for name in self.__properties__)
        d["type"] = self.jstypename
        return d

class Marker(Glyph):

    x = DataSpec
    y = DataSpec
    size = Size

    # TODO: Remove this and use the color attributes in Glyph instead
    stroke_color = Color
    fill_color = Color
    fill_pattern = Pattern
    shape = Enum("dot", "square", "tri", "diamond", "x", "+", "char")
    char_value = String

    jstypename = "marker"

class Square(Marker):
    shape = "square"

class Diamond(Marker):
    shape = "diamond"

class Triangle(Marker):
    shape = "triangle"

class Circles(Glyph):
    jstypename = "circles"
    x = DataSpec
    y = DataSpec
    radius = DataSpec
    outline_color = Color
    outline_width = Size

class Rects(Glyph):
    jstypename = "rects"
    x = DataSpec
    y = DataSpec
    width = DataSpec
    height = DataSpec
    angle = DataSpec
    color = Color
    outline_color = Color
    outline_width = Size

class RectRegion(Glyph):
    jstypename = "rectregions"
    left = DataSpec
    right = DataSpec
    bottom = DataSpec
    top = DataSpec
    angle = DataSpec
    outline_color = Color
    outline_width = Size

