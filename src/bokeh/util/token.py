#-----------------------------------------------------------------------------
# Copyright (c) 2012 - 2022, Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------
''' Utilities for generating and manipulating session IDs.

A session ID would typically be associated with each browser tab viewing
an application or plot. Each session has its own state separate from any
other sessions hosted by the server.

'''

#-----------------------------------------------------------------------------
# Boilerplate
#-----------------------------------------------------------------------------
from __future__ import annotations

import logging # isort:skip
log = logging.getLogger(__name__)

#-----------------------------------------------------------------------------
# Imports
#-----------------------------------------------------------------------------

# Standard library imports
import base64
import calendar
import codecs
import datetime as dt
import hashlib
import hmac
import json
import time
import zlib
from typing import TYPE_CHECKING, Any, Dict

# Bokeh imports
from ..core.types import ID
from ..settings import settings

if TYPE_CHECKING:
    from typing_extensions import TypeAlias

#-----------------------------------------------------------------------------
# Globals and constants
#-----------------------------------------------------------------------------

__all__ = (
    'check_session_id_signature',
    'check_token_signature',
    'generate_secret_key',
    'generate_jwt_token',
    'generate_session_id',
    'get_session_id',
    'get_token_payload',
)

_TOKEN_ZLIB_KEY = "__bk__zlib_"

#-----------------------------------------------------------------------------
# General API
#-----------------------------------------------------------------------------

TokenPayload: TypeAlias = Dict[str, Any]

def generate_secret_key() -> str:
    ''' Generate a new securely-generated secret key appropriate for SHA-256
    HMAC signatures.

    This key could be used to sign Bokeh server session IDs, for example.
    '''
    return _get_random_string()

def generate_session_id(secret_key: bytes | None = settings.secret_key_bytes(),
                        signed: bool = settings.sign_sessions()) -> ID:
    ''' Generate a random session ID.

    Typically, each browser tab connected to a Bokeh application has its own
    session ID. In production deployments of a Bokeh app, session IDs should be
    random and unguessable - otherwise users of the app could interfere with one
    another.
    '''
    session_id = _get_random_string()
    if signed:
        session_id = '.'.join([session_id, _signature(session_id, secret_key)])
    return ID(session_id)

def generate_jwt_token(session_id: ID,
                       secret_key: bytes | None = settings.secret_key_bytes(),
                       signed: bool = settings.sign_sessions(),
                       extra_payload: TokenPayload | None = None,
                       expiration: int = 300) -> str:
    """ Generates a JWT token given a session_id and additional payload.

    Args:
        session_id (str):
            The session id to add to the token

        secret_key (str, optional) :
            Secret key (default: value of BOKEH_SECRET_KEY environment variable)

        signed (bool, optional) :
            Whether to sign the session ID (default: value of BOKEH_SIGN_SESSIONS
            environment variable)

        extra_payload (dict, optional) :
            Extra key/value pairs to include in the Bokeh session token

        expiration (int, optional) :
            Expiration time

    Returns:
        str
    """
    now = calendar.timegm(dt.datetime.utcnow().utctimetuple())
    payload = {'session_id': session_id, 'session_expiry': now + expiration}
    if extra_payload:
        if "session_id" in extra_payload:
            raise RuntimeError("extra_payload for session tokens may not contain 'session_id'")
        extra_payload_str = json.dumps(extra_payload, cls=_BytesEncoder).encode('utf-8')
        compressed = zlib.compress(extra_payload_str, level=9)
        payload[_TOKEN_ZLIB_KEY] = _base64_encode(compressed)
    token = _base64_encode(json.dumps(payload))
    secret_key = _ensure_bytes(secret_key)
    if not signed:
        return token
    return token + '.' + _signature(token, secret_key)

def get_session_id(token: str) -> ID:
    """Extracts the session id from a JWT token.

    Args:
        token (str):
            A JWT token containing the session_id and other data.

    Returns:
       str
    """
    decoded = json.loads(_base64_decode(token.split('.')[0]))
    return decoded['session_id']

def get_token_payload(token: str) -> TokenPayload:
    """Extract the payload from the token.

    Args:
        token (str):
            A JWT token containing the session_id and other data.

    Returns:
        dict
    """
    decoded = json.loads(_base64_decode(token.split('.')[0]))
    if _TOKEN_ZLIB_KEY in decoded:
        decompressed = zlib.decompress(_base64_decode(decoded[_TOKEN_ZLIB_KEY]))
        del decoded[_TOKEN_ZLIB_KEY]
        decoded.update(json.loads(decompressed, cls=_BytesDecoder))
    del decoded['session_id']
    return decoded

def check_token_signature(token: str,
                          secret_key: bytes | None = settings.secret_key_bytes(),
                          signed: bool = settings.sign_sessions()) -> bool:
    """Check the signature of a token and the contained signature.

    The server uses this function to check whether a token and the
    contained session id was generated with the correct secret key.
    If signed sessions are disabled, this function always returns True.

    Args:
        token (str) :
            The token to check

        secret_key (str, optional) :
            Secret key (default: value of BOKEH_SECRET_KEY environment variable)

        signed (bool, optional) :
            Whether to check anything (default: value of BOKEH_SIGN_SESSIONS
            environment variable)

    Returns:
        bool

    """
    secret_key = _ensure_bytes(secret_key)
    if signed:
        token_pieces = token.split('.', 1)
        if len(token_pieces) != 2:
            return False
        base_token = token_pieces[0]
        provided_token_signature = token_pieces[1]
        expected_token_signature = _signature(base_token, secret_key)
        # hmac.compare_digest() uses a string compare algorithm that doesn't
        # short-circuit so we don't allow timing analysis
        token_valid = hmac.compare_digest(
            expected_token_signature, provided_token_signature
        )
        session_id = get_session_id(token)
        session_id_valid = check_session_id_signature(session_id, secret_key, signed)
        return token_valid and session_id_valid
    return True

