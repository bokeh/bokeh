import abstract_rendering.numeric as numeric
import abstract_rendering.general as general
import abstract_rendering.infos as infos
import abstract_rendering.core as ar
import abstract_rendering.glyphset as glyphset

from ..plotting import *
from ..objects import (ColumnDataSource, ServerDataSource, Plot, Renderer, Glyph, Range1d)
from bokeh.properties import (HasProps, Dict, Enum, Either, Float, Instance, Int,
    List, String, Color, Include, Bool, Tuple, Any)
import bokeh.glyphs as glyphs
from ..plotting_helpers import (get_default_color, get_default_alpha,
        _glyph_doc, _match_data_params, _update_plot_data_ranges,
        _materialize_colors_and_alpha, _get_legend, _make_legend,
        _get_select_tool, _new_xy_plot, _handle_1d_data_args, _list_attr_splat)

from six import iteritems
import logging
logger = logging.getLogger(__file__)

#TODO: Make a 'plot' function here that takes all the parameters of source AND a glyphspec source.  Automatically makes the right kind of plot with the right property bindings 


class Proxy(object):
  def __init__(self, *args): pass
  def serialize(self):
    return {'name':self.__class__.__name__, 'args':[]}

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
  def __init__(self, *vls):
    self.val=vls[0]

  def reify(self, **kwargs):
    return infos.const(self.val)

  def serialize(self):
    return {'name':self.__class__.__name__, 'args':[self.val]}

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

def replot(spec, agg=Count(), info=Const(1), shader=Id(), **kwargs):
  """Convenience method, creates the source and then calls plot."""
  return plot(source(spec, agg, info, shader, **kwargs), **kwargs)

def plot(datasource, **kwargs):
  """Construct a plot for the passed datasource.  Inspects the datasource's transform
     to determine the relevant plotting setup."""

  if ((type(datasource) is not ServerDataSource or datasource.transform is None)
      and datasource.transform['resample'] is not "abstract rendering"):
    raise ValueError("Must use a datasource prepared for abstract rendering")

  shader = _instance(datasource.transform, 'shader')
  
  if (shader.out == "image"):
    palette = kwargs.pop('palette',"reds-9")
    glyphs = _glyphset(?????)  ###What goes here....the data may not exist on the client....ARG!!!
    bounds = glyphs.bounds()
    x_range = Range1d(bounds[0], bounds[0]+bounds[2])
    y_range = Range1d(bounds[1], bounds[1]+bounds[3])
    return image(source=datasource, 
                 image="image", 
                 x='x', y='y',dw='dw',dh='dh', 
                 palette=[palette],
                 x_range=x_range,
                 y_range=y_range,)
  else: 
    raise ValueError("Can only work with image-shaders...for now")


def source(plot, agg=Count(), info=Const(1), shader=Id(), **kwargs):
  curdoc().remove(plot)  ###TODO: WHY DOESN'T THIS remove the existing plot...I want to replace it (or maybe we should take glyphspecs instead of plots...)
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
                      'palette': ["Spectral-11"],
                      'x_range': [0,520],
                      'y_range': [0,520]
                    }
  else: 
    raise ValueError("Can only work with image-shaders...for now")

  transform = {'resample' : 'abstract rendering',
               'aggregator': agg.serialize(),
               'info': info.serialize(),
               'shader': shader.serialize(),
               'glyphspec': spec
               }


  kwargs['transform'] = transform
  return ServerDataSource(**kwargs)


def downsample(data, transform, plot_state):
  plot_size = [plot_state['screen_x'].end - plot_state['screen_x'].start,
               plot_state['screen_y'].end - plot_state['screen_y'].start]

  agg = _reify(transform, 'aggregator')
  info = _reify(transform, 'info')
  #select = globals()[transform['select']['name']](**transform['select'])
  shader = _reify(transform, 'shader') 

  glyphs = _glyphset(data, transform['glyphspec'])

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
#          'x_range': [0,520],
#          'y_range': [0,520]
  }


def _glyphset(data, glyphspec):
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
  return glyphs


def _instance(context, key):
  return globals()[context[key]['name']](*context[key]['args'])

def _reify(context, key):
  return _instance(context, key).reify() 


def _shaper(code, size):
  code = code.lower()
  if not code == 'square':
    raise ValueError("Only recognizing 'square' received " + code)
  
  tox = glyphset.idx(0)
  toy = glyphset.idx(1)
  sizer = glyphset.const(size)
  return glyphset.ToRect(tox, toy, sizer, sizer)
