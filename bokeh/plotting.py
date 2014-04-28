
from functools import wraps
import logging

from session import DEFAULT_SERVER_URL, Session
from . import _glyph_functions
from .document import Document

logger = logging.getLogger(__name__)

_default_document = Document()

_default_session = None

def document():
    ''' Return the current document.

    Returns:
        doc : the current default document object.
    '''
    try:
        from flask import request
        doc = request.bokeh_server_document
        logger.debug("returning config from flask request")
        return doc
    except (ImportError, RuntimeError, AttributeError):
        logger.debug("returning global config from bokeh.plotting")
        return _default_document

def session():
    ''' Return the current session.

    Returns:
        session : the current default session object (or None)
    '''
    return _default_session

def hold(value=True):
    ''' Set or clear the plot hold status on the current document.

    This is a convenience function that acts on the current document, and is equivalent to document().hold(...)

    Args:
        value (bool, optional) : whether hold should be turned on or off (default: True)

    Returns:
        None
    '''
    document = document()
    if not isinstance(document, Document):
        # TODO (bev) exception or log?
        pass
    document.hold(value)

def figure(**kwargs):
    ''' Activate a new figure for plotting.

    All subsequent plotting operations will affect the new figure.

    This function accepts all plot style keyword parameters.

    Returns:
        None

    '''
    document = document()
    if not isinstance(document, Document):
        # TODO (bev) exception or log?
        pass
    document.figure(**kwargs)

def curplot():
    ''' Return the current default plot object.

    Returns:
        plot : the current plot (or None)
    '''
    document = document()
    if not isinstance(document, Document):
        # TODO (bev) log?
        return None
    return document.curplot()

def output_server(docname, session=None, url="default", name=None, **kwargs):
    """ Cause plotting commands to automatically persist plots to a Bokeh server.

    Can use explicitly provided Session for persistence, or the default
    session.

    Args:
        docname (str) : name of document to store on Bokeh server
            An existing documents with the same name will be overwritten.
        session (Session, optional) : An explicit session to use (default: None)
            If session is None, use the default session
        url (str, optianal) : URL of the Bokeh server  (default: "default")
            if url is "default" use session.DEFAULT_SERVER_URL
        name (str, optional) :
            if name is None, use the server URL as the name

    Additional keyword arguments like **username**, **userapikey**,
    and **base_url** can also be supplied.

    Returns:
        None

    .. note:: Generally, this should be called at the beginning of an
    interactive session or the top of a script.

    """
    global _default_session
    if url == "default":
        url = DEFAULT_SERVER_URL
    if name is None:
        name = url
    if not session:
        if not _default_session:
            _default_session = Session(name=name, root_url=url)
        session = _default_session
    session.use_doc(docname)
    session.pull_document(document())

def _document_wrap(func):
    @wraps(func)
    def wrapper(*args, **kwargs):
        retval = func(document(), *args, **kwargs)
        if session():
            session().push_dirty(document())
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

