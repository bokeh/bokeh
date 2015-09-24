
from tornado.httpserver import HTTPServer

from bokeh.application import Application
from bokeh.server.server import Server

def main():
    # TODO we need to fill in Application with handlers,
    # using command line options or config files
    application = Application()
    # TODO allow specifiying multiple applications with routes to each
    applications = { '/' : application }
    server = Server(applications)
    server.start()

if __name__ == "__main__":
    import logging
    logging.basicConfig(level=logging.DEBUG)
    main()
