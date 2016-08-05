""" Renderers for various kinds of annotations that can be added to
Bokeh plots

"""
from __future__ import absolute_import

from ..core.enums import (
    SpatialUnits, Dimension, RenderMode, AngleUnits, TextAlign, FontStyle
)
from ..core.property_mixins import LineProps, FillProps, TextProps
from ..core.properties import abstract, value
from ..core.properties import (
    Bool, String, Enum, Instance, Include, NumberSpec, Either, Auto,
    Float, Override, Seq, StringSpec, AngleSpec, Angle, FontSizeSpec, ColorSpec
)

from ..util.deprecate import deprecatedModuleAttribute
deprecatedModuleAttribute('0.12.1',
                          'use bokeh.models.legends.Legend instead',
                          'bokeh.models.annotations',
                          'Legend')
del deprecatedModuleAttribute
# Makes Legend available in this module during deprecation cycle
from bokeh.models.legends import Legend # NOQA

from .renderers import Renderer
from .sources import DataSource, ColumnDataSource

@abstract
class Annotation(Renderer):
    """ Base class for annotation models.

    """

    plot = Instance(".models.plots.Plot", help="""
    The plot to which this annotation is attached.
    """)

    level = Override(default="annotation")

@abstract
class TextAnnotation(Annotation):
    """ Base class for annotation models.

    """

def _DEFAULT_ARROW():
    from .arrow_heads import OpenHead
    return OpenHead()

class Arrow(Annotation):
    """ Render an arrow as an annotation.

    """

    x_start = NumberSpec(help="""
    The x-coordinates to locate the start of the arrows.
    """)

    y_start = NumberSpec(help="""
    The y-coordinates to locate the start of the arrows.
    """)

    start_units = Enum(SpatialUnits, default='data', help="""
    The unit type for the start_x and start_y attributes. Interpreted as "data
    space" units by default.
    """)

    start = Instance('.models.arrow_heads.ArrowHead', default=None, help="""
    Instance of ArrowHead.
    """)

    x_end = NumberSpec(help="""
    The x-coordinates to locate the end of the arrows.
    """)

    y_end = NumberSpec(help="""
    The y-coordinates to locate the end of the arrows.
    """)

    end_units = Enum(SpatialUnits, default='data', help="""
    The unit type for the end_x and end_y attributes. Interpreted as "data
    space" units by default.
    """)

    end = Instance('.models.arrow_heads.ArrowHead', default=_DEFAULT_ARROW, help="""
    Instance of ArrowHead.
    """)

    body_props = Include(LineProps, use_prefix=False, help="""
    The %s values for the arrow body.
    """)

    source = Instance(DataSource, help="""
    Local data source to use when rendering annotations on the plot.
    """)

    x_range_name = String('default', help="""
    A particular (named) x-range to use for computing screen locations when
    rendering annotations on the plot. If unset, use the default x-range.
    """)

    y_range_name = String('default', help="""
    A particular (named) y-range to use for computing screen locations when
    rendering annotations on the plot. If unset, use the default y-range.
    """)

