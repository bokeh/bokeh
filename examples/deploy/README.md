### Example production deployment of bokeh server.

Execute each of the following in separate shells

1.  `redis-server --port 7001`
2.  `gunicorn -k tornado -w 4 "bokeh.server.start:make_tornado(config_file='config.py')" --log-level=debug --log-file=- -b 0.0.0.0:5006`
3.  `python forwarder.py`

Unfortunately right now, becuase of how we're using threads in our tornado app, you can't just kill the gunicorn process with something like ctrl-c.  You have to kill -9 the gunicorn process.  I usually do that with the following (`pkill -f -9 gunicorn`)

#### TODO
- document wrapping with haproxy or nginx
- graceful way of shutting down gunicorn with tornado
- manage procs with supervisord instead of running them in shells
