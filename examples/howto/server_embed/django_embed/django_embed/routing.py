from channels.routing import ProtocolTypeRouter, URLRouter
from django.apps import apps

bokeh_app_config = apps.get_app_config('bokeh.server.django')

application = ProtocolTypeRouter({
    'websocket': URLRouter(bokeh_app_config.routes.get_websocket_urlpatterns()),
    'http': URLRouter(bokeh_app_config.routes.get_http_urlpatterns()),
})