class BoxAnnotation(Annotation):
    """ Render a shaded rectangular region as an annotation.

    """

    left = Either(Auto, NumberSpec(), default=None, help="""
    The x-coordinates of the left edge of the box annotation.
    """)

    left_units = Enum(SpatialUnits, default='data', help="""
    The unit type for the left attribute. Interpreted as "data space" units
    by default.
    """)

    right = Either(Auto, NumberSpec(), default=None, help="""
    The x-coordinates of the right edge of the box annotation.
    """)

    right_units = Enum(SpatialUnits, default='data', help="""
    The unit type for the right attribute. Interpreted as "data space" units
    by default.
    """)

    bottom = Either(Auto, NumberSpec(), default=None, help="""
    The y-coordinates of the bottom edge of the box annotation.
    """)

    bottom_units = Enum(SpatialUnits, default='data', help="""
    The unit type for the bottom attribute. Interpreted as "data space" units
    by default.
    """)

    top = Either(Auto, NumberSpec(), default=None, help="""
    The y-coordinates of the top edge of the box annotation.
    """)

    top_units = Enum(SpatialUnits, default='data', help="""
    The unit type for the top attribute. Interpreted as "data space" units
    by default.
    """)

    x_range_name = String('default', help="""
    A particular (named) x-range to use for computing screen locations when
    rendering box annotations on the plot. If unset, use the default x-range.
    """)

    y_range_name = String('default', help="""
    A particular (named) y-range to use for computing screen locations when
    rendering box annotations on the plot. If unset, use the default y-range.
    """)

    line_props = Include(LineProps, use_prefix=False, help="""
    The %s values for the box.
    """)

    line_alpha = Override(default=0.3)

    line_color = Override(default="#cccccc")

    fill_props = Include(FillProps, use_prefix=False, help="""
    The %s values for the box.
    """)

    fill_alpha = Override(default=0.4)

    fill_color = Override(default="#fff9ba")

    render_mode = Enum(RenderMode, default="canvas", help="""
    Specifies whether the box is rendered as a canvas element or as an
    css element overlaid on the canvas. The default mode is "canvas".

    .. warning::
        The line_dash and line_dash_offset attributes aren't supported if
        the render_mode is set to "css"

    """)

class Label(TextAnnotation):
    """ Render a single text box as an annotation.

    """

    x = Float(help="""
    The x-coordinate in screen coordinates to locate the text anchors.
    """)

    x_units = Enum(SpatialUnits, default='data', help="""
    The unit type for the x attribute. Interpreted as "data space" units
    by default.
    """)

    y = Float(help="""
    The y-coordinate in screen coordinates to locate the text anchors.
    """)

    y_units = Enum(SpatialUnits, default='data', help="""
    The unit type for the y attribute. Interpreted as "data space" units
    by default.
    """)

    text = String(help="""
    The text value to render.
    """)

    angle = Angle(default=0, help="""
    The angle to rotate the text, as measured from the horizontal.

    .. warning::
        The center of rotation for canvas and css render_modes is different.
        For `render_mode="canvas"` the label is rotated from the top-left
        corner of the annotation, while for `render_mode="css"` the annotation
        is rotated around it's center.
    """)

    angle_units = Enum(AngleUnits, default='rad', help="""
    Acceptable values for units are ``"rad"`` and ``"deg"``
    """)

    x_offset = Float(default=0, help="""
    Offset value to apply to the x-coordinate.

    This is useful, for instance, if it is desired to "float" text a fixed
    distance in screen units from a given data position.
    """)

    y_offset = Float(default=0, help="""
    Offset value to apply to the y-coordinate.

    This is useful, for instance, if it is desired to "float" text a fixed
    distance in screen units from a given data position.
    """)

    text_props = Include(TextProps, use_prefix=False, help="""
    The %s values for the text.
    """)

    background_props = Include(FillProps, use_prefix=True, help="""
    The %s values for the text bounding box.
    """)

    background_fill_color = Override(default=None)

    border_props = Include(LineProps, use_prefix=True, help="""
    The %s values for the text bounding box.
    """)

    border_line_color = Override(default=None)

    x_range_name = String('default', help="""
    A particular (named) x-range to use for computing screen location when
    rendering an annotation on the plot. If unset, use the default x-range.
    """)

    y_range_name = String('default', help="""
    A particular (named) y-range to use for computing screen location when
    rendering an annotation on the plot. If unset, use the default y-range.
    """)

    render_mode = Enum(RenderMode, default="canvas", help="""
    Specifies whether the text is rendered as a canvas element or as an
    css element overlaid on the canvas. The default mode is "canvas".

    .. note::
        The CSS labels won't be present in the output using the "save" tool.

    .. warning::
        Not all visual styling properties are supported if the render_mode is
        set to "css". The border_line_dash property isn't fully supported and
        border_line_dash_offset isn't supported at all. Setting text_alpha will
        modify the opacity of the entire background box and border in addition
        to the text. Finally, clipping Label annotations inside of the plot
        area isn't supported in "css" mode.

    """)

