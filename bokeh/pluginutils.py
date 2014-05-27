from bokeh.plotting import output_server, curdoc, push
import uuid
import logging
logger = logging.getLogger(__name__)

def app_document(prefix, url="default"):
    def decorator(func):
        def wrapper(*args, **kwargs):
            docname = prefix + str(uuid.uuid4())
            output_server(docname, url=url)
            curdoc().autoadd(False)
            app = func(*args, **kwargs)
            curdoc()._plotcontext.children = [app]
            curdoc().add_all()
            changed = push()
            logger.debug("stored: %s", str(changed))
            app.docname = docname
            return app
        return wrapper
    return decorator
        
