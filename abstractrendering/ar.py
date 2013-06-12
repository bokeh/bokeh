import bokeh.glyphs 
import re
import sys
import numpy as np

##Abstract rendering function implementation modules
import counts
import rle
import infos

############################  Core System ####################
class Aggregates:
  def __init__(self, width, height):
    self.values=(width*height)*[None]
    self.w=width
    self.h=height

  def set(self, x, y, v): self.values[self.idx(x,y)]=v
  def get(self, x, y): return self.values[self.idx(x,y)]
  def idx(self, x, y): return (self.h*x)+y
  def width(self): return self.w 
  def height(self): return self.h

  def as_nparray(self):
    """Convert to a numpy array of quads....Assumes the items are colors.
       This is not a good idea long-term, but we're using it for glue right now."""
    a = np.ndarray(shape=(self.w, self.h, 4), dtype="uint8")
    for x in range(0, self.w):
      for y in range(0, self.h):
        c = self.get(x,y)
        a[x][y][0] = c.r
        a[x][y][1] = c.g
        a[x][y][2] = c.b
        a[x][y][3] = c.a
    return a

  def __str__(self):
    ds = lambda v: map(str, v)
    chunks = map(str, map(ds, [self.values[i:i+self.w] for i in xrange(0, len(self.values), self.w)]))
    return "\n".join(chunks) 


def aggregate(glyphs, selector, info, reducer, screen, ivt):
  (width,height) = screen
  aggs = Aggregates(width,height)
  for x in range(0, width):
    for y in range(0, height):
      px = ivt.transform(Pixel(x,y,1,1))
      gs = selector(px, glyphs)
      vs = map(info, gs)
      v = reducer(vs)
      aggs.set(x,y,v)
  
  return aggs


def transfer(aggs, trans):
  image = Aggregates(aggs.width(), aggs.height())
  f = trans(aggs)

  for x in range(0, aggs.width()):
    for y in range(0, aggs.height()):
      c = f(aggs.get(x,y))
      image.set(x, y, c)

  return image


#class GlyphSet(list):
#    pass


class Grid(object):

    width = 2000
    height = 2000
    viewxform = None   # array [tx, ty, sx, sy]

    _projected_grid = None

    def project(self, glyphset):
        """
        Parameters
        ==========
        glyphset: Numpy record array
            should be record array with at least the following named fields:
            x, y, width, height.

        Stores result in _projected_grid.
        """

        outgrid = np.empty((self.width, self.height), dtype=object)
        for g in glyphset:
            # transform and add to grid
            pass
        self._projected_grid = outgrid

    def reduce(self, reducer, glyphset):
        """ 
        Returns ndarray of results of applying func to each element in 
        the grid.  Creates a new ndarray of the given dtype.
        """
        outgrid = np.empty_like(self._projected_grid)
        outgrid.ravel()[:] = map(lambda x: reducer(glyphset, x), 
                                    self._projected_grid.flat)

    def transfer(self, transferer):
        """
        Returns pixel grid of NxMxRGBA32
        """

        
class Reducer(object):

    infields = None
    outfields = None

    def reduce(self, glyphset, indices):
        """ Returns the reduced values from just the indicated fields and
        indicated elements of the glyphset
        """

class Transfer(object):
    input_spec = None # tuple of (shape, dtype)
    # For now assume output is RGBA32
    #output = None

    def transfer(self, grid):
        pass

def render(glyphs, selector, info, reducer, trans, screen,ivt):
  """
  Render a set of glyphs under the specified condition to the described canvas.
  glyphs ---- Glyphs t render
  selector -- Function used to select which glyphs apply to which pixel
  reducer --- Function to combine a set of glyphs into a single aggregate value
  trans ----- Function for converting aggregates to colors
  w,h  ------ width/height of the canvas
  ivt ------- INVERSE view transform (converts pixels to canvas space)
  """

  aggs = aggregate(glyphs, selector, info, reducer, screen,ivt)
  image = transfer(aggs, trans)
  return image


###############################  Graphics Components ###############

