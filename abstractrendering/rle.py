from collections import OrderedDict 

##### Aggregator ##########
def RLE(x):
  rle = RunLengthEncode() 
  if type(x) is None:
    pass
  elif type(x) is list:
    for i in x:
      rle.add(i)
  else:
    rle.add(x)
  return rle

def COC(x): return CountOfCategories(RLE(x))

##### Transfers ########


def hdalpha(colors, background):
  def gen(aggs):
    (min,max) = minmax(aggs)
    def f(rle):
      if len(rle) == 0:
        c=background
      else:
        c=blend(rle,colors)
        alpha = omin + ((1-omin) * (rle.fullSize()/max));

      return Color(c.r,c.g,c.b,alpha)
    return f
  return gen

def minPercent(cutoff, above, below, background):
  def gen(aggs):
    def f(rle):
      if len(rle) == 0:
        return background
      else:
        first = rle[rle.first()]
        percentFirst = first/(float(rle.total()))
        return above if percentFirst >= cutoff else below
    return f
  return gen




##### Utilities #######


class RunLengthEncode:
  """Like a dictionary, except the same key can occur multiple times
     and the order of the keys is preserved.  Is built by stateful 
     accumulation.
  """

  def __init__(self):
      self.counts = []
      self.keys=[]

  def add(self, key):
    if (len(self.keys)==0 or key != self.keys[len(self.keys)-1]):
        self.keys.append(key)
        self.counts.append(0)
    self.counts[len(self.counts)-1] = self.counts[len(self.counts)-1]+1

  def first(self): return self.keys[0]
  def total(self): return reduce(lambda x,y:x+y, self.counts)
  
  def __len__(self): return len(self.counts)  
  def __getitem__(self, key):
    for (k,v) in self:
      if (k == key) : return v
    return None
  
  def __iter__(self): 
    return zip(self.keys, self.counts).__iter__()

  def __str__(self):
    return str(zip(self.keys,self.counts))


class CountOfCategories:
  """Count-of-categories is an RLE where the item key will only appear once.
     First-occurance order preserved.
     """

  def __init__(self, rle):
    self.coc = OrderedDict()
    for (key, count) in rle:
      if (not self.coc.has_key(key)):
        self.coc[key] = 0
      
      current = self.coc[key]
      self.coc[key] = current+count

  def first(self): return self.__iter__().next()[0]
  def total(self): return reduce(lambda x,y:x+y, self.coc.values())

  def __len__(self): return len(self.coc)
  def __getitem__(self,key): return self.coc[key]
  
  def __iter__(self):
    return zip(self.coc.keys(), self.coc.values()).__iter__()
  
  def __str__(self):
    #Note sure that the keys and the values are in the same order...
    return str(zip(self.coc.keys(), self.coc.values()))


def minmax(aggs):
  sizes = map(len, aggs)
  return (min(sizes), max(sizes))


def blend(rle, colors):
  """rle --  A run-length encoding
     colors -- An associative collection from the categories in the rle to colors
  """

  total = len(rle)
  r = 0;
  g = 0;
  b = 0;
  
  for (key,val) in rle:
    c = colors[key]

    a2 = rle.count(i)/total;
    r2 = (c.r/255.0) * a2;
    g2 = (c.g/255.0) * a2;
    b2 = (c.b/255.0) * a2;

    r += r2;
    g += g2;
    b += b2;

  return [r*255,g*255,b*255]
