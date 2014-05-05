import arpy

from bokeh.plotobject import PlotObject 
from bokeh.objects import ServerDataSource, Plot
from bokeh.properties import (HasProps, Dict, Enum, Either, Float, Instance, Int,
    List, String, Color, Include, Bool, Tuple, Any)

import logging
logger = logging.getLogger(__file__)


#High-level classes
class PropertyProxy(HasProps):
  reify_class = String()

  def __new__(cls, **kwargs): 
    newcls = super(PropertyProxy,cls).__new__(cls)
    refiy_class = cls.__name__ 
    newcls.__init__(**kwargs)
    return newcls

  @staticmethod
  def instance(desc):
    desc = dict(desc) 
    type = desc['type']
    desc.pop('type', None)
    constructor = globals()[type]
    instance = constructor()
    instance.__init__(**desc)
    return instance


class Aggregator(PropertyProxy): 
  def __init__(self, **kwargs): super(Aggregator, self).__init__(**kwargs)

class DataShader(PropertyProxy):
  out = String("image")
  def __init__(self, **kwargs): super(DataShader, self).__init__(**kwargs)

class Info(PropertyProxy):
  def __init__(self, **kwargs): super(Info, self).__init__(**kwargs)


####Specific instances
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


class Floor(DataShader):
  def __init__(self,**kwargs):
    super(Floor, self).__init__(**kwargs)


class Interpolate(DataShader):
  top = Int()
  bottom = Int()
  type = String('Interpolate')

  def __init__(self, **kwargs):
    super(Interpolate, self).__init__(**kwargs)


class Cuberoot(DataShader):
  def __init__(self, **kwargs):
    super(Cuberoot, self).__init__(**kwargs)


def Contour(DataShader):
  count = Int()
  def __init__(self, count, **kwargs):
    super(Contour, self).__init__(**kwargs)
    self.count = count



class Resample(ServerDataSource):
  """ Resample is used to construct the appropriate data strucures to run downsample.
      downsample is called by the server with arguments derived from resample.
      resample is called by the client program to build the arguments that will eventually make their way to downsample.
  """

  glyphs = Instance(Plot)
  agg = Instance(Aggregator, Count())
  info = Instance(Info)
  select = Instance(Touches)  ###The only selector...for now
  shader = Instance(DataShader)

  def __init__(self, **kwargs):
    super(ServerDataSource, self).__init__(**kwargs)

    #Setup data 'stub'
    if (self.shader is None):
      pass
    elif (self.shader.out == "image"):  
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


  def finalize(self, models):
    props = super(ServerDataSource, self).finalize(models)
    if props['agg'] is not None: props['agg'] = PropertyProxy.instance(props['agg']) 
    if props['info'] is not None: props['info'] = PropertyProxy.instance(props['info']) 
    if props['select'] is not None:  props['select'] = PropertyProxy.instance(props['select']) 
    if props['shader'] is not None: props['shader'] = PropertyProxy.instance(props['shader'])

    return props



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


