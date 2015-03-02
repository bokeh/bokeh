.. _devguide_server:

Bokeh Server Architecture
=========================

Data Model
----------
The Bokeh Server has 2 models.  A User, and a Document.  A User controls authentication information at the user level, there is a username and a password hash which can be used for authentication (if the multi user auth backend is being used), as well as an apikey which can be used to authenticate python clients as the user.  Users also contain lists of documents.  The list of documents is only there so that we can easily figure out which documents a user has created.  When the bokeh server is started in single user mode, a ``defaultuser`` is automatically created, and all requests are automatically authenticated as that user.

A Document is the primary unit of access control for the bokeh server.  Each document has 2 lists of users, ``rw_users``, a list of users that can read and write to the document, as well as ``r_users``, a list of users that can only read from a document.  With the introduction of the copy on write facilities, a ``published``field is also introduced, which means that everyone can view the document in a copy on write context.  In the future, the ``r_users`` field may be removed, with the addition of copy_on_write, this notion of read only access might no longer be necessary.  The Document class here is implemented in ``bokeh.server.models.docs``, and is different than the Document implemented in ``bokeh.document``.  The former is only used by the server for authentication, the latter is used by both bokeh users and the bokeh server to deal with instances of bokeh ``PlotObject``.

The Bokeh Server stores json data for backbone models inside in memory, shelve based, or redis data stores.  Each document has it's own key, ``doc:some_random_document_id``, where we store a set of all models that belong to this document.  Each model is stored
with a key of ``bbmodel:type:some_random_document_id:some_random_object_id``.

Copy on Write
-------------
Bokeh has a global model for it's backbone objects.  Multiple web clients can visit the same document and they will see the exact same backbone object.  You can see this if you
open two browser tabs to the same bokeh plot, and you select some data points.  The selection should propagate to both tabs.  This behavior is not desirable when one wishes to publish plots.

Bokeh has implemented a copy on write notion on top of documents.  Every document (if published)  can be viewed in a public mode.  In which case the javascript client will open up the document in public mode, and choose a unique ``temporary_docid`` for use in viewing plots.  These temporary documents are not full fledged bokeh documents - there is no serverside ``Document`` object backing this.  Instead what we do is, on loading a document, we first load models from the original document id, and then we load additional models from the ``temporary_docid``.  On saves, we save data only into the ``temporary_docid``.  Temporary docids need to be prefixed with ``temporary-``, this is a bit hacky, but this tells Bokeh that we don't implement any authentiation controls over the temporary context

In the future, it may be worthwhile to implement full ACL systems around published documents, as well as the temporary context

Anonymous Users
---------------
This is only really relevant for the multiuser case.  If no user is authenticated, the current_user function of the authentication backend will return ``None``.  In the future it may be worthwhile to replace this with a full fledged ``AnonymousUser`` object but at present this is not implemented.

The impact of this is generally negligible - The only impact is with bokeh server applets which currently create a new document per page view.  In the future, we may migrate this to take advantage of the copy on write facilities, however right now we create a brand new document.

Bokeh creates new documents for bokeh applets.  These documents are orphaned - that is, they don't belong to any Bokeh users list of documents.  We will replace this mechanism with the copy on write functionality in the future
