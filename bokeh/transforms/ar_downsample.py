from __future__ import print_function
from ..plotting import image_rgba, image, multi_line, curdoc
from ..plot_object import PlotObject
from ..objects import ServerDataSource,  Glyph, Range1d, Color
from ..properties import (Instance, Any, Either, Int, Float, List)
import numpy as np

import logging
logger = logging.getLogger(__file__)

_AR_MESSAGE = """
---------------------------------------------------
Error loading the abstract_rendering package.

To use the ar_downsample module, you must install the
abstract rendering framework.
This can be installed with conda, pip or by
cloning from https://github.com/ContinuumIO/abstract_rendering
Questions and feedback can be directed to
Joseph Cottam (jcottam@indiana.edu)
-------------------------------------------------------
"""


def _loadAR():
    """
    Utility to load abstract rendering (AR).  Keeps the import from occurring
    unless you actually try to use AR.  MUST be called before actually
    calling any AR package items (typically only invoked on the server
    in response to an AR-reliant plot request).

    This is more complex than just an import because
    AR is exposed as several backbone modules.  If the AR modules
    were directly imported, then errors would occur whenever ar_downsample
    is imported.  This causes error messages on python client side (where
    AR isn't actually needed) and on the server side even when AR isn't used.
    Since the AR modules are used throughout this module, just importing at
    use point inside this module is cumbersome.  Using 'globals()' and
    importlib allows this method to be called before any AR proper items
    are used but still have the imports appear at the module level.
    """
    try:
        from importlib import import_module
        globals()["numeric"] = import_module("abstract_rendering.numeric")
        globals()["general"] = import_module("abstract_rendering.general")
        globals()["infos"] = import_module("abstract_rendering.infos")
        globals()["ar"] = import_module("abstract_rendering.core")
        globals()["glyphset"] = import_module("abstract_rendering.glyphset")
        globals()["contour"] = import_module("abstract_rendering.contour")
    except:
        print(_AR_MESSAGE)
        raise


class Proxy(PlotObject):
    """
    Proxy objects stand in for the abstract rendering (AR) config classes.
    Basically, the AR implementation doesn't rely on Bokeh, so
    it doesn't know about the properties BUT the Bokeh needs be able to
    construct/modify/inspect AR configurations.  Proxy classes hold the
    relevant parameters for constructing AR classes in a way that Bokeh
    can inspect. Furthermore, 'reify' produces an AR class from a
    proxy instance.
    """
    def reify(self, **kwargs):
        raise NotImplementedError("Unimplemented")


# ------ Aggregators -------------
class Sum(Proxy):
    "Add up all incomming values"
    def reify(self, **kwargs):
        return numeric.Sum()


class Count(Proxy):
    "Count how many items there are (ignores values)"
    def reify(self, **kwargs):
        return numeric.Count()


# ------ Infos ---------
class Const(Proxy):
    "Return a single value"
    val = Any()

    def reify(self, **kwargs):
        return infos.const(self.val)


# ----- Shaders ---------
# Out types to support:
#   image -- grid of values
#   rgb_image -- grid of colors
#   poly_line -- multi-segment lines

class Shader(Proxy):
    def __add__(self, other):
        "Build a sequence of shaders"
        return Seq(first=self, second=other)

    def reformat(self, result, *args):
        """
        Modify the standard AR shader output to one that Bokeh can use.
        Response to 'None' should produce an empty basic dataset.

        The default behavior for None is [[0]] because most shaders produce images.
        The default behavior for all other values is identity.
        """
        return np.array([[0]]) if result is None else result


class Seq(Shader):
    "Sequence of shaders"
    first = Instance(Shader)
    second = Instance(Shader)

    def reify(self, **kwargs):
        return self.first.reify(**kwargs) + self.second.reify(**kwargs)

    def __getattr__(self, name):
        if name == 'out':
            self.out = self.second.out
            return self.out
        else:
            raise AttributeError(name)

    def reformat(self, result, *args):
        return self.second.reformat(result, *args)


class Id(Shader):
    "Identity shader.  A safe default."
    out = "image"

    def reify(self, **kwargs):
        return general.Id()


