
from functools import wraps

from . import _glyph_functions
from .session import Session


_default_session = Session()

def session():
    return _default_session

def hold(value=True):
    session = session()
    if not isinstance(session, Session):
        # TODO (bev) exception or log?
        pass
    session.hold(value)

def figure(**kwargs):
    session = session()
    if not isinstance(session, Session):
        # TODO (bev) exception or log?
        pass
    session.figure(**kwargs)

def curplot():
    session = session()
    if not isinstance(session, Session):
        # TODO (bev) log?
        return None
    return session.curplot()

def _session_wrap(func):
    @wraps(func)
    def wrapper(*args, **kwargs):
        return func(session(), *args, **kwargs)
    wrapper.__doc__ += "\nThis is a convenience function that acts on the current session, and is equivalent to session().%s(...)" % func.__name__
    return wrapper


annular_wedge     = _session_wrap(_glyph_functions.annular_wedge)
annulus           = _session_wrap(_glyph_functions.annulus)
arc               = _session_wrap(_glyph_functions.arc)
asterisk          = _session_wrap(_glyph_functions.asterisk)
bezier            = _session_wrap(_glyph_functions.bezier)
circle            = _session_wrap(_glyph_functions.circle)
circle_cross      = _session_wrap(_glyph_functions.circle_cross)
circle_x          = _session_wrap(_glyph_functions.circle_x)
cross             = _session_wrap(_glyph_functions.cross)
diamond           = _session_wrap(_glyph_functions.diamond)
diamond_cross     = _session_wrap(_glyph_functions.diamond_cross)
image             = _session_wrap(_glyph_functions.image)
image_rgba        = _session_wrap(_glyph_functions.image_rgba)
inverted_triangle = _session_wrap(_glyph_functions.inverted_triangle)
line              = _session_wrap(_glyph_functions.line)
multi_line        = _session_wrap(_glyph_functions.multi_line)
oval              = _session_wrap(_glyph_functions.oval)
patch             = _session_wrap(_glyph_functions.patch)
patches           = _session_wrap(_glyph_functions.patches)
quad              = _session_wrap(_glyph_functions.quad)
quadratic         = _session_wrap(_glyph_functions.quadratic)
ray               = _session_wrap(_glyph_functions.ray)
rect              = _session_wrap(_glyph_functions.rect)
segment           = _session_wrap(_glyph_functions.segment)
square            = _session_wrap(_glyph_functions.square)
square_cross      = _session_wrap(_glyph_functions.square_cross)
square_x          = _session_wrap(_glyph_functions.square_x)
text              = _session_wrap(_glyph_functions.text)
triangle          = _session_wrap(_glyph_functions.triangle)
wedge             = _session_wrap(_glyph_functions.wedge)
x                 = _session_wrap(_glyph_functions.x)