#TODO: Verify that this is the right way to do affine transforms of shapes...at least as far as zoom/pan
class AffineTransform:
  m = None
  def __init__(self, tx, ty, sx, sy):
    self.m = [[sx,0,tx],
              [0,sy,ty],
              [0,0,1]]
  def trans(self, x, y):
    x = self.m[0][0]*x + self.m[0][1]*y + self.m[0][2]
    y = self.m[1][0]*x + self.m[1][1]*y + self.m[1][2]
    return (x, y)

  def transform(self, r):
    (p1x,p1y) = self.trans(r.x, r.y)
    (p2x,p2y) = self.trans(r.x+r.w, r.y+r.h)
    w = p2x-p1x
    h = p2y-p1y
    return Pixel(p1x,p1y,w,h)

class Color:
  r=None
  g=None
  b=None
  a=None

  def __init__(self,r,g,b,a):
    self.r=r
    self.g=g
    self.b=b
    self.a=a

  def __str__(self):
    return str([self.r,self.g,self.b,self.a])


class Pixel:
  x=None
  y=None
  w=None
  h=None

  def __init__(self,x,y,w,h):
    self.x=x
    self.y=y
    self.w=w
    self.h=h

  def __str__(self):
    return ",".join(map(str, [self.x,self.y,self.w,self.h]))

############################  Support functions ####################


#Assumes x,y,w,h exist on glyph
#Does the glyph contain any part of the pixel?
def contains(px, glyph):
  return (px.x+px.w > glyph.x   #Really is >= if using "left/top is in, right/bottom is out" convention
      and px.y + px.h > glyph.y #Really is >= if using "left/top is in, right/bottom is out" convention
      and px.x < glyph.x + glyph.width
      and px.y < glyph.y + glyph.height)

def containing(px, glyphs):
  items = []
  for g in glyphs:
    if contains(px, g): 
      items.append(g)
      
  return items

def bounds(glyphs):
  """Compute bounds of the glyph-set.  Returns (X,Y,W,H)"""
  minX=float("inf")
  maxX=float("-inf")
  minY=float("inf")
  maxY=float("-inf")
  for g in glyphs:
    minX=min(minX, g.x)
    maxX=max(maxX, g.x+g.width)
    minY=min(minY, g.y)
    maxY=max(maxY, g.y+g.height)

  return (minX, minY, maxX-minX, maxY-minY)

def zoom_fit(screen, bounds):
  """What affine transform will zoom-fit the given items?
     screen: (w,h) of the viewing region
     bounds: (x,y,w,h) of the items to fit
     returns: AffineTransform object
  """
  (sw,sh) = screen
  (gx,gy,gw,gh) = bounds
  scale = max(gw/sw, gh/sh)
  return AffineTransform(gx,gy,scale,scale)


def load_csv(filename, skip, xc,yc,vc,width,height):
  source = open(filename, 'r')
  glyphs = []
  
  for i in range(0, skip):
    source.readline()

  for line in source:
    line = re.split("\s*,\s*", line)
    x = float(line[xc].strip())
    y = float(line[yc].strip())
    v = line[vc].strip()

    glyphs.append(bokeh.glyphs.SquareX(x=x,y=y,width=width,height=height,fill="red",value=v))
  source.close()
  return glyphs

def main():
  source = sys.argv[1]
  skip = int(sys.argv[2])
  xc = int(sys.argv[3])
  yc = int(sys.argv[4])
  vc = int(sys.argv[5])
  glyphs = load_csv(source,skip,xc,yc,vc)

  #image = render(glyphs, containing, infos.const(1), counts.count, counts.segment("R",".",2), 20,20, AffineTransform(0,0,.25,.25))
  #image = render(glyphs, containing, infos.attribute("color",None), rle.RLE, rle.minPercent(.5,"A","B","."), 20,20, AffineTransform(0,0,.25,.25))
  image = render(glyphs, containing, infos.attribute("value",None), rle.COC, rle.minPercent(.5,"A","B","."), 10,10, AffineTransform(-1,-1,.35,.35))
  print image


if __name__ == "__main__":
    main()
