import arpy

from bokeh.plotobject import PlotObject
from bokeh.objects import ColumnDataSource, ServerDataSource, Plot, Renderer, Glyph
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


class Aggregator(PlotObject): 
  def __init__(self, **kwargs): super(Aggregator, self).__init__(**kwargs)

class DataShader(PlotObject):
  out = String("image")
  def __init__(self, **kwargs): super(DataShader, self).__init__(**kwargs)

class Info(PlotObject):
  def __init__(self, **kwargs): super(Info, self).__init__(**kwargs)


####Specific instances
class Count(Aggregator):
  def __init__(self, **kwargs): 
    super(Count, self).__init__(**kwargs)
  def reify(): return arpy.numeric.Count()

class Const(Info):
  val = Any(1)
  def __init__(self, **kwargs): 
    super(Const, self).__init__(**kwargs)

class Cuberoot(DataShader):
  def __init__(self, **kwargs):
    super(Cuberoot, self).__init__(**kwargs)
#
#class Floor(DataShader):
#  def __init__(self,**kwargs):
#    super(Floor, self).__init__(**kwargs)
#
#
#class Interpolate(DataShader):
#  top = Int()
#  bottom = Int()
#  type = String('Interpolate')
#
#  def __init__(self, **kwargs):
#    super(Interpolate, self).__init__(**kwargs)
#
#def Contour(DataShader):
#  count = Int()
#  def __init__(self, count, **kwargs):
#    super(Contour, self).__init__(**kwargs)
#    self.count = count
#
#
#class Touches(PlotObject):
#  def __init__(self, **kwargs): 
#    super(Touches, self).__init__(**kwargs)
#


def glyphspec(*args, **kwargs):
  import bokeh.plotting_helpers

  #TODO: provide as params
  glyphclass = glyphs.Square
  argnames = ('x','y')
  
  # Process the keyword arguments that are not glyph-specific
  session_objs = []
  source = kwargs.pop('source', None)
  if isinstance(source, ServerDataSource):
      datasource = ColumnDataSource()
      serversource = source
      session_objs.append(serversource)
  elif source is None:
      datasource = ColumnDataSource()
      serversource = None
  else:
      datasource = source
      serversource = None
  session_objs.append(datasource)
  resample_op = kwargs.pop('resample_op', "downsample")

  # Process the glyph dataspec parameters
  glyph_params = _match_data_params(argnames, glyphclass,
                                    datasource, serversource,
                                    args, _materialize_colors_and_alpha(kwargs))

  kwargs.update(glyph_params)

  glyph_props = glyphclass.properties()
  glyph_kwargs = dict((key, value) for (key, value) in iteritems(kwargs) if key in glyph_props)

  glyph = glyphclass(**glyph_kwargs)

  nonselection_glyph_params = _materialize_colors_and_alpha(kwargs, prefix='nonselection_', default_alpha=0.1)
  nonselection_glyph = glyph.clone()

  nonselection_glyph.fill_color = nonselection_glyph_params['fill_color']
  nonselection_glyph.line_color = nonselection_glyph_params['line_color']

  nonselection_glyph.fill_alpha = nonselection_glyph_params['fill_alpha']
  nonselection_glyph.line_alpha = nonselection_glyph_params['line_alpha']

  glyph_renderer = Glyph(
      data_source=datasource,
      server_data_source=serversource,
      glyph=glyph,
      resample_op=resample_op,
      nonselection_glyph=nonselection_glyph)
  return glyph_renderer



class Resample(ServerDataSource):
  """ Resample is used to construct the appropriate data strucures to run downsample.
      downsample is called by the server with arguments derived from resample.
      resample is called by the client program to build the arguments that will eventually make their way to downsample.
  """

  glyphs = Instance(Glyph)
  agg = Instance(Aggregator)
  info = Instance(Info)
  #select = Instance(Touches)  ###The only selector...for now
  shader = Instance(DataShader)

  def __init__(self, **kwargs):
    super(ServerDataSource, self).__init__(**kwargs)

    #Would like it if Properties set the defaults when not provided....
    if self.agg is None : self.agg = Count() 
    if self.info is None : self.info = Const(val=1) 
    if self.shader is None : self.shader = Cuberoot() 
    
    #Setup data 'stub'
    if (self.shader is not None and self.shader.out == "image"): 
      #Placeholder 'data'....fill in the details in the 'downsample' method
      self.data={'x': [0], 
            'y': [0],
            'global_x_range' : [0, 10],
            'global_y_range' : [0, 10],
            'global_offset_x' : [0],
            'global_offset_y' : [0],
            'dw' : [10], 
            'dh' : [10], 
           }
    else:
      raise TypeError("Can only work with transfers that produce 'image' (discrete-grid) output...for now")


  def vm_serialize(self):
    #import pdb; pdb.set_trace()
    return super(Resample,self).vm_serialize()
  
  
  def finalize(self, models):
    #import pdb; pdb.set_trace()
    return super(Resample,self).finalize(models)

  def update(self, **kwargs):
    #import pdb; pdb.set_trace()
    super(Resample, self).update(**kwargs)
    
  def __add__(self, other):
    if (not isinstance(other, Transfer)): 
        raise TypeError("Can only extend with a transfer on the left.  Received a " + str(type(other)))

    t = other if self._transfer is None else self._transfer + other 
    return Resample(_agg, _info, _select, t, _glyphs)
    
  def __radd__(self, other):
    if (not isinstance(other, Plot)):
        raise TypeError("Can only extend with a plot on the right.  Received a " + str(type(other)))
    return Resample(_agg, _info, _select, _transfer, _glyphs)




def downsample(data):
  logger.info("Called AR Downsample! ----------------------------------------------------------")


