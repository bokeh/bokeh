

from .session import session


_default_session = Session()


def session():
    return _default_session

def hold(value=True):
    session = session()
    if not isinstance(session, Session):
        # TODO (bev) exception or log?
        pass
    session.hold(value)

def figure(**kwargs):
    session = session()
    if not isinstance(session, Session):
        # TODO (bev) exception or log?
        pass
    session.figure(**kwargs)

def curplot():
    session = session()
    if not isinstance(session, Session):
        # TODO (bev) log?
        return None
    return session.curplot()