# NOTE: Execute patch_all() before everything else, especially before
# importing threading module. Otherwise, annoying KeyError exception
# will be thrown. gevent is optional, so don't fail if not installed.
try:
    import gevent.monkey
except ImportError:
    pass
else:
    gevent.monkey.patch_all()
