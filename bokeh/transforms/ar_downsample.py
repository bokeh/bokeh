import abstract_rendering.numeric as numeric
import abstract_rendering.general as general
import abstract_rendering.infos as infos
import abstract_rendering.core as ar

from ..objects import ColumnDataSource, ServerDataSource, Plot, Renderer, Glyph
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


class Proxy(object):
  def serialize(self):
    return {"name":self.__class__.__name__}

  def reify(self, **kwargs):
    raise Error("Unipmlemented")



class Count(Proxy): 
  def reify(self, **kwargs):
    return numeric.Count()

class Const(Proxy):
  def reify(self, **kwargs):
    return infos.const(1)

class Id(Proxy): 
  out = "image"
  def reify(self, **kwargs):
    return general.Id()


#TODO: Pass the 'rend' defintiion through (minus the data_source references), unpack in 'downsample' instead of here...
def source(plot, x, y, shape='square', **kwargs):
  #Acquire information from renderer...
  rend = [r for r in plot.renderers if isinstance(r, Glyph)][0]
  xcol = rend.glyph.x['field']
  ycol = rend.glyph.y['field']
  size = rend.glyph.size['default'] ##TODO: Will not work for data-derived sizes...
  datasource = rend.server_data_source
  kwargs['data_url'] = datasource.data_url
  kwargs['owner_username'] = datasource.owner_username
  
  shader = Id()

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

  transform = {'resample' : 'abstract rendering',
               'aggregator': Count().serialize(),
               'info': Const().serialize(),
               'shader': shader.serialize(),
               'x' : xcol,
               'y' : ycol,
               'size' : size,
               'shape' : shape}

  kwargs['transform'] = transform
  return ServerDataSource(**kwargs)

def downsample(data, transform, plot_size):

  agg = globals()[transform['aggregator']['name']]().reify()
  info = globals()[transform['info']['name']]().reify()
  #select = globals()[transform['select']]()
  shader = globals()[transform['shader']['name']]().reify()
  size = transform['size']


  ###Translate the resample paramteres to server-side rendering....
  ###TODO: Actual access routine varies depending on the input data type... 
  table = data.select(columns=[transform['x'], transform['y']])
  xcol = table[transform['x']]
  ycol = table[transform['y']]
    
  glyphs = ar.Glyphset()
  glyphs.shapecode = _shapecode(transform['shape'])
  for (x,y) in zip(xcol, ycol):
    #TODO: This copy is...unfortunate.  AR needs to just take the zip iterator....
    glyphs.append(ar.Glyph(x,y,size,size))  

  bounds = ar.bounds(glyphs)
  ivt = ar.zoom_fit(plot_size, bounds)  #TODO: Derive transform from passed parameters
  image = ar.render(glyphs, info, agg, shader, plot_size, ivt)
 
  #import numpy as np
  #image._aggregates = np.random.randint(10, size=image._aggregates.shape)
  #import pdb; pdb.set_trace()
  return {'image': [image._aggregates],
          'x': [0],
          'y': [0],
          'dw': [image._aggregates.shape[0]],
          'dh': [image._aggregates.shape[1]],
  }



def _shapecode(code):
  """Convert a string to an AR shapecode."""

  code = code.lower()
  if code == 'square':
    return ar.ShapeCodes.RECT
  else:
    raise ValueError("Only recognizing 'square' received " + code)


