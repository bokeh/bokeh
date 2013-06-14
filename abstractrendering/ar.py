import bokeh.glyphs 
import re
import sys
import numpy as np
from math import ceil, floor 

from numba import autojit

from timer import Timer


############################  Core System ####################
class Glyphset(list):
  def asarray(self):
    return np.array(self)

def _project(viewxform, glyphset):
  tx,ty,sx,sy = viewxform
  outglyphs = np.empty(glyphset.shape, dtype=np.int32)

  # transform each glyph and add it to the grid
  for i in xrange(0, len(glyphset)):
    #apply the view transform
    #(x,y,w,h,v) = glyphset[i]
    x = glyphset[i,0]
    y = glyphset[i,1]
    w = glyphset[i,2]
    h = glyphset[i,3]
    v = glyphset[i,4]
    x2 = x + w
    y2 = y + h
    x = floor(sx * x + tx)
    y = floor(sy * y + ty)
    x2 = floor(sx * x2 + tx)
    y2 = floor(sy * y2 + ty)
    outglyphs[i:i+5] = [x,y,x2,y2,v]

  return outglyphs

def _store(projected, outgrid):
  for i in xrange(0, len(projected)):
    x = projected[i,0]
    y = projected[i,1]
    x2 = projected[i,2]
    y2 = projected[i,3]
    for xx in xrange(x, x2):
      for yy in xrange(y, y2):
        ls = outgrid[xx,yy]
        if (ls == None): 
          ls = []
        ls.append(i)
        outgrid[xx,yy]=ls
  return outgrid
   

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
      self.numba_store = autojit()(_store)

    def project(self, glyphset):
      """
      Parameters
      ==========
      glyphset: Numpy record array
      should be record array with at least the following named fields:
        x, y, width, height.
      Stores result in _projected.
      Stores the passed glyphset in _glyphset
      """
      self._glyphset = glyphset
      projected = self.numba_project(self.viewxform, glyphset.asarray())
      #projected = _project(self.viewxform.asarray(), glyphset.asarray())
      
      outgrid = np.ndarray((self.width, self.height), dtype=object)
      #self._projected = self.numba_store(projected, outgrid)
      self._projected = _store(projected, outgrid)

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
class AffineTransform(list):
  def __init__(self, tx, ty, sx, sy):
    list.__init__(self, [tx,ty,sx,sy])
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

  def asarray(self): return np.array(self)

  def inverse(self):
    return AffineTransform(-self.tx, -self.ty, 1/self.sx, 1/self.sy)

class Color(list):
  def __init__(self,r,g,b,a):
    list.__init__(self,[r,g,b,a])
    self.r=r
    self.g=g
    self.b=b
    self.a=a

  def asarray(self): return np.array(self)

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

  def asarray(self): return np.array(self)


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
    v = float(line[vc].strip())
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
