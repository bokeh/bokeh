from __future__ import print_function
from ..plotting import curdoc
from ..plot_object import PlotObject
from ..objects import  ServerDataSource,  Glyph, Range1d
from bokeh.properties import (Instance, Any)

import logging
logger = logging.getLogger(__file__)


def _loadAR():
  """Utility to load abstract rendering.  Keeps the import from occuring
     unless you actually try to use AR.

     This is more complex than just an import because
     AR is exposed as several backbone modules.  If the AR modules
     were directly imported, then errors would occur whenever ar_downsample
     is imported.  This casues error messages on python client side (where AR isn't
     actually needed) and on the server side even when AR isn't used.
     Since the AR modules are used throughout this module, just importing at
     use point inside this module is cumbersome.  Using 'globals()' and
     importlib allows this method to be called before any AR proper itmes are used
     but still have the imports appear at the module level.
  """
  try:
    from importlib import import_module

    globals()["numeric"] = import_module("abstract_rendering.numeric")
    globals()["general"] = import_module("abstract_rendering.general")
    globals()["infos"] = import_module("abstract_rendering.infos")
    globals()["ar"] = import_module("abstract_rendering.core")
    globals()["glyphset"] = import_module("abstract_rendering.glyphset")

  except:
    print("\n\n-----------------------------------------------------------------------")
    print("Error loading the abstract_rendering package.\n")
    print("To use the ar_downsample module, you must install the abstract rendering framework.")
    print("This can be installed with conda, pip or by")
    print("cloning from https://github.com/JosephCottam/AbstractRendering")
    print("Questions and feedback can be directed to Joseph Cottam (jcottam@indiana.edu)")
    print("-----------------------------------------------------------------------\n\n")
    raise


class Proxy(PlotObject):
  """Proxy objects stand in for the abstract rendering (AR) configuration classes.
     Basically, the AR implementation doesn't rely on Bokeh, so
     it doesn't know about the properties BUT the Bokeh needs be able to
     construct/modify/inspect AR configurations.  Proxy classes hold the relevant
     parameters for constructing AR classes in a way that Bokeh can inspect.
     Furthermore, 'reify' produces an AR class from a proxy instance.
  """
  def reify(self, **kwargs):
    raise NotImplementedError("Unipmlemented")


#### Aggregators -------------
class Sum(Proxy): 
  def reify(self, **kwargs):
    return numeric.Sum()

class Count(Proxy): 
  def reify(self, **kwargs):
    return numeric.Count()

### Infos ---------
class Const(Proxy):
  val = Any()
  def reify(self, **kwargs):
    return infos.const(self.val)

#### Transfers ---------

#Out types to support ---
# image -- grid of values
# rgb_image -- grid of colors
# poly_line -- multi-segment lines (for ISO contours...)

class Transfer(Proxy):
  def __add__(self, other): 
    return Seq(first=self, second=other)

class Seq(Transfer):
  first = Instance(Transfer)
  second = Instance(Transfer)

  def reify(self, **kwargs):
    return self.first.reify(**kwargs) + self.second.reify(**kwargs)

  def __getattr__(self, name):
    if (name == 'out'):
      self.out = self.second.out
      return self.out
    else:
      raise AttributeError(name)



class Id(Transfer): 
  out = "image"
  def reify(self, **kwargs):
    return general.Id()

class Interpolate(Transfer):
  out = "image"
  high = Any ##TODO: Restrict to numbers... 
  low = Any 
  def reify(self, **kwargs):
    return numeric.Interpolate(self.low, self.high)

class Sqrt(Transfer):
  out = "image"
  def reify(self, **kwargs):
    return numeric.Sqrt()

class Cuberoot(Transfer):
  out = "image"
  def reify(self, **kwargs):
    return numeric.Cuberoot()

class Spread(Transfer):
  out = "image"
  factor = Any #TODO: Restrict to numbers; Add shape parameter
  def reify(self, **kwargs):
    return numeric.Spread(self.factor)


