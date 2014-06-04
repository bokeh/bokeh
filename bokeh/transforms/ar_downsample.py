import abstract_rendering.numeric as numeric
import abstract_rendering.general as general
import abstract_rendering.infos as infos
import abstract_rendering.core as ar
import abstract_rendering.glyphset as glyphset

from ..objects import ColumnDataSource, ServerDataSource, Plot, Renderer, Glyph
from bokeh.properties import (HasProps, Dict, Enum, Either, Float, Instance, Int,
    List, String, Color, Include, Bool, Tuple, Any)
from ..plot_object import Viewable
import bokeh.glyphs as glyphs
from ..plotting_helpers import (get_default_color, get_default_alpha,
        _glyph_doc, _match_data_params, _update_plot_data_ranges,
        _materialize_colors_and_alpha, _get_legend, _make_legend,
        _get_select_tool, _new_xy_plot, _handle_1d_data_args, _list_attr_splat)

from six import add_metaclass, iteritems
import logging
logger = logging.getLogger(__file__)


class Proxy(HasProps):
  def __init__(self, *args): pass

  def reify(self, **kwargs):
    raise Error("Unipmlemented")


#### Aggregators -------------
class Sum(Proxy): 
  def __init__(self, *args): pass
  def reify(self, **kwargs):
    return numeric.Sum()

class Count(Proxy): 
  def __init__(self, *args): pass
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
  def __init__(self, *args): pass
  def reify(self, **kwargs):
    return general.Id()

class Interpolate(Proxy):
  out = "image"
  def __init__(self, *args): pass
  def reify(self, **kwargs):
    return numeric.Interpolate(kwargs['low'], kwargs['high'])

class Sqrt(Proxy):
  out = "image"
  def __init__(self, *args): pass
  def reify(self, **kwargs):
    return numeric.Sqrt()

class Cuberoot(Proxy):
  out = "image"
  def __init__(self, *args): pass
  def reify(self, **kwargs):
    return numeric.Cuberoot()

class Transform(HasProps):
  resample = String("abstract rendering")
  agg = Any(Proxy)
  info = Any(Proxy)
  shader = Any(Proxy)
  spec = Dict(String, Any)

#TODO: Pass the 'rend' defintiion through (minus the data_source references), unpack in 'downsample' instead of here...
def source(plot, agg=Count(), info=Const(1), shader=Id(), **kwargs):
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
                      'palette': ["Spectral-11"]
                    }
  else: 
    raise ValueError("Can only work with image-shaders...for now")


  transform = Transform(agg=agg, info=info, shader=shader, spec=spec)
  kwargs['transform'] = transform.to_dict()
  return ServerDataSource(**kwargs)


def downsample(data, transform, plot_state):
  def _reify(key):
    return globals()[transform[key]['name']](*transform[key]['args']).reify()

  plot_size = [plot_state['screen_x'].end - plot_state['screen_x'].start,
               plot_state['screen_y'].end - plot_state['screen_y'].start]


  agg = _reify('aggregator')
  info = _reify('info')
  #select = globals()[transform['select']['name']](**transform['select'])
  shader = _reify('shader') 

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
  ivt = ar.zoom_fit(plot_size, bounds)  #TODO: Derive transform from passed parameters
  image = ar.render(glyphs, info, agg, shader, plot_size, ivt)
  
  logger.info("Max %s ----------" % [image.max()])
  logger.info("Min %s ----------" % [image.min()])

  return {'image': [image],
          'x': [0],
          'y': [0],
          'dw': [image.shape[0]],
          'dh': [image.shape[1]],
  }

def _shaper(code, size):
  code = code.lower()
  if not code == 'square':
    raise ValueError("Only recognizing 'square' received " + code)
  
  tox = glyphset.idx(0)
  toy = glyphset.idx(1)
  sizer = glyphset.const(size)
  return glyphset.ToRect(tox, toy, sizer, sizer)
