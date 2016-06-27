from threading import Thread

import audio

def on_server_loaded(server_context):
    t = Thread(target=audio._get_audio_data, args=())
    t.setDaemon(True)
    t.start()
