import redis
from bokeh.server.models.user import User
from bokeh.server.models.docs import Doc, prune_and_get_valid_models
from bokeh.server import serverbb
import json
import copy


server_model_redis = redis.Redis(host="127.0.0.1", db=3)
bbmodel_redis = redis.Redis(host="127.0.0.1", db=2)
for userkey in server_model_redis.keys("model:user*"):
    userid = userkey.split(":")[-1]
    User.load(server_model_redis, userkey)

for dockey in server_model_redis.keys("model:doc*"):
    docid = dockey.split(":")[-1]
    doc = Doc.load(server_model_redis, docid)
    
for modelkey in bbmodel_redis.keys():
    if len(modelkey.split(":")) == 3:
        _, typename, modelid = modelkey.split(":")
        data = json.loads(bbmodel_redis.get(modelkey))
        docid = data['docs'][0]
        newkey = serverbb.modelkey(typename, docid, modelid)
        bbmodel_redis.set(newkey, json.dumps(data))
        bbmodel_redis.delete(modelkey)

for dockey in bbmodel_redis.keys("doc:*"):
    docid = dockey.split(":")[-1]
    members = bbmodel_redis.smembers(dockey)
    new_members = []
    for key in members:
        if len(key.split(":") ) == 3:
            _, typename, modelid = key.split(":")
            newkey = serverbb.modelkey(typename, docid, modelid)
            new_members.append(newkey)
        else:
            new_members.append(key)
    bbmodel_redis.srem(dockey, *members)
    bbmodel_redis.sadd(dockey, *new_members)
    
collections = serverbb.ContinuumModelsStorage(
    bbmodel_redis
    )

for dockey in bbmodel_redis.keys("doc:*"):
    docid = dockey.split(":")[-1]
    models = prune_and_get_valid_models(server_model_redis,
                                        collections,
                                        docid,
                                        delete=True)
    for m in models:
        collections.add(m)


    
    
    

    
        
    







