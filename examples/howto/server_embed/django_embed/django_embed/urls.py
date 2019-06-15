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
from django.contrib import admin
from django.urls import path
from django.apps import apps

from . import views

bokeh_app_config = apps.get_app_config('bokeh.server.django')

urlpatterns = [
    path("admin/", admin.site.urls),
    path("sea_surface1", views.sea_surface),
]

bokeh_app_config.applications = {
    "sea_surface1": views.sea_surface_handler1,
    "sea_surface2": views.sea_surface_handler2,
}

from django.contrib.staticfiles.urls import staticfiles_urlpatterns
urlpatterns += staticfiles_urlpatterns()
