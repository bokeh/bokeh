import bokeh.glyphs 
import re
import sys
import numpy as np


############################  Core System ####################
class GlyphSet(list):
    pass


class Grid(object):
    width = 2000
    height = 2000
    viewxform = None   # array [tx, ty, sx, sy]

    _glyphset = None
    _projected_grid = None
    _aggregates = None

    def __init__(self, w,h,viewxform):
      self.width=w
      self.height=h
      self.viewxform=viewxform

    def project(self, glyphset):
        """
        Parameters
        ==========
        glyphset: Numpy record array
            should be record array with at least the following named fields:
            x, y, width, height.

        Stores result in _projected_grid.
        Stores the passed glyphset in _glyphset
        """

        outgrid = np.empty((self.width, self.height), dtype=object)
        
        # transform each glyph and add it to the grid
        for i in xrange(0, len(glyphset)):
          g = glyphset[i]
          gt = self.viewxform.transform(g)
          for x in xrange(int(gt.x), int(round(gt.x+gt.width))):
            for y in xrange(int(gt.y), int(round(gt.y+gt.height))):
              ls = outgrid[x,y]
              if (ls == None): 
                ls = []
                outgrid[x,y]=ls
              ls.append(i)
        
        self._glyphset = glyphset
        self._projected_grid = outgrid
        #print self._projected_grid

    def aggregate(self, aggregator):
        """ 
        Returns ndarray of results of applying func to each element in 
        the grid.  Creates a new ndarray of the given dtype.

        Stores the results in _aggregates
        """
        outgrid = np.empty_like(self._projected_grid)
        outgrid.ravel()[:] = map(lambda ids: aggregator.aggregate(self._glyphset, ids), 
                                    self._projected_grid.flat)

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

  grid = Grid(screen[0], screen[1], ivt.inverse())
  grid.project(glyphs)
  grid.aggregate(aggregator)
  return grid.transfer(trans)


###############################  Graphics Components ###############

#TODO: Verify that this is the right way to do affine transforms of shapes...at least as far as zoom/pan
class AffineTransform:
  m = None
  def __init__(self, tx, ty, sx, sy):
    self.m = [[sx,0,tx],
              [0,sy,ty],
              [0,0,1]]

  def trans(self, x, y):
    """Transform a passed point."""
    x = self.m[0][0]*x + self.m[0][1]*y + self.m[0][2]
    y = self.m[1][0]*x + self.m[1][1]*y + self.m[1][2]
    return (x, y)

  def transform(self, r):
    """Transform a passed rectangle (somethign with x,y,w,h)"""
    (p1x,p1y) = self.trans(r.x, r.y)
    (p2x,p2y) = self.trans(r.x+r.width, r.y+r.height)
    w = p2x-p1x
    h = p2y-p1y
    return Pixel(p1x,p1y,w,h)

  def inverse(self):
    sx = self.m[0][0]
    sy = self.m[1][1]
    tx = self.m[0][2]
    ty = self.m[1][2]
    return AffineTransform(-tx,-ty,1/sx, 1/sy)

class Color:
  def __init__(self,r,g,b,a):
    self.r=r
    self.g=g
    self.b=b
    self.a=a

  def np(self):
    return [self.r,self.g,self.b,self.a]

  def __str__(self):
    return str([self.r,self.g,self.b,self.a])


class Pixel:
  def __init__(self,x,y,w,h):
    self.x=x
    self.y=y
    self.width=w
    self.height=h

  def __str__(self):
    return ",".join(map(str, [self.x,self.y,self.width,self.height]))

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

  image = render(glyphs, 
                 counts.Count(), 
                 counts.Segment(Color(0,0,0,0), Color(255,255,255,255), .5),
                 (20,20),
                 AffineTransform(-1,-1,.35,.35))

  print image


if __name__ == "__main__":
    main()
