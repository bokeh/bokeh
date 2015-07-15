from __future__ import absolute_import

from bokeh.exceptions import DataIntegrityException, UnauthorizedException

class ServerModel(object):
    idfield = None
    typename = None

    @classmethod
    def modelkey(cls, objid):
        return "model:%s:%s"% (cls.typename, objid)

    def mykey(self):
        return self.modelkey(getattr(self, self.idfield))

    def to_json(self):
        raise NotImplementedError

    @staticmethod
    def from_json(obj):
        raise NotImplementedError

    def save(self, client):
        client.set(self.mykey(), self.to_json())

    def create(self, client):
        try:
            client.create(self.mykey(), self.to_json())
        except DataIntegrityException:
            raise UnauthorizedException(self.mykey())

    @classmethod
    def load_json(cls, client, objid):
        data = client.get(cls.modelkey(objid))
        if data is None:
            return None
        return data

    @classmethod
    def load(cls, client, objid):
        attrs = cls.load_json(client, objid)
        if attrs is None:
            return None
        return cls.from_json(attrs)
