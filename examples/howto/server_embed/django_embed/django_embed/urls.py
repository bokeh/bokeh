"""django_embed URL Configuration

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/2.2/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""
from pathlib import Path

from django.apps import apps
from django.conf import settings
from django.contrib import admin
from django.contrib.staticfiles.urls import staticfiles_urlpatterns
from django.urls import path

import bokeh
from bokeh.server.django import autoload, directory, document

from . import views

bokeh_app_config = apps.get_app_config('bokeh.server.django')

urlpatterns = [
    path("admin/", admin.site.urls),
    path("sea_surface/", views.sea_surface),
    path("my_sea_surface/", views.sea_surface_custom_uri),
]

base_path = settings.BASE_PATH

bokeh_apps = [
    autoload("sea_surface", views.sea_surface_handler),
    document("sea_surface_with_template", views.sea_surface_handler_with_template),
    document("bokeh_apps/sea_surface", base_path / "bokeh_apps" / "sea_surface.py"),
    document("shape_viewer", views.shape_viewer_handler),
]

apps_path = Path(bokeh.__file__).parent.parent / "examples" / "app"
bokeh_apps += directory(apps_path)

urlpatterns += staticfiles_urlpatterns()
