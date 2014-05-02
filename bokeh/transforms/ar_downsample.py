import arpy

from bokeh.plotobject import PlotObject
from bokeh.objects import ServerDataSource, Plot
from bokeh.properties import (HasProps, Dict, Enum, Either, Float, Instance, Int,
    List, String, Color, Include, Bool, Tuple, Any)


#High-level classes
class Aggregator(PlotObject): 
  def __init__(self, **kwargs): super(Aggregator, self).__init__(**kwargs)

class DataShader(PlotObject):
  def __init__(self, **kwargs): super(DataShader, self).__init__(**kwargs)

class Info(PlotObject):
  def __init__(self, **kwargs): super(Info, self).__init__(**kwargs)


####Low-level instances
class Count(Aggregator):
  def __init__(self, **kwargs): 
    super(Count, self).__init__(**kwargs)
  def reify(): return arpy.numeric.Count()

class Const(Info):
  val = Any()
  def __init__(self, val=1, **kwargs): 
    super(Const, self).__init__(**kwargs)
    self.val = val


class Touches(PlotObject):
  def __init__(self, **kwargs): 
    super(Touches, self).__init__(**kwargs)


class Floor(PlotObject):
  def __init__(self,**kwargs):
    super(Floor, self).__init__(**kwargs)


class Interpolate(PlotObject):
  top = Int()
  bottom = Int()
  out = String("image")

  def __init__(self, top, bottom, **kwargs):
    super(Interpolate, self).__init__(**kwargs)
    self.top = top
    self.bottom = bottom


class Cuberoot(PlotObject):
  def __init__(self, **kwargs):
    super(Cuberoot, self).__init__(**kwargs)


def Contour(PlotObject):
  count = Int()
  def __init__(self, count, **kwargs):
    super(Contour, self).__init__(**kwargs)
    self.count = count


def downsample(data):
  pass


class Resample(ServerDataSource):
  """ Resample is used to construct the appropriate data strucures to run downsample.
      downsample is called by the server with arguments derived from resample.
      resample is called by the client program to build the arguments that will eventually make their way to downsample.
  """

  glyphs = Instance(Plot)
  agg = Instance(Aggregator)
  info = Instance(Info)
  select = Instance(Touches)  ###The only one...for now
  shader = Instance(DataShader)

  def __init__(self, agg=Count(), info=Const(1), select=Touches(), shader=None, glyphs=None, **kwargs):
    super(ServerDataSource, self).__init__()
    self.glyphs = glyphs
    self.agg = agg
    self.info = info
    self.select = select
    self.shader = shader

    #Setup data 'stubs'
    if (shader is None):
      pass
    elif (shader.out == "image"):
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