class BinarySegment(Shader):
    """
    Divide the input space into two regions.

    divider - Value that divides the two regions
    high - Value for regions equal to or above the divider
    low - Value for cells below divider
    """
    out = "image"
    high = Any
    low = Any
    divider = Any   # TODO: Restrict to numbers...

    def reify(self, **kwargs):
        return numeric.BinarySegment(self.low, self.high, self.divider)


class Interpolate(Shader):
    "Interpolate between high and low number"
    out = "image"
    high = Any     # TODO: Restrict to numbers...
    low = Any

    def reify(self, **kwargs):
        return numeric.Interpolate(self.low, self.high)


class InterpolateColor(Shader):
    """
    Interpolate between a high and low color

    * high - High color (default: red)
    * low - Low color (default: white)
    * reserve - Color for empty values (default: transparent)
    * empty - Empty value (default: 0)

    """
    # TODO: Make color format conversion fluid...possibly by some change to properties.Color
    out = "image_rgb"
    high = Color((255, 0, 0, 1))
    low = Color((255, 255, 255, 1))
    reserve = Color((255, 255, 255, 0))
    empty = Any(0)

    def reify(self, **kwargs):
        return numeric.InterpolateColors(
            self._reformatColor(self.low),
            self._reformatColor(self.high),
            reserve=self._reformatColor(self.reserve),
            empty=self.empty)

    def _reformatColor(self, color):
        if isinstance(color, tuple) or isinstance(color, list):
            parts = len(color)
            if parts == 3:
                return tuple(color)+(255,)
            if parts == 4:
                return tuple(color[0:3]) + (min(abs(color[3])*255, 255),)
            raise ValueError("Improperty formatted tuple for color %s" % color)

        if isinstance(color, str):
            if color[0] == "#":
                raise ValueError("Can't handle hex-format colors (yet)")
            else:
                try:
                    getattr(colors, str)
                except:
                    raise ValueError("Unknown color string %s" % color)

    def reformat(self, image, *args):
        if image is None: return np.array([[0]])
        return image.view(dtype=np.int32).reshape(image.shape[0:2])


class Sqrt(Shader):
    "Square root of all values"
    out = "image"

    def reify(self, **kwargs):
        return numeric.Sqrt()


class Cuberoot(Shader):
    "Cub eroot of all values"
    out = "image"

    def reify(self, **kwargs):
        return numeric.Cuberoot()


class Spread(Shader):
    """Spread values out in a regular pattern from their origin."""

    out = "image"
    factor = Any    # TODO: Restrict to numbers; Add shape parameter

    def reify(self, **kwargs):
        return numeric.Spread(factor=self.factor)


class Contour(Shader):
    """
    ISO Contours

    levels -- Either how many ISO contours to make (int)
              or the exact contour levels (list).
              Both cases indicate how many contour lines to create.
    """
    out = "poly_line"
    levels = Either(Int, List(Float), default=5)

    def reify(self, **kwargs):
        return contour.Contour(levels=self.levels, points=False)

    def reformat(self, contours, *args):
        if contours is None:
            return {'xxs': [], 'yys': [], 'levels': []}

        xxs = []
        yys = []
        levels = sorted(contours.keys())
        (xmin, ymin) = args

        # Re-arrange results and project xs/ys back to the data space
        for level in levels:
            (xs, ys) = contours[level]
            xs = xs+(xmin-1)  # HACK: Why is this -1 required?
            ys = ys+(ymin-1)  # HACK: Why is this -1 required?
            xxs.append(xs)
            yys.append(ys)

        return {'levels': levels,
                'xs': xxs,
                'ys': yys}


