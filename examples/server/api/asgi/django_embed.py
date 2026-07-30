import os
from pathlib import Path

from django.conf import settings
from django.core.asgi import get_asgi_application
from django.http import HttpRequest, HttpResponse
from django.urls import path
from jinja2 import Environment, FileSystemLoader

from bokeh.embed import server_document
from bokeh.server.asgi import BokehASGI

template = Environment(loader=FileSystemLoader(Path(__file__).parent), autoescape=True).get_template("index.html")


def render_page(root_path: str = "") -> str:
    mount_url = f"{root_path.rstrip('/')}/bkapp"
    bokeh_script = server_document(mount_url, relative_urls=True)
    return template.render(framework="Django", bokeh_script=bokeh_script)


async def index(request: HttpRequest) -> HttpResponse:
    return HttpResponse(render_page(request.META.get("SCRIPT_NAME", "")))


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
bokeh_application = BokehASGI({"/": Path(__file__).with_name("bkapp.py")})


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
