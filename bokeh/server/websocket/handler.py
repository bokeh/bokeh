#-----------------------------------------------------------------------------
# Copyright (c) 2012 - 2015, Continuum Analytics, Inc. All rights reserved.
#
# Powered by the Bokeh Development Team.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------
from __future__ import absolute_import

import logging
log = logging.getLogger(__name__)

import uuid

from bokeh import protocol
from tornado import websocket

class WebSocketHandler(websocket.WebSocketHandler):

    @property
    def manager(self):
        return self.application.wsmanager

    #accept all domains for now.. maybe rethink this later?
    def check_origin(self, origin):
        return True

    def open(self):
        ## TODO - set client id to continuum client id
        self.clientid = str(uuid.uuid4())
        self.manager.add_socket(self, self.clientid)

    def on_close(self):
        self.manager.remove_socket(self.clientid)

    def on_message(self, message):
        msgobj = protocol.deserialize_json(message)
        msgtype = msgobj.get('msgtype')
        if msgtype == 'subscribe':
            auth = msgobj['auth']
            topic = msgobj['topic']
            if self.manager.auth(auth, topic):
                self.manager.subscribe(self.clientid, topic)
                msg = protocol.serialize_json(
                    protocol.status_obj(['subscribesuccess', topic, self.clientid])
                )
                self.write_message(topic + ":" + msg)
            else:
                msg = protocol.serialize_web(protocol.error_obj('unauthorized'))
                self.write_message(topic + ":" + msg)

