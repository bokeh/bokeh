import bokeh.glyphs 
import re
import sys
import numpy as np
from math import ceil, floor 

from numba import autojit

from timer import Timer


############################  Core System ####################
class Glyphset(list):
    pass


def _project(viewxform, glyphset, outgrid):
  """
  Parameters
  ==========
  glyphset: Numpy record array
  should be record array with at least the following named fields:
  x, y, width, height.

  Stores result in _projected.
  Stores the passed glyphset in _glyphset
  """

  # transform each glyph and add it to the grid
  for i in xrange(0, len(glyphset)):
    g = glyphset[i]
    gt = viewxform.transform(g)
    for x in xrange(int(floor(gt.x)), int(ceil(gt.x+gt.width))):
      for y in xrange(int(floor(gt.y)), int(ceil(gt.y+gt.height))):
        ls = outgrid[x,y]
        if (ls == None): 
          ls = []
        outgrid[x,y]=ls
        ls.append(i)

class Grid(object):
    width = 2000
    height = 2000
    viewxform = None   # array [tx, ty, sx, sy]

    _glyphset = None
    _projected = None
    _aggregates = None

    def __init__(self, w,h,viewxform):
      self.width=w
      self.height=h
      self.viewxform=viewxform
      self.numba_project = autojit()(_project)

    def project(self, glyphset):
      self._glyphset = glyphset
      self._projected = np.empty((self.width, self.height), dtype=object)
      self.numba_project(self.viewxform, glyphset, self._projected)
      #self._projected = _project(self.viewxform, glyphset, self._projected)

    def aggregate(self, aggregator):
        """ 
        Returns ndarray of results of applying func to each element in 
        the grid.  Creates a new ndarray of the given dtype.

        Stores the results in _aggregates
        """
        outgrid = np.empty_like(self._projected)
        outgrid.ravel()[:] = map(lambda ids: aggregator.aggregate(self._glyphset, ids), 
                                    self._projected.flat)

        self._aggregates = outgrid

    def transfer(self, transferer):
        """ Returns pixel grid of NxMxRGBA32 (for now) """
        return transferer.transfer(self)

        
class Aggregator(object):
    infields = None

    def aggregate(self, glyphset, indices):
        """ Returns the aggregated values from just the indicated fields and
        indicated elements of the glyphset
        """
        pass

class Transfer(object):
  input_spec = None # tuple of (shape, dtype)
  # For now assume output is RGBA32
  #output = None

  def makegrid(self, grid):
    return np.ndarray((grid.width, grid.height, 4), dtype=np.uint8)

  def transfer(self, grid):
    raise NotImplementedError

 
class PixelTransfer(Transfer):
  """Transfer function that does non-vectorized per-pixel transfers."""

  def __init__(self, pixelfunc, prefunc):
    self.pixelfunc = pixelfunc
    self.prefunc = prefunc

  def transfer(self, grid):
    outgrid = self.makegrid(grid)
    self._pre(grid)
    (width,height) = (grid.width, grid.height)

    for x in xrange(0, width):
      for y in xrange(0, height):
        outgrid[x,y] = self.pixelfunc(grid, x, y)

    return outgrid


def render(glyphs, aggregator, trans, screen,ivt):
  """
  Render a set of glyphs under the specified condition to the described canvas.
  glyphs ---- Glyphs t render
  selector -- Function used to select which glyphs apply to which pixel
  aggregator  Function to combine a set of glyphs into a single aggregate value
  trans ----- Function for converting aggregates to colors
  screen ---- (width,height) of the canvas
  ivt ------- INVERSE view transform (converts pixels to canvas space)
  """

  with Timer("Load") as t:
    grid = Grid(screen[0], screen[1], ivt.inverse())

  with Timer("Project:") as t:
    grid.project(glyphs)

  with Timer("Aggregate") as t:
    grid.aggregate(aggregator)

  with Timer("Transfer") as t:
    return grid.transfer(trans)


###############################  Graphics Components ###############

#TODO: Verify that this is the right way to do affine transforms of shapes...at least as far as zoom/pan
class AffineTransform:
  m = None
  def __init__(self, tx, ty, sx, sy):
    self.sx=sx
    self.sy=sy
    self.tx=tx
    self.ty=ty

  def trans(self, x, y):
    """Transform a passed point."""
    x = self.sx * x + self.tx
    y = self.sy * y + self.ty
    return (x, y)

  def transform(self, glyph):
    """Transform a passed glyph (somethign with x,y,w,h)"""
    (p1x,p1y) = self.trans(glyph.x, glyph.y)
    (p2x,p2y) = self.trans(glyph.x+glyph.width, glyph.y+glyph.height)
    w = p2x-p1x
    h = p2y-p1y
    return Glyph(p1x, p1y, w, h, glyph.props)

  def inverse(self):
    return AffineTransform(-self.tx, -self.ty, 1/self.sx, 1/self.sy)

class Color(list):
  def __init__(self,r,g,b,a):
    list.__init__(self,[r,g,b,a])
    self.r=r
    self.g=g
    self.b=b
    self.a=a

class Glyph(list):
  def __init__(self,x,y,w,h,*props):
    fl = [x,y,w,h]
    fl.extend(props)
    list.__init__(self,fl)
    self.x=x
    self.y=y
    self.width=w
    self.height=h
    self.props=props

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
  glyphs = Glyphset()
  
  for i in range(0, skip):
    source.readline()

  for line in source:
    line = re.split("\s*,\s*", line)
    x = float(line[xc].strip())
    y = float(line[yc].strip())
    v = line[vc].strip()
    g = Glyph(x,y,width,height,v)
    glyphs.append(g)

  source.close()
  return glyphs

def main():
  ##Abstract rendering function implementation modules (for demo purposes only)
  import rle
  import infos
  import counts

  source = sys.argv[1]
  skip = int(sys.argv[2])
  xc = int(sys.argv[3])
  yc = int(sys.argv[4])
  vc = int(sys.argv[5])
  size = float(sys.argv[6])
  glyphs = load_csv(source,skip,xc,yc,vc,size,size)

  screen=(20,20)
  ivt = zoom_fit(screen,bounds(glyphs))

  image = render(glyphs, 
                 counts.Count(), 
                 counts.Segment(Color(0,0,0,0), Color(255,255,255,255), .5),
                 screen, 
                 ivt)

  print image


if __name__ == "__main__":
    main()
