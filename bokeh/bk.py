
from tornado.httpserver import HTTPServer

from bokeh.application import Application
from bokeh.server.server import Server

def main():
    application = Application()
    # TODO we need to fill in Application with handlers,
    # using command line options or config files
    server = Server(application)
    server.start()

if __name__ == "__main__":
    import logging
    logging.basicConfig(level=logging.DEBUG)
    main()
