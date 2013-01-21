from bokeh.server import start
start.prepare_app()
start.prepare_local()

if __name__ == "__main__":
    start.start_app(verbose=True)