class LabelSet(TextAnnotation):
    """ Render a group of text boxes as annotations.

    """

    x = NumberSpec(help="""
    The x-coordinates to locate the text anchors.
    """)

    x_units = Enum(SpatialUnits, default='data', help="""
    The unit type for the xs attribute. Interpreted as "data space" units
    by default.
    """)

    y = NumberSpec(help="""
    The y-coordinates to locate the text anchors.
    """)

    y_units = Enum(SpatialUnits, default='data', help="""
    The unit type for the ys attribute. Interpreted as "data space" units
    by default.
    """)

    text = StringSpec("text", help="""
    The text values to render.
    """)

    angle = AngleSpec(default=0, help="""
    The angles to rotate the text, as measured from the horizontal.

    .. warning::
        The center of rotation for canvas and css render_modes is different.
        For `render_mode="canvas"` the label is rotated from the top-left
        corner of the annotation, while for `render_mode="css"` the annotation
        is rotated around it's center.
    """)

    x_offset = NumberSpec(default=0, help="""
    Offset values to apply to the x-coordinates.

    This is useful, for instance, if it is desired to "float" text a fixed
    distance in screen units from a given data position.
    """)

    y_offset = NumberSpec(default=0, help="""
    Offset values to apply to the y-coordinates.

    This is useful, for instance, if it is desired to "float" text a fixed
    distance in screen units from a given data position.
    """)

    text_props = Include(TextProps, use_prefix=False, help="""
    The %s values for the text.
    """)

    background_props = Include(FillProps, use_prefix=True, help="""
    The %s values for the text bounding box.
    """)

    background_fill_color = Override(default=None)

    border_props = Include(LineProps, use_prefix=True, help="""
    The %s values for the text bounding box.
    """)

    border_line_color = Override(default=None)

    source = Instance(DataSource, default=lambda: ColumnDataSource(), help="""
    Local data source to use when rendering annotations on the plot.
    """)

    x_range_name = String('default', help="""
    A particular (named) x-range to use for computing screen locations when
    rendering annotations on the plot. If unset, use the default x-range.
    """)

    y_range_name = String('default', help="""
    A particular (named) y-range to use for computing screen locations when
    rendering annotations on the plot. If unset, use the default y-range.
    """)

    render_mode = Enum(RenderMode, default="canvas", help="""
    Specifies whether the text is rendered as a canvas element or as an
    css element overlaid on the canvas. The default mode is "canvas".

    .. note::
        The CSS labels won't be present in the output using the "save" tool.

    .. warning::
        Not all visual styling properties are supported if the render_mode is
        set to "css". The border_line_dash property isn't fully supported and
        border_line_dash_offset isn't supported at all. Setting text_alpha will
        modify the opacity of the entire background box and border in addition
        to the text. Finally, clipping Label annotations inside of the plot
        area isn't supported in "css" mode.

    """)

class PolyAnnotation(Annotation):
    """ Render a shaded polygonal region as an annotation.

    """

    xs = Seq(Float, default=[], help="""
    The x-coordinates of the region to draw.
    """)

    xs_units = Enum(SpatialUnits, default='data', help="""
    The unit type for the xs attribute. Interpreted as "data space" units
    by default.
    """)

    ys = Seq(Float, default=[], help="""
    The y-coordinates of the region to draw.
    """)

    ys_units = Enum(SpatialUnits, default='data', help="""
    The unit type for the ys attribute. Interpreted as "data space" units
    by default.
    """)

    x_range_name = String('default', help="""
    A particular (named) x-range to use for computing screen locations when
    rendering box annotations on the plot. If unset, use the default x-range.
    """)

    y_range_name = String('default', help="""
    A particular (named) y-range to use for computing screen locations when
    rendering box annotations on the plot. If unset, use the default y-range.
    """)

    line_props = Include(LineProps, use_prefix=False, help="""
    The %s values for the polygon.
    """)

    line_alpha = Override(default=0.3)

    line_color = Override(default="#cccccc")

    fill_props = Include(FillProps, use_prefix=False, help="""
    The %s values for the polygon.
    """)

    fill_alpha = Override(default=0.4)

    fill_color = Override(default="#fff9ba")

