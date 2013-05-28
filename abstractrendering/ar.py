import bokeh.glyphs 

import re
import sys


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

class Pixel:
  x=None
  y=None
  w=None
  h=None
  def __init__(self,x,y):
    self.x=x
    self.y=y
    self.w=1
    self.h=1


#TODO: Pay attention to the view transform
def aggregate(glyphs, selector, reducer, width, height, vt):
  aggs = Aggregates(width, height)
  for x in range(0, width):
    for y in range(0, height):
      px = Pixel(x,y)
      gs = selector(px, glyphs)
      v = reducer(gs)
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


def render(glyphs, selector, reducer, trans, w,h,vt):
  aggs = aggregate(glyphs, selector, reducer, w,h,vt)
  image = transfer(aggs, trans)
  return image


############################  Support functions ####################

def count(x):
  if type(x) is list: 
    return len(x) 
  if type(x) is None: 
    return 0
  return 1



def halves(low, high):
  def gen(aggs):
    (min,max) = minmax(aggs)
    def f(v):
      if (v >= ((max-min)/2.0)):
          return high
      return low
    return f
  return gen

def minmax(aggs):
  return (min(aggs.values), max(aggs.values))


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
  image = render(glyphs, containing, count, halves("w","r"), 5,5, None)
  print image


if __name__ == "__main__":
    main()
