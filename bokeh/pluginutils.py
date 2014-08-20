from bokeh.plotting import output_server, curdoc, push
from bokeh.session import Session
import bokeh.embed as embed

import uuid
import logging
logger = logging.getLogger(__name__)

def app_document(prefix, url="default"):
    def decorator(func):
        def wrapper(*args, **kwargs):
            docname = prefix + str(uuid.uuid4())
            session = Session(name=url, root_url=url)
            session.use_doc(docname)
            session.load_document(curdoc())
            curdoc().autoadd(False)
            curdoc().autostore(False)

            obj = func(*args, **kwargs)
            tag = embed.autoload_server(obj, session)
            obj.tag = tag

            curdoc().add(obj)
            changed = session.store_document(curdoc())

            logger.debug("stored: %s", str(changed))

            return obj
        wrapper.__name__ = func.__name__
        return wrapper
    return decorator