def check_session_id_signature(session_id: str,
                               secret_key: bytes | None = settings.secret_key_bytes(),
                               signed: bool | None = settings.sign_sessions()) -> bool:
    """Check the signature of a session ID, returning True if it's valid.

    The server uses this function to check whether a session ID was generated
    with the correct secret key. If signed sessions are disabled, this function
    always returns True.
    """
    secret_key = _ensure_bytes(secret_key)
    if signed:
        id_pieces = session_id.split('.', 1)
        if len(id_pieces) != 2:
            return False
        provided_id_signature = id_pieces[1]
        expected_id_signature = _signature(id_pieces[0], secret_key)
        return hmac.compare_digest(
            expected_id_signature, provided_id_signature
        )
    return True

#-----------------------------------------------------------------------------
# Dev API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Private API
#-----------------------------------------------------------------------------

class _BytesEncoder(json.JSONEncoder):
    def default(self, o: Any) -> Any:
        if isinstance(o, bytes):
            return dict(bytes=_base64_encode(o))
        return super().default(o)

class _BytesDecoder(json.JSONDecoder):
    def __init__(self, *args: Any, **kwargs: Any) -> None:
        super().__init__(object_hook=self.bytes_object_hook, *args, **kwargs)

    def bytes_object_hook(self, obj: dict[Any, Any]) -> Any:
        if set(obj.keys()) == {"bytes"}:
            return _base64_decode(obj["bytes"])
        return obj

def _get_sysrandom() -> tuple[Any, bool]:
    # Use the system PRNG for session id generation (if possible)
    # NOTE: secure random string generation implementation is adapted
    #       from the Django project. Reference:
    #       https://github.com/django/django/blob/0ed7d155635da9f79d4dd67e4889087d3673c6da/django/utils/crypto.py
    import random
    try:
        sysrandom = random.SystemRandom()
        using_sysrandom = True
        return sysrandom, using_sysrandom
    except NotImplementedError:
        import warnings
        warnings.warn('A secure pseudo-random number generator is not available '
                      'on your system. Falling back to Mersenne Twister.')
        if settings.secret_key() is None:
            warnings.warn('A secure pseudo-random number generator is not available '
                          'and no BOKEH_SECRET_KEY has been set. Setting a secret '
                          'key will mitigate the lack of a secure generator.')
        using_sysrandom = False
        return random, using_sysrandom

def _ensure_bytes(secret_key: str | bytes | None) -> bytes | None:
    if secret_key is None:
        return None
    elif isinstance(secret_key, bytes):
        return secret_key
    else:
        return codecs.encode(secret_key, 'utf-8')

# this is broken out for unit testability
def _reseed_if_needed(using_sysrandom: bool, secret_key: bytes | None) -> None:
    secret_key = _ensure_bytes(secret_key)
    if not using_sysrandom:
        # This is ugly, and a hack, but it makes things better than
        # the alternative of predictability. This re-seeds the PRNG
        # using a value that is hard for an attacker to predict, every
        # time a random string is required. This may change the
        # properties of the chosen random sequence slightly, but this
        # is better than absolute predictability.
        data = f"{random.getstate()}{time.time()}{secret_key!s}".encode('utf-8')
        random.seed(hashlib.sha256(data).digest())


def _base64_encode(decoded: bytes | str) -> str:
    # base64 encode both takes and returns bytes, we want to work with strings.
    # If 'decoded' isn't bytes already, assume it's utf-8
    decoded_as_bytes = _ensure_bytes(decoded)
    # TODO: urlsafe_b64encode only accepts bytes input, not bytes | None.
    # Perhaps we can change _ensure_bytes change return type from bytes | None to bytes
    encoded = codecs.decode(base64.urlsafe_b64encode(decoded_as_bytes), 'ascii')  # type: ignore
    # remove padding '=' chars that cause trouble
    return str(encoded.rstrip('='))


def _base64_decode(encoded: bytes | str) -> bytes:
    # base64 lib both takes and returns bytes, we want to work with strings
    encoded_as_bytes = codecs.encode(encoded, 'ascii') if isinstance(encoded, str) else encoded
    # put the padding back
    mod = len(encoded_as_bytes) % 4
    if mod != 0:
        encoded_as_bytes = encoded_as_bytes + (b"=" * (4 - mod))
    assert (len(encoded_as_bytes) % 4) == 0
    return base64.urlsafe_b64decode(encoded_as_bytes)

def _signature(base_id: str, secret_key: bytes | None) -> str:
    secret_key = _ensure_bytes(secret_key)
    base_id_encoded = codecs.encode(base_id, "utf-8")
    assert secret_key is not None
    signer = hmac.new(secret_key, base_id_encoded, hashlib.sha256)
    return _base64_encode(signer.digest())

def _get_random_string(
        length: int = 44,
        allowed_chars: str = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789',
        secret_key: bytes | None = settings.secret_key_bytes()) -> str:
    """ Return a securely generated random string.

    With the a-z, A-Z, 0-9 character set:
    Length 12 is a 71-bit value. log_2((26+26+10)^12) =~ 71
    Length 44 is a 261-bit value. log_2((26+26+10)^44) = 261

    """
    secret_key = _ensure_bytes(secret_key)
    _reseed_if_needed(using_sysrandom, secret_key)
    return ''.join(random.choice(allowed_chars) for _ in range(length))

#-----------------------------------------------------------------------------
# Code
#-----------------------------------------------------------------------------

random, using_sysrandom = _get_sysrandom()
