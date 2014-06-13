import abstract_rendering.numeric as numeric
import abstract_rendering.general as general
import abstract_rendering.infos as infos
import abstract_rendering.core as ar
import abstract_rendering.glyphset as glyphset

from ..plotting import curdoc
from ..plot_object import PlotObject
from ..objects import ColumnDataSource, ServerDataSource, Plot, Renderer, Glyph, Range1d
from bokeh.properties import (HasProps, Dict, Enum, Either, Float, Instance, Int,
    List, String, Color, Include, Bool, Tuple, Any)
import bokeh.glyphs as glyphs
from ..plotting_helpers import (get_default_color, get_default_alpha,
        _glyph_doc, _match_data_params, _update_plot_data_ranges,
        _materialize_colors_and_alpha, _get_legend, _make_legend,
        _get_select_tool, _new_xy_plot, _handle_1d_data_args, _list_attr_splat)


from six import add_metaclass, iteritems
import logging
logger = logging.getLogger(__file__)


class Proxy(PlotObject):
  """Proxy objects stand in for the abstract rendering (AR) configuration classes.
     Basically, the AR implementation doesn't rely on Bokeh, so
     it doesn't know about the properties BUT the Bokeh needs be able to
     construct/modify/inspect AR configurations.  Proxy classes hold the relevant
     parameters for constructing AR classes in a way that Bokeh can inspect.
     Furthermore, 'reify' produces an AR class from a proxy instance.
  """
  def reify(self, **kwargs):
    raise Error("Unipmlemented")


#### Aggregators -------------
class Sum(Proxy): 
  def reify(self, **kwargs):
    return numeric.Sum()

class Count(Proxy): 
  def reify(self, **kwargs):
    return numeric.Count()

### Infos ---------
class Const(Proxy):
  val = Any()
  def reify(self, **kwargs):
    return infos.const(self.val)

#### Transfers ---------

class Id(Proxy): 
  out = "image"
  def reify(self, **kwargs):
    return general.Id()

class Interpolate(Proxy):
  out = "image"
  def reify(self, **kwargs):
    return numeric.Interpolate(kwargs['low'], kwargs['high'])

class Sqrt(Proxy):
  out = "image"
  def reify(self, **kwargs):
    return numeric.Sqrt()

class Cuberoot(Proxy):
  out = "image"
  def reify(self, **kwargs):
    return numeric.Cuberoot()

#TODO: Pass the 'rend' defintiion through (minus the data_source references), unpack in 'downsample' instead of here...
def source(plot, agg=Count(), info=Const(val=1), shader=Id(), remove_original=True, palette=["Spectral-11"], **kwargs):
  #Acquire information from renderer...
  rend = [r for r in plot.renderers if isinstance(r, Glyph)][0]
  datasource = rend.server_data_source
  kwargs['data_url'] = datasource.data_url
  kwargs['owner_username'] = datasource.owner_username
  
  spec = rend.vm_serialize()['glyphspec']

  if (shader.out == "image"): 
    kwargs['data'] = {'x': [0], 
                      'y': [0],
                      'global_x_range' : [0, 10],
                      'global_y_range' : [0, 10],
                      'global_offset_x' : [0],
                      'global_offset_y' : [0],
                      'dw' : [10], 
                      'dh' : [10], 
                      'palette': palette
                    }
  else: 
    raise ValueError("Can only work with image-shaders...for now")
  
  ##Remove the base plot (if requested)
  if remove_original: 
    curdoc()._plotcontext.children.remove(plot)  

  kwargs['transform'] = {'resample':"abstract rendering", 'agg':agg, 'info':info, 'shader':shader, 'glyphspec': spec}
  return ServerDataSource(**kwargs)

def mapping(source):
  x_range = Range1d(start=0, end=500)
  y_range = Range1d(start=0, end=500)
  return {'x':'x', 'y':'y', 'image':'image', 'dw': 'dw', 'dh': 'dh', 'x_range': x_range, 'y_range': y_range, 'palette':'palette'}

def downsample(data, transform, plot_state):
  screen_size = [span(plot_state['screen_x']),
                 span(plot_state['screen_y'])]

  scale_x = span(plot_state['data_x'])/float(span(plot_state['screen_x']))
  scale_y = span(plot_state['data_y'])/float(span(plot_state['screen_y']))
  
  #How big would a full plot of the data be at the current resolution?
  plot_size = [screen_size[0] / scale_x,  screen_size[1] / scale_y]
  
  
  glyphspec = transform['glyphspec']
  xcol = glyphspec['x']['field']
  ycol = glyphspec['y']['field']
  size = glyphspec['size']['default'] ##TODO: Will not work for data-derived sizes...

  ###Translate the resample paramteres to server-side rendering....
  table = data.select(columns=[xcol, ycol])
  xcol = table[xcol]
  ycol = table[ycol]
  
  shaper = _shaper(glyphspec['type'], size)
  glyphs = glyphset.Glyphset([xcol, ycol], ar.EmptyList(), shaper, colMajor=True)
  bounds = glyphs.bounds()
  ivt = ar.zoom_fit(plot_size, bounds, balanced=False)  

  image = ar.render(glyphs, 
                    transform['info'].reify(), 
                    transform['agg'].reify(), 
                    transform['shader'].reify(), 
                    plot_size, ivt)
  
  return {'image': [image],
          'x': [0],
          'y': [0],
          'dw': [image.shape[0]],
          'dh': [image.shape[1]],
  }


def span(r):
    return r.end - r.start

def _shaper(code, size):
  code = code.lower()
  if not code == 'square':
    raise ValueError("Only recognizing 'square' received " + code)
  
  tox = glyphset.idx(0)
  toy = glyphset.idx(1)
  sizer = glyphset.const(size)
  return glyphset.ToRect(tox, toy, sizer, sizer)
