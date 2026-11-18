''' Manage spectrogram resources with Bokeh server lifecycle hooks.

.. bokeh-example-metadata::
    :title: App hooks
    :keywords: app hooks, bokeh server, app
'''

from threading import Thread

from . import audio


def on_server_loaded(server_context):
    t = Thread(target=audio.update_audio_data, args=())
    t.setDaemon(True)
    t.start()
