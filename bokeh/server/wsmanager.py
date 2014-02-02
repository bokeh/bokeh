import uuid
import atexit
import logging
from .. import  protocol
from flask import request

log = logging.getLogger(__name__)

class MultiDictionary(object):
    def __init__(self):
        self.dict = {}

    def add(self, k, v):
        self.dict.setdefault(k, set()).add(v)

    def remove_val(self, k, v):
        self.dict.setdefault(k, set()).remove(v)
        if len(self.dict[k]) == 0:
            self.remove(k)

    def remove(self, k):
        del self.dict[k]

    def get(self, *args):
        return self.dict.get(*args)

class WebSocketManager(object):
    def __init__(self):
        self.sockets = {}
        self.topic_clientid_map = MultiDictionary()
        self.clientid_topic_map = MultiDictionary()
        self.auth_functions = {}
        atexit.register(self._atexit)

    def _atexit(self):
        if len(self.sockets) != 0:
            log.warning("Not all websocket connections were closed properly")

    def remove_clientid(self, clientid):
        topics = self.clientid_topic_map.get(clientid, [])
        for topic in topics:
            self.topic_clientid_map.remove_val(topic, clientid)

    def remove_topic(self, topic):
        clientids = self.topic_clientid_map.get(topic)
        for clientid in clientids:
            self.clientid_topic_map.remove_val(clientid, topic)

    def subscribe_socket(self, socket, topic, clientid=None):
        if clientid is None :
            clientid = str(uuid.uuid4())
        self.subscribe(clientid, topic)
        self.add_socket(socket, clientid)

    def can_subscribe(self, clientid, topic):
        #auth goes here
        return True

    def register_auth(self, authtype, func):
        self.auth_functions[authtype] = func

    def auth(self, authtoken, topic):
        #authtoken - some string, whatever you want it to be
        #topic - string topic, of syntax type:value.
        #topic type maps to auth function
        authtype, topic = topic.split(":", 1)
        if self.auth_functions.get(authtype):
            return self.auth_functions[authtype](authtoken, topic)
        else:
            return True

    def subscribe(self, clientid, topic):
        if self.can_subscribe(clientid, topic):
            self.topic_clientid_map.add(topic, clientid)
            self.clientid_topic_map.add(clientid, topic)

    def add_socket(self, socket, clientid):
        self.sockets[clientid] = socket

    def remove_socket(self, clientid):
        del self.sockets[clientid]

    def send(self, topic, msg, exclude=None):
        if exclude is None:
            exclude = set()
        for clientid in tuple(self.topic_clientid_map.get(topic, [])):
            if clientid in exclude:
                continue
            socket = self.sockets[clientid]
            try:
                socket.send(topic + ":" + msg)
            except Exception as e: #what exception is this?if a client disconnects
                log.exception(e)
                self.remove_socket(clientid)
                self.remove_clientid(clientid)

def run_socket(socket, manager, clientid=None):
    clientid = clientid if clientid is not None else str(uuid.uuid4())

    log.debug("CLIENTID: %s" % clientid)
    manager.add_socket(socket, clientid)

    while True:
        msg = socket.receive()

        if msg is None:
            manager.remove_socket(clientid)
            manager.remove_clientid(clientid)
            break

        msgobj = protocol.deserialize_web(msg)
        msgtype = msgobj.get('msgtype')

        if msgtype == 'subscribe':
            auth = msgobj['auth']
            topic = msgobj['topic']

            if manager.auth(auth, topic):
                manager.subscribe(clientid, topic)
                msg = protocol.serialize_web(protocol.status_obj(['subscribesuccess', topic, clientid]))
                socket.send(topic + ":" + msg)
            else:
                msg = protocol.serialize_web(protcol.error_obj('unauthorized'))
                socket.send(topic + ":" + msg)
                break

def pub_from_redis(redisconn, wsmanager):
    ps = redisconn.pubsub()
    ps.psubscribe("*")
    for message in ps.listen():
        wsmanager.send(message['channel'], message['data'])
