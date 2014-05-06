import arpy

from bokeh.plotobject import PlotObject 
from bokeh.objects import ServerDataSource, Plot
from bokeh.properties import (HasProps, Dict, Enum, Either, Float, Instance, Int,
    List, String, Color, Include, Bool, Tuple, Any)

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


class Resample(ServerDataSource):
  """ Resample is used to construct the appropriate data strucures to run downsample.
      downsample is called by the server with arguments derived from resample.
      resample is called by the client program to build the arguments that will eventually make their way to downsample.
  """

  glyphs = Instance(Plot)
  agg = Instance(Aggregator, default=Count())
  info = Instance(Info, default=Const(val=1))
  #select = Instance(Touches)  ###The only selector...for now
  shader = Instance(DataShader, default=Cuberoot())

  def __init__(self, **kwargs):
    super(ServerDataSource, self).__init__(**kwargs)

    if self.agg is None : self.agg = Count() 
    if self.info is None : self.info = Const(val=1) 
    if self.shader is None : self.shader = Cuberoot() 

    #Setup data 'stub'
    if (self.shader.out == "image"):  
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


