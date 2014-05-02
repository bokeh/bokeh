import arpy

from bokeh.objects import ServerDataSource
from bokeh.properties import (HasProps, Dict, Enum, Either, Float, Instance, Int,
    List, String, Color, Include, Bool, Tuple, Any)

def downsample(data, grid):

  

  pass


class Resample(ServerDataSource):
  """ Resample is used to construct the appropriate data strucures to run downsample.
      downsample is called by the server with arguments derived from resample.
      resample is called by the client program to build the arguments that will eventually make their way to downsample.
  """



  def __init__(self, agg=arpy.count(), info=arpy.const(1), select=arpy.touches(), transfer=None, glyphs=None):
    super(ServerDataSource, this).__init__()
    self._glyphs = glyphs
    self._agg = agg
    self._info = info
    self._select = select
    self._transfer = transfer


  def __add__(self, other):
    if (not isinstance(other, Transfer)): 
        raise TypeError("Can only extend with a transfer on the left.  Received a " + str(type(other)))

    t = other if self._transfer is None else self._transfer + other 
    return Resample(_agg, _info, _select, t, _glyphs)
    

  def __radd__(self, other):
    if (not isinstance(other, Plot)):
        raise TypeError("Can only extend with a plot on the right.  Received a " + str(type(other)))
    return Resample(_agg, _info, _select, _transfer, _glyphs)


