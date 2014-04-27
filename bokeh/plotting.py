
from functools import wraps

from . import _glyph_functions
from .document import Document


_default_document = Document()

def document():
    return _default_document

def hold(value=True):
    document = document()
    if not isinstance(document, Document):
        # TODO (bev) exception or log?
        pass
    document.hold(value)

def figure(**kwargs):
    document = document()
    if not isinstance(document, Document):
        # TODO (bev) exception or log?
        pass
    document.figure(**kwargs)

def curplot():
    document = document()
    if not isinstance(document, Document):
        # TODO (bev) log?
        return None
    return document.curplot()

def _document_wrap(func):
    @wraps(func)
    def wrapper(*args, **kwargs):
        return func(document(), *args, **kwargs)
    wrapper.__doc__ += "\nThis is a convenience function that acts on the current document, and is equivalent to document().%s(...)" % func.__name__
    return wrapper


annular_wedge     = _document_wrap(_glyph_functions.annular_wedge)
annulus           = _document_wrap(_glyph_functions.annulus)
arc               = _document_wrap(_glyph_functions.arc)
asterisk          = _document_wrap(_glyph_functions.asterisk)
bezier            = _document_wrap(_glyph_functions.bezier)
circle            = _document_wrap(_glyph_functions.circle)
circle_cross      = _document_wrap(_glyph_functions.circle_cross)
circle_x          = _document_wrap(_glyph_functions.circle_x)
cross             = _document_wrap(_glyph_functions.cross)
diamond           = _document_wrap(_glyph_functions.diamond)
diamond_cross     = _document_wrap(_glyph_functions.diamond_cross)
image             = _document_wrap(_glyph_functions.image)
image_rgba        = _document_wrap(_glyph_functions.image_rgba)
inverted_triangle = _document_wrap(_glyph_functions.inverted_triangle)
line              = _document_wrap(_glyph_functions.line)
multi_line        = _document_wrap(_glyph_functions.multi_line)
oval              = _document_wrap(_glyph_functions.oval)
patch             = _document_wrap(_glyph_functions.patch)
patches           = _document_wrap(_glyph_functions.patches)
quad              = _document_wrap(_glyph_functions.quad)
quadratic         = _document_wrap(_glyph_functions.quadratic)
ray               = _document_wrap(_glyph_functions.ray)
rect              = _document_wrap(_glyph_functions.rect)
segment           = _document_wrap(_glyph_functions.segment)
square            = _document_wrap(_glyph_functions.square)
square_cross      = _document_wrap(_glyph_functions.square_cross)
square_x          = _document_wrap(_glyph_functions.square_x)
text              = _document_wrap(_glyph_functions.text)
triangle          = _document_wrap(_glyph_functions.triangle)
wedge             = _document_wrap(_glyph_functions.wedge)
x                 = _document_wrap(_glyph_functions.x)