# ------------------  Control Functions ----------------
def replot(plot, agg=Count(), info=Const(val=1), shader=Id(),
           remove_original=True, palette=["Spectral-11"], points=False, **kwargs):
    """
    Treat the passed plot as an base plot for abstract rendering, generate the
    proper Bokeh plot based on the passed parameters.

    This is a convenience for:
    > src=source(plot, ...)
    > <plot-type>(source=src, <params>, **ar.mapping(src))

    Transfers plot title, width, height from the original plot

    **kwargs -- Arguments for the source function EXCEPT reserve_val and reserve_color (if present)
    returns -- A new plot
    """

    # Transfer relevant named arguments
    props = dict()
    props['plot_width'] = kwargs.pop('plot_width', plot.plot_width)
    props['plot_height'] = kwargs.pop('plot_height', plot.plot_height)
    props['title'] = kwargs.pop('title', plot.title)

    # TODO: Find a list somewhere for plot-type-specific options and transfer out using that list.
    #       Otherwise, this section will be horribly unmanageable.
    options = ['reserve_val', 'reserve_color', 'line_color']
    for opt in options:
        if opt in kwargs:
            props[opt] = kwargs.pop(opt)

    src = source(plot, agg, info, shader, remove_original, palette, points, **kwargs)
    props.update(mapping(src))

    if shader.out == "image":
        return image(source=src, **props)
    elif shader.out == "image_rgb":
        return image_rgba(source=src, **props)
    elif shader.out == "poly_line":
        return multi_line(source=src, **props)
    else:
        raise ValueError("Unhandled output type %s" % shader.out)


# TODO: Move reserve control up here or palette control down.  Probably related to refactoring palette into a model-backed type
def source(plot, agg=Count(), info=Const(val=1), shader=Id(),
           remove_original=True, palette=["Spectral-11"],
           points=False, **kwargs):
    # Acquire information from renderer...
    rend = [r for r in plot.renderers if isinstance(r, Glyph)][0]
    datasource = rend.server_data_source
    kwargs['data_url'] = datasource.data_url
    kwargs['owner_username'] = datasource.owner_username

    spec = rend.vm_serialize()['glyphspec']

    # TODO: Use reformat here?

    if shader.out == "image" or shader.out == "image_rgb":
        kwargs['data'] = {'image': [],
                          'x': [0],
                          'y': [0],
                          'global_x_range': [0, 50],
                          'global_y_range': [0, 50],
                          'global_offset_x': [0],
                          'global_offset_y': [0],
                          'dw': [1],
                          'dh': [1],
                          'palette': palette}
    elif shader.out == "poly_line":
        kwargs['data'] = {'xs': [[]],
                          'ys': [[]]}
    else:
        raise ValueError("Unrecognized shader output type %s" % shader.out)

    # Remove the base plot (if requested)
    if remove_original and plot in curdoc()._plotcontext.children:
        curdoc()._plotcontext.children.remove(plot)

    kwargs['transform'] = {
        'resample': "abstract rendering",
        'agg': agg,
        'info': info,
        'shader': shader,
        'glyphspec': spec,
        'points': points}
    return ServerDataSource(**kwargs)


def mapping(source):
    "Setup property mapping dictionary from source to output glyph type."

    trans = source.transform
    out = trans['shader'].out

    if out == 'image' or out == 'image_rgb':
        keys = source.data.keys()
        m = dict(zip(keys, keys))
        m['x_range'] = Range1d(start=0, end=0)
        m['y_range'] = Range1d(start=0, end=0)
        return m
    elif out == 'poly_line':
        keys = source.data.keys()
        m = dict(zip(keys, keys))
        return m

    else:
        raise ValueError("Unrecognized shader output type %s" % out)


def downsample(data, transform, plot_state):
    _loadAR()  # Must be called before any attempts to use AR proper
    glyphspec = transform['glyphspec']
    xcol = glyphspec['x']['field']
    ycol = glyphspec['y']['field']
    size = glyphspec['size']['default']  # TODO: Inspect to get non-default val

    # Translate the resample parameters to server-side rendering....
    # TODO: Should probably handle this type-based-unpacking server_backend so downsamples get a consistent view of the data
    if isinstance(data, dict):
        xcol = data[xcol]
        ycol = data[ycol]
    else:
        table = data.select(columns=[xcol, ycol])
        xcol = table[xcol]
        ycol = table[ycol]

    # TODO: Do more detection to find if it is an area implantation.
    #       If so, make a selector with the right shape pattern and use a point shaper
    shaper = _shaper(glyphspec['type'], size, transform['points'])
    glyphs = glyphset.Glyphset([xcol, ycol], general.EmptyList(),
                               shaper, colMajor=True)

    shader = transform['shader']

    if shader.out == "image" or shader.out == "image_rgb":
        return downsample_image(xcol, ycol, glyphs, transform, plot_state)
    elif shader.out == "poly_line":
        return downsample_line(xcol, ycol, glyphs, transform, plot_state)
    else:
        raise ValueError("Only handles out types of image, image_rgb and poly_line")


