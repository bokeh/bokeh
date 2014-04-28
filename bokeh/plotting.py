
from functools import wraps

from . import _glyph_functions
from .document import Document
from session import Session
import logging
logger = logging.getLogger(__name__)
_default_document = Document()
DEFAULT_SERVER_URL = "http://localhost:5006/"
_use_session = False
def document():
    try:
        from flask import request
        doc = request.bokeh_server_document
        logger.debug("returning config from flask request")
        return doc
    except (ImportError, RuntimeError, AttributeError):
        logger.debug("returning global config from bokeh.plotting")
        return _default_document
        
_default_session = Session()
def session():
    return _default_session

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
        retval = func(document(), *args, **kwargs)
        if _use_session:
            s = session()
            s.push_dirty(document())
        return retval
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

def output_server(docname, session=None, name=None, url="default", **kwargs):
    """ Sets the output mode to upload to a Bokeh plot server.

    Default bokeh server address is defined in DEFAULT_SERVER_URL.  Docname is
    the name of the document to store in the plot server.  If there is an
    existing document with this name, it will be overwritten.

    Additional keyword arguments like **username**, **userapikey**,
    and **base_url** can be supplied.
    Generally, this should be called at the beginning of an interactive session
    or the top of a script.

    if session is provided, use session
    otherwise use name
    finally fallback on url
    """
    global _default_session
    global _use_session
    if url == "default":
        real_url = DEFAULT_SERVER_URL
    else:
        real_url = url
    if name is None:
        name = real_url
    if not session:
        _default_session = Session(name=name, root_url=real_url)
    _use_session = True
    _default_session.use_doc(docname)
    _default_session.pull_document(document())