class Span(Annotation):
    """ Render a horizontal or vertical line span.

    """

    location = Float(help="""
    The location of the span, along ``dimension``.
    """)

    location_units = Enum(SpatialUnits, default='data', help="""
    The unit type for the location attribute. Interpreted as "data space"
    units by default.
    """)

    dimension = Enum(Dimension, default='width', help="""
    The direction of the span.
    """)

    x_range_name = String('default', help="""
    A particular (named) x-range to use for computing screen locations when
    rendering annotations on the plot. If unset, use the default x-range.
    """)

    y_range_name = String('default', help="""
    A particular (named) y-range to use for computing screen locations when
    rendering annotations on the plot. If unset, use the default y-range.
    """)

    render_mode = Enum(RenderMode, default="canvas", help="""
    Specifies whether the span is rendered as a canvas element or as an
    css element overlaid on the canvas. The default mode is "canvas".

    .. warning::
        The line_dash and line_dash_offset attributes aren't supported if
        the render_mode is set to "css"

    """)

    line_props = Include(LineProps, use_prefix=False, help="""
    The %s values for the span.
    """)

class Title(TextAnnotation):
    """ Render a single title box as an annotation.

    """

    text = String(help="""
    The text value to render.
    """)

    align = Enum(TextAlign, default='left', help="""
    Location to align the title text.

    """)

    offset = Float(default=0, help="""
    Offset the text by a number of pixels (can be positive or negative). Shifts the text in
    different directions based on the location of the title:

        * above: shifts title right
        * right: shifts title down
        * below: shifts title right
        * left: shifts title up

    """)

    text_font = String(default="helvetica", help="""
    Name of a font to use for rendering text, e.g., ``'times'``,
    ``'helvetica'``.

    """)

    text_font_size = FontSizeSpec(default=value("10pt"))

    text_font_style = Enum(FontStyle, default="bold", help="""
    A style to use for rendering text.

    Acceptable values are:

    - ``'normal'`` normal text
    - ``'italic'`` *italic text*
    - ``'bold'`` **bold text**

    """)

    text_color = ColorSpec(default="#444444", help="""
    A color to use to fill text with.

    Acceptable values are:

    - any of the 147 named `CSS colors`_, e.g ``'green'``, ``'indigo'``
    - an RGB(A) hex value, e.g., ``'#FF0000'``, ``'#44444444'``
    - a 3-tuple of integers (r,g,b) between 0 and 255
    - a 4-tuple of (r,g,b,a) where r,g,b are integers between 0..255 and a is between 0..1

    .. _CSS colors: http://www.w3schools.com/cssref/css_colornames.asp

    """)

    text_alpha = NumberSpec(default=1.0, help="""
    An alpha value to use to fill text with.

    Acceptable values are floating point numbers between 0 (transparent)
    and 1 (opaque).

    """)

    background_props = Include(FillProps, use_prefix=True, help="""
    The %s values for the text bounding box.
    """)

    background_fill_color = Override(default=None)

    border_props = Include(LineProps, use_prefix=True, help="""
    The %s values for the text bounding box.
    """)

    border_line_color = Override(default=None)

    render_mode = Enum(RenderMode, default="canvas", help="""
    Specifies whether the text is rendered as a canvas element or as an
    css element overlaid on the canvas. The default mode is "canvas".

    .. note::
        The CSS labels won't be present in the output using the "save" tool.

    .. warning::
        Not all visual styling properties are supported if the render_mode is
        set to "css". The border_line_dash property isn't fully supported and
        border_line_dash_offset isn't supported at all. Setting text_alpha will
        modify the opacity of the entire background box and border in addition
        to the text. Finally, clipping Label annotations inside of the plot
        area isn't supported in "css" mode.

    """)

class Tooltip(Annotation):
    """ Render a tooltip.

    .. note::
        This model is currently managed by BokehJS and is not useful
        directly from python.

    """
    level = Override(default="overlay")

    attachment = Enum("horizontal", "vertical", "left", "right", "above", "below", help="""
    Whether the tooltip should display to the left or right off the cursor
    position or above or below it, or if it should be automatically placed
    in the horizontal or vertical dimension.
    """)

    inner_only = Bool(default=True, help="""
    Whether to display outside a central plot frame area.
    """)
