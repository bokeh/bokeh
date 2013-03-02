from .. import models
from docs import Doc
import uuid
from werkzeug import generate_password_hash, check_password_hash

def new_user(client, username, password, apikey=None, docs=None):
    if apikey is None:
        apikey = str(uuid.uuid4())
    key = User.modelkey(username)
    with client.pipeline() as pipe:
        pipe.watch(key)
        pipe.multi()
        if client.exists(key):
            raise models.UnauthorizedException
        passhash = generate_password_hash(password, method='sha1')
        user = User(username, passhash, apikey, docs=docs)
        user.save(pipe)
        pipe.execute()
        return user

def auth_user(client, username, password):
    user = User.load(client, username)
    if user is None:
        raise models.UnauthorizedException        
    if check_password_hash(user.passhash, password):
        return user
    else:
        raise models.UnauthorizedException

class User(models.ServerModel):
    idfield = 'username'
    typename = 'user'
    #we're using username as the id for now...
    def __init__(self, username, passhash, apikey, docs=None):
        self.apikey = apikey
        self.username = username
        self.passhash = passhash
        if docs is None:
            docs = []
        self.docs = docs
        
    @classmethod
    def load(cls, client, objid):
        attrs = cls.load_json(client, objid)
        if attrs is None:
            return None
        changed = False
        if not attrs.get('apikey'):
            attrs['apikey'] = str(uuid.uuid4())
            changed = True
        docs = attrs.get('docs')
        newdocs = []
        for doc in docs:
            if isinstance(doc, basestring):
                doc = Doc.load(client, doc)
                newdocs.append({'title' : doc.title,
                                'docid' : doc.docid})
                changed = True
            else:
                newdocs.append(doc)
        attrs['docs'] = newdocs
        obj = cls.from_json(attrs)
        if changed:
            obj.save(client)
        return obj
        
    def to_public_json(self):
        return {'username' : self.username,
                'docs' : self.docs}
        
    def to_json(self):
        return {'username' : self.username,
                'passhash' : self.passhash,
                'apikey' : self.apikey,
                'docs' : self.docs,
                }
    
    @staticmethod
    def from_json(obj):
        return User(obj['username'],
                    obj['passhash'],
                    obj['apikey'],
                    obj['docs'],
                    )
        
