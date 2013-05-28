
def const(v):
  def f(glyph):
    return v
  return f



def attribute(att, default):
  def f(glyph):
    try :
      return getattr(glyph, att)
    except:
      return default
  return f 
