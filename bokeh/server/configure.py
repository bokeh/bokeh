from six.moves.queue import Queue

from .settings import settings as server_settings
from ..settings import settings as bokeh_settings
from .zmqpub import Publisher
from .app import bokeh_app
from .models import user

from .server_backends import (
    FunctionBackend, HDF5DataBackend, InMemoryServerModelStorage,
    MultiUserAuthentication, RedisServerModelStorage, ShelveServerModelStorage,
    SingleUserAuthentication,
)
from .serverbb import (
    InMemoryBackboneStorage, RedisBackboneStorage, ShelveBackboneStorage
)

REDIS_PORT = 6379
def configure_websocket():
    bokeh_app.publisher = Publisher(server_settings.pub_zmqaddr, Queue())

def configure_flask():
    # must import views before running apps
    from .views import deps
    # this just shuts up pyflakes
    deps
    backend = server_settings.model_backend
    if backend['type'] == 'redis':
        import redis
        rhost = backend.get('redis_host', '127.0.0.1')
        rport = backend.get('redis_port', REDIS_PORT)
        bbstorage = RedisBackboneStorage(redis.Redis(host=rhost, port=rport, db=2))
        servermodel_storage = RedisServerModelStorage(redis.Redis(host=rhost,
                                                                  port=rport, db=3))
    elif backend['type'] == 'memory':
        bbstorage = InMemoryBackboneStorage()
        servermodel_storage = InMemoryServerModelStorage()

    elif backend['type'] == 'shelve':
        bbstorage = ShelveBackboneStorage()
        servermodel_storage = ShelveServerModelStorage()

    if not server_settings.multi_user:
        authentication = SingleUserAuthentication()
    else:
        authentication = MultiUserAuthentication()

    if server_settings.data_directory:
        data_manager = HDF5DataBackend(server_settings.data_directory)
    else:
        data_manager = FunctionBackend()
    bokeh_app.url_prefix = server_settings.url_prefix
    bokeh_app.setup(
        backend,
        bbstorage,
        servermodel_storage,
        authentication,
        data_manager
    )

def make_default_user(bokeh_app):
    bokehuser = user.new_user(bokeh_app.servermodel_storage, "defaultuser",
                              str(uuid.uuid4()), apikey='nokey', docs=[])

    return bokehuser
