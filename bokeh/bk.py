
from tornado.httpserver import HTTPServer

from bokeh.server.app import BokehServer

def main():
    application = BokehServer()
    server = HTTPServer(application)
    server.bind(8888)
    server.start(2)
    application.start()

if __name__ == "__main__":
    import logging
    logging.basicConfig(level=logging.INFO)
    main()