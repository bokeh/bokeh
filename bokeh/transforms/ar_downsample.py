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

class Count(object): 
  def reify(self, **kwargs):
    return arpy.numeric.Count()

class Const(object):
  def reify(self, **kwargs):
    return arpy.infos.Const(1)

class Id(object): 
  def reify(self, **kwargs):
    return arpy.infos.Id()


def source(**kwargs):
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

  transform = Dict()
  transform['resample'] = "abstract rendering"
  transform['aggregator'] = Count().serialize()
  transform['info'] = Const().serialize() 
  transform['shader'] = shader.serialize() 

  kwargs['transform'] = transform
  return ServerDataSource(**kwargs)

def downsample(data, resample):
  agg = locals()[resample['aggregator']]()
  info = locals()[resample['info']]()
  #select = locals()[resample['select']]()
  shader = locals()[resample['shader']]()

  logger.info("Called AR Downsample! ----------------------------------------------------------")
  return data

