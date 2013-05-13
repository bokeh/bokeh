import startlocal
from bokeh.server import start
start.app.debug = True
if __name__ == "__main__":
    import werkzeug.serving
    @werkzeug.serving.run_with_reloader
    def helper ():
        start.start_app(verbose=True)
