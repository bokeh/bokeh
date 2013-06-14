import ar
import numpy as np

######## Aggregators ########
def count(x):
  if type(x) is list: 
    return len(x) 
  if type(x) is None: 
    return 0
  return 1

class Count(ar.Aggregator):
  def aggregate(self, glyphset, indicies): 
    if (indicies == None):
      return 0
    return len(indicies)


######## Transfers ##########
class Segment(ar.Transfer):
  def __init__(self, low, high, divider):
    self.high = high
    self.low = low
    self.divider = float(divider)

  def f_vec(self, items):
    keys = (items >= self.divider) # .astype(int)
    out = np.empty(items.shape + (4,), dtype=np.uint8)
    out[keys] = self.high
    out[~keys] = self.low
    return out
    #return np.array([[self.high.np()],[self.low.np()]])[keys]

    #side = np.greater_equal(items.flat, self.divider) 
    #above = np.ma.masked_array(items.flat, side)


  def transfer(self, grid):
    self.min=grid._aggregates.min()
    self.max=grid._aggregates.max()
    self.span = self.max-self.min
    outgrid = self.makegrid(grid)

#    def f(v):
#      if (v > (self.span/self.divider)):
#        return self.high.np()
#      else: 
#        return self.low.np()
#
    #gw, gh = outgrid.shape[:2]
    #outgrid.reshape((gw*gh, outgrid.shape[2]))[:] = map(f, grid._projected.flat)
    outgrid = self.f_vec(grid._projected) #.reshape(grid.width,grid.height,4)
    return outgrid
 


def hdalpha(low, high):
  def gen(aggs):
    (min,max) = minmax(aggs)
    def f(v):
      return interpolateColors(low,high,min,max,v)
    return f
  return gen
      


###### Other utilities ########

def minmax(aggs):
  return (min(aggs.values), max(aggs.values))

def interpolateColors(low, high, min,  max, v):
  """low--Color for the lowest position
     high-- Color for the highest position
     min -- Smallest value v will take
     max -- largest value v will take
     v -- current value
  """

  if (v>max): v=max
  if (v<min): v=min
  distance = 1-((max-v)/float(max-min));
  r = int(weightedAverage(high.r, low.r, distance))
  g = int(weightedAverage(high.g, low.g, distance))
  b = int(weightedAverage(high.b, low.b, distance))
  a = int(weightedAverage(high.a, low.a, distance))
  return ar.Color(r,g,b,a);


#TODO: Look at the inMens perceptually-weighted average
def weightedAverage(v1, v2, weight): return (v1 -v2) * weight + v2
