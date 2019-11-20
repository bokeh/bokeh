# Standard library imports
from threading import Thread

# Bokeh imports
import audio


def on_server_loaded(server_context):
    t = Thread(target=audio.update_audio_data, args=())
    t.setDaemon(True)
    t.start()
