from bokeh.plotting import output_server, session
import uuid
import logging
logger = logging.getLogger(__name__)

def app_document(prefix, url="default"):
    def decorator(func):
        def wrapper(*args, **kwargs):
            docname = prefix + str(uuid.uuid4())
            output_server(docname, url=url)
            app = func(*args, **kwargs)
            session().add(app)
            session().plotcontext.children=[app]
            session().plotcontext._dirty = True
            logger.debug("stored: %s", str(session().store_all()))
            app.docname = docname
            return app
        return wrapper
    return decorator
        
