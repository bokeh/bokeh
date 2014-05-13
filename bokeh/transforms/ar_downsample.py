import arpy.numeric
import arpy.infos

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
    return arpy.numeric.Count()

class Const(Proxy):
  def reify(self, **kwargs):
    return arpy.infos.const(1)

class Id(Proxy): 
  out = "image"
  def reify(self, **kwargs):
    return arpy.infos.id()


def source(datasource, **kwargs):
  #Transfer raw source information
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
               'shader': shader.serialize()}

  kwargs['transform'] = transform
  return ServerDataSource(**kwargs)

def downsample(data, resample):
  screen = (100,100) #TODO: Derive from passed parameters

  import pdb; pdb.set_trace()

  agg = globals()[resample['aggregator']['name']]().reify()
  info = globals()[resample['info']['name']]().reify()
  #select = globals()[resample['select']]()
  shader = globals()[resample['shader']['name']]().reify()

  #table = data.table
  #
  #glyphs = ????(table)
  #ivt = ar.zoom_fit(screen, ar.bounds(glyphs))  #TODO: Derive from passed parameters

  #image = ar.render(glyphs, info, agg, shader, 100, 100, ivt)
 
  return table

