from bokeh.plotting import output_server, session
import uuid
def app_document(prefix):
    def decorator(func):
        def wrapper(*args, **kwargs):
            docname = prefix + str(uuid.uuid4())
            output_server(docname)
            app = func(*args, **kwargs)
            session().add(app)
            session().plotcontext.children=[app]
            session().plotcontext._dirty = True
            print (session().store_all())
            app.docname = docname
            return app
        return wrapper
    return decorator
        
