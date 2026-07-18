import os

from django.conf import settings
from django.core.asgi import get_asgi_application
from django.http import HttpResponse
from django.urls import path

from bokeh.server.asgi import BokehASGI

from bkapp import application as bkapp


async def index(request):
    return HttpResponse(
        '<h1>Django ASGI with Bokeh</h1><iframe src="/bkapp/" width="100%" height="450"></iframe>',
    )


urlpatterns = [path("", index)]

if not settings.configured:
    settings.configure(
        DEBUG=True,
        ROOT_URLCONF=__name__,
        SECRET_KEY="development-only",
        ALLOWED_HOSTS=["localhost", "127.0.0.1"],
    )

os.environ.setdefault("DJANGO_SETTINGS_MODULE", __name__)
django_application = get_asgi_application()
bokeh_application = BokehASGI({"/": bkapp})


async def application(scope, receive, send):
    path_info = scope.get("path", "")
    if scope["type"] == "lifespan":
        # Django does not consume ASGI lifespan events, so Bokeh owns them.
        await bokeh_application(scope, receive, send)
    elif scope["type"] in ("http", "websocket") and (
        path_info == "/bkapp" or path_info.startswith("/bkapp/")
    ):
        mounted_scope = dict(scope)
        mounted_scope["root_path"] = scope.get("root_path", "") + "/bkapp"
        await bokeh_application(mounted_scope, receive, send)
    else:
        await django_application(scope, receive, send)