#TODO: Pass the 'rend' definition through (minus the data_source references), unpack in 'downsample' instead of here...
#TODO: Move reserve control up here or palette control down.  Probably related to refactoring palette into a model-backed type
def source(plot, agg=Count(), info=Const(val=1), shader=Id(), remove_original=True, palette=["Spectral-11"], **kwargs):
  #Acquire information from renderer...
  rend = [r for r in plot.renderers if isinstance(r, Glyph)][0]
  datasource = rend.server_data_source
  kwargs['data_url'] = datasource.data_url
  kwargs['owner_username'] = datasource.owner_username
  
  spec = rend.vm_serialize()['glyphspec']

  if (shader.out == "image"): 
    kwargs['data'] = {'image': [],
                      'x': [0], 
                      'y': [0],
                      'global_x_range' : [0, 50],
                      'global_y_range' : [0, 50],
                      'global_offset_x' : [0],
                      'global_offset_y' : [0],
                      'dw' : [1], 
                      'dh' : [1], 
                      'palette': palette
                    }
  else: 
    raise ValueError("Can only work with image-shaders...for now")
  
  ##Remove the base plot (if requested)
  if remove_original and plot in curdoc()._plotcontext.children: 
    curdoc()._plotcontext.children.remove(plot)  

  kwargs['transform'] = {'resample':"abstract rendering", 'agg':agg, 'info':info, 'shader':shader, 'glyphspec': spec}
  return ServerDataSource(**kwargs)

def mapping(source):
  """Setup property mapping dictionary from source to output glyph type.
  """

  trans = source.transform
  out = trans['shader'].out

  if (out == 'image'):
    keys = source.data.keys() 
    m = dict(zip(keys, keys))
    m['x_range'] = Range1d(start=0, end=0)
    m['y_range'] = Range1d(start=0, end=0)
    return m
  else:
    raise ValueError("Only handling image type in property mapping...")

def downsample(data, transform, plot_state):
  _loadAR()  #Must be called before any attempts to use AR proper
  glyphspec = transform['glyphspec']
  xcol = glyphspec['x']['field']
  ycol = glyphspec['y']['field']
  size = glyphspec['size']['default'] ##TODO: Will not work for data-derived sizes...

  ###Translate the resample paramteres to server-side rendering....
  ###TODO: Should probably handle this type-based-unpacking server_backend so downsamples get a consistent view of the data
  if type(data) is dict:
    xcol = data[xcol]
    ycol = data[ycol]
  else:
    table = data.select(columns=[xcol, ycol])
    xcol = table[xcol]
    ycol = table[ycol]
  
  #TODO: Do more detection to find if it is an area implantation.  If so, make a selector with the right shape pattern and use a point shaper
  shaper = _shaper(glyphspec['type'], size)
  glyphs = glyphset.Glyphset([xcol, ycol], ar.EmptyList(), shaper, colMajor=True)
  bounds = glyphs.bounds()
  
  scale_x = _span(plot_state['data_x'])/float(_span(plot_state['screen_x']))
  scale_y = _span(plot_state['data_y'])/float(_span(plot_state['screen_y']))

  #How big would a full plot of the data be at the current resolution?
  if (scale_x == 0 or scale_y == 0):
    #If scale is zero for either axis, just zoom fit
    plot_size = [_span(plot_state['screen_x']), _span(plot_state['screen_y'])]
    scale_x = 1
    scale_y = 1
  else:
    plot_size = [bounds[2]/scale_x, bounds[3]/scale_y] 
  
  ivt = ar.zoom_fit(plot_size, bounds, balanced=False)  
  
  image = ar.render(glyphs, 
                    transform['info'].reify(), 
                    transform['agg'].reify(), 
                    transform['shader'].reify(), 
                    plot_size, ivt)

  (xmin, xmax) = (xcol.min(), xcol.max())
  (ymin, ymax) = (ycol.min(), ycol.max())

  rslt = {'image': [image],
          'global_offset_x' : [0],
          'global_offset_y' : [0],

          #Screen-mapping values.
          #x_range is the left and right data space values coordsponding to the bottom left and bottom right of the plot
          #y_range is the bottom and top data space values corresponding to the bottom left and top left of the plot
          'x_range' : {'start': xmin*scale_x, 'end':(xmax-xmin)*scale_x},
          'y_range' : {'start': ymin*scale_x, 'end':(ymax-ymin)*scale_y},
          
          #Data-image parameters.  
          #x/y are lower left data-space coord of the image.  
          #dw/dh are the width and height in data space
          'x' : [xmin],
          'y' : [ymin],
          'dw' : [xmax-xmin],
          'dh' : [ymax-ymin],
  }
  
  return rslt;

def _span(r):
  """Distance in a Range1D"""
  return abs(r.end - r.start)

def _shaper(code, size):
  """Construct the AR shaper to match the given shape code."""
  code = code.lower()
  if not code == 'square':
    raise ValueError("Only recognizing 'square', received " + code)
  
  tox = glyphset.idx(0)
  toy = glyphset.idx(1)
  sizer = glyphset.const(size)
  return glyphset.ToPoint(toy, tox, sizer, sizer)
