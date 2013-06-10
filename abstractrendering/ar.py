import bokeh.glyphs 
import re
import sys

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

  def __str__(self):
    chunks = map(str, [self.values[i:i+self.w] for i in xrange(0, len(self.values), self.w)])
    return "\n".join(chunks) 


def aggregate(glyphs, selector, info, reducer, width, height, ivt):
  aggs = Aggregates(width, height)
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


def render(glyphs, selector, info, reducer, trans, w,h,ivt):
  """
  Render a set of glyphs under the specified condition to the described canvas.
  glyphs ---- Glyphs t render
  selector -- Function used to select which glyphs apply to which pixel
  reducer --- Function to combine a set of glyphs into a single aggregate value
  trans ----- Function for converting aggregates to colors
  w,h  ------ width/height of the canvas
  ivt ------- INVERSE view transform (converts pixels to canvas space)
  """

  aggs = aggregate(glyphs, selector, info, reducer, w,h,ivt)
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


def main():
  source = open(sys.argv[1])
  skip = int(sys.argv[2])
  xc = int(sys.argv[3])
  yc = int(sys.argv[4])
  vc = int(sys.argv[5])

  glyphs = []

  for i in range(0, skip):
    source.readline()

  for line in source:
    line = re.split("\s*,\s*", line)
    x = float(line[xc].strip())
    y = float(line[yc].strip())
    v = line[vc].strip()

    glyphs.append(bokeh.glyphs.SquareX(x=x,y=y,width=1,height=1,fill="red"))

  source.close()
  #image = render(glyphs, containing, infos.const(1), counts.count, counts.segment("R",".",2), 20,20, AffineTransform(0,0,.25,.25))
  #image = render(glyphs, containing, infos.attribute("color",None), rle.RLE, rle.minPercent(.5,"A","B","."), 20,20, AffineTransform(0,0,.25,.25))
  image = render(glyphs, containing, infos.attribute("color",None), rle.COC, rle.minPercent(.5,"A","B","."), 20,20, AffineTransform(0,0,.25,.25))
  print image


if __name__ == "__main__":
    main()