def downsample_line(xcol, ycol, glyphs, transform, plot_state):
    bounds = glyphs.bounds()

    screen_x_span = float(_span(plot_state['screen_x']))
    screen_y_span = float(_span(plot_state['screen_y']))
    data_x_span = float(_span(plot_state['data_x']))
    data_y_span = float(_span(plot_state['data_y']))

    (xmin, xmax) = (xcol.min(), xcol.max())
    (ymin, ymax) = (ycol.min(), ycol.max())

    shader = transform['shader']

    # How big would a full plot of the data be at the current resolution?
    if data_x_span == 0 or data_y_span == 0:
        # If scale is zero for either axis, don't actual render,
        # instead report back data bounds and wait for the next request
        # This enales guide creation...which cahgnes the available plot size.
        plot_size = [screen_x_span, screen_y_span]
        parts = shader.reformat(None)
    else:
        plot_size = [bounds[2], bounds[3]]

        vt = ar.zoom_fit(plot_size, bounds, balanced=False)

        lines = ar.render(glyphs,
                          transform['info'].reify(),
                          transform['agg'].reify(),
                          shader.reify(),
                          plot_size, vt)

        parts = shader.reformat(lines, xmin, ymin)

    parts['x_range'] = {'start': xmin, 'end': xmax}
    parts['y_range'] = {'start': ymin, 'end': ymax}

    return parts


def downsample_image(xcol, ycol, glyphs, transform, plot_state):
    bounds = glyphs.bounds()

    screen_x_span = float(_span(plot_state['screen_x']))
    screen_y_span = float(_span(plot_state['screen_y']))
    data_x_span = float(_span(plot_state['data_x']))
    data_y_span = float(_span(plot_state['data_y']))

    (xmin, xmax) = (xcol.min(), xcol.max())
    (ymin, ymax) = (ycol.min(), ycol.max())

    shader = transform['shader']

    # How big would a full plot of the data be at the current resolution?
    if data_x_span == 0 or data_y_span == 0:
        # If scale is zero for either axis, don't actual render,
        # instead report back data bounds and wait for the next request
        # This enables guide creation...which changes the available plot size.
        image = shader.reformat(None)
        scale_x = 1
        scale_y = 1
    else:
        scale_x = data_x_span/screen_x_span
        scale_y = data_x_span/screen_y_span
        plot_size = [bounds[2]/scale_x, bounds[3]/scale_y]

        ivt = ar.zoom_fit(plot_size, bounds, balanced=False)
        (tx, ty, sx, sy) = ivt

        image = ar.render(glyphs,
                          transform['info'].reify(),
                          transform['agg'].reify(),
                          shader.reify(),
                          plot_size, ivt)

        image = shader.reformat(image)

    rslt = {'image': [image],
            'global_offset_x': [0],
            'global_offset_y': [0],

            # Screen-mapping values.
            # x_range is the left and right data space values corresponding to
            #     the bottom left and bottom right of the plot
            # y_range is the bottom and top data space values corresponding to
            #     the bottom left and top left of the plot
            'x_range': {'start': xmin*scale_x, 'end': xmax*scale_x},
            'y_range': {'start': ymin*scale_y, 'end': ymax*scale_y},

            # Data-image parameters.
            # x/y are lower left data-space coord of the image.
            # dw/dh are the width and height in data space
            'x': [xmin],
            'y': [ymin],
            'dw': [xmax-xmin],
            'dh': [ymax-ymin]}

    return rslt


def _span(r):
    """Distance in a Range1D"""
    end = r.end if r.end is not None else 0
    start = r.start if r.start is not None else 0
    return abs(end-start)


def _shaper(code, size, points):
    """Construct the AR shaper to match the given shape code."""

    tox = glyphset.idx(0)
    toy = glyphset.idx(1)
    sizer = glyphset.const(size)
    code = code.lower()

    if points:
        return glyphset.ToPoint(tox, toy, sizer, sizer)
    elif code == 'square':
        return glyphset.ToRect(tox, toy, sizer, sizer)
    else:
        raise ValueError("Only recognizing 'square', received " + code)
