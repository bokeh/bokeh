from .. import models
from werkzeug import generate_password_hash, check_password_hash

def new_user(client, username, password, docs=None):
    key = User.modelkey(username)
    with client.pipeline() as pipe:
        pipe.watch(key)
        pipe.multi()
        if client.exists(key):
            raise models.UnauthorizedException
        passhash = generate_password_hash(password, method='sha1')
        user = User(username, passhash, docs=docs)
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
    def __init__(self, username, passhash, docs=None):
        self.username = username
        self.passhash = passhash
        if docs is None:
            docs = []
        self.docs = docs
        
    def to_public_json(self):
        return {'username' : self.username,
                'docs' : self.docs}
        
    def to_json(self):
        return {'username' : self.username,
                'passhash' : self.passhash,
                'docs' : self.docs}
    
    @staticmethod
    def from_json(obj):
        return User(obj['username'], obj['passhash'], obj['docs'])
        
