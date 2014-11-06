import logging

class Settings(object):
    ip = "0.0.0.0"
    port = 5006
    url_prefix = ""
    data_directory = None
    multi_user = False
    # make scripts for now - for now cli will only
    # pass one script
    scripts = []
    model_backend = {'type' : 'shelve'}
    # model_backend = {'type' : redis, 'redis_port' : 7001, 'start-redis' : True}
    # model_backend = {'type' : memory}
    # model_backend = {'type' : shelve}
    filter_logs = False
    ws_conn_string = "ws://localhost:5006/bokeh/sub"
    ws_conn_string = "ws://localhost:5006/bokeh/sub"
    pub_zmqaddr = "ipc:///tmp/bokeh_in"
    sub_zmqaddr = "ipc:///tmp/bokeh_out"

    def process_settings(self, bokeh_app):
        if self.url_prefix:
            if not self.url_prefix.startswith("/"):
                self.url_prefix = "/" + self.url_prefix
            if self.url_prefix.endswith("/"):
                self.url_prefix = self.url_prefix[:-1]
        for handler in logging.getLogger().handlers:
            handler.addFilter(StaticFilter())

class StaticFilter(logging.Filter):
    def filter(self, record):
        msg = record.getMessage()
        return not (msg.startswith(("GET /static", "GET /bokehjs/static")) and \
                    any(status in msg for status in ["200 OK", "304 NOT MODIFIED"]))

settings = Settings()
del Settings
