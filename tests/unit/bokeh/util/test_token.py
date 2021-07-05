#-----------------------------------------------------------------------------
# Copyright (c) 2012 - 2021, Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Boilerplate
#-----------------------------------------------------------------------------
from __future__ import annotations # isort:skip

import pytest ; pytest

#-----------------------------------------------------------------------------
# Imports
#-----------------------------------------------------------------------------

# Standard library imports
import calendar
import codecs
import datetime as dt
import json
import os
import random

# External imports
from mock import MagicMock, Mock, patch

# Bokeh imports
from bokeh.util.token import (
    _base64_decode,
    _base64_encode,
    _get_sysrandom,
    _reseed_if_needed,
    _signature,
    check_token_signature,
    generate_jwt_token,
    generate_secret_key,
    generate_session_id,
    get_session_id,
    get_token_payload,
)

# Module under test
import bokeh.util.token # isort:skip

#-----------------------------------------------------------------------------
# Setup
#-----------------------------------------------------------------------------

def _nie():
    def func():
        raise NotImplementedError()
    return func

_MERSENNE_MSG = 'A secure pseudo-random number generator is not available on your system. Falling back to Mersenne Twister.'

#-----------------------------------------------------------------------------
# General API
#-----------------------------------------------------------------------------

class TestSessionId:
    def test_base64_roundtrip(self) -> None:
        for s in [ "", "a", "ab", "abc", "abcd", "abcde", "abcdef", "abcdefg",
                   "abcdefgh", "abcdefghi",
                   "abcdefghijklmnopqrstuvwxyz" ]:
            assert s == _base64_decode(_base64_encode(s), encoding='utf-8')

    def test_reseed_if_needed(self) -> None:
        # we have to set a seed in order to be able to get state
        random.seed(codecs.encode("abcdefg", "utf-8"))
        state = random.getstate()
        _reseed_if_needed(using_sysrandom=True, secret_key=None)
        # did NOT reseed
        assert state == random.getstate()
        # monkeypatch
        saved = bokeh.util.token.random
        try:
            bokeh.util.token.random = random
            _reseed_if_needed(using_sysrandom=False, secret_key="abc")
            # DID reseed
            assert state != random.getstate()
        finally:
            bokeh.util.token.random = saved

    def test_signature(self) -> None:
        sig = _signature("xyz", secret_key="abc")
        with_same_key = _signature("xyz", secret_key="abc")
        assert sig == with_same_key
        with_different_key = _signature("xyz", secret_key="qrs")
        assert sig != with_different_key

    def test_generate_unsigned(self) -> None:
        token = generate_jwt_token(generate_session_id(), signed=False)
        assert '.' not in token
        assert 123 == len(token)
        assert "session_id" in json.loads(_base64_decode(token, encoding='utf-8'))

        another_token = generate_jwt_token(generate_session_id(), signed=False)
        assert '.' not in another_token
        assert 123 == len(another_token)
        assert "session_id" in json.loads(_base64_decode(another_token, encoding='utf-8'))
        assert token != another_token

    def test_payload_unsigned(self):
        token = generate_jwt_token(generate_session_id(), signed=False, extra_payload=dict(foo=10))
        assert '.' not in token
        payload = json.loads(_base64_decode(token, encoding='utf-8'))
        assert payload['foo'] == 10

    def test_payload_error_unsigned(self):
        session_id = generate_session_id()
        with pytest.raises(RuntimeError):
            generate_jwt_token(session_id, extra_payload=dict(session_id=10))

    def test_generate_signed(self) -> None:
        session_id = generate_session_id(signed=True, secret_key="abc")
        token = generate_jwt_token(session_id, signed=True, secret_key="abc")
        assert '.' in token
        decoded = json.loads(_base64_decode(token.split('.')[0], encoding='utf-8'))
        assert "session_id" in decoded
        assert decoded['session_id'] == session_id
        assert check_token_signature(token, secret_key="abc", signed=True)
        assert not check_token_signature(token, secret_key="qrs", signed=True)

    def test_payload_signed(self):
        session_id = generate_session_id(signed=True, secret_key="abc")
        token = generate_jwt_token(session_id, signed=True, secret_key="abc", extra_payload=dict(foo=10))
        assert '.' in token
        decoded = json.loads(_base64_decode(token.split('.')[0], encoding='utf-8'))
        assert 'session_id' in decoded
        session_id = get_session_id(token)
        assert check_token_signature(token, secret_key="abc", signed=True)
        assert not check_token_signature(token, secret_key="qrs", signed=True)
        assert decoded['foo'] == 10

    def test_payload_error(self):
        session_id = generate_session_id()
        with pytest.raises(RuntimeError):
            generate_jwt_token(session_id, extra_payload=dict(session_id=10))

    def test_check_signature_of_unsigned(self) -> None:
        # secret shouldn't be used
        token = generate_jwt_token(generate_session_id(), signed=False, secret_key="abc")
        assert not check_token_signature(token, secret_key="abc", signed=True)

    def test_check_signature_of_empty_string(self) -> None:
        assert not check_token_signature("", secret_key="abc", signed=True)

    def test_check_signature_of_junk_with_hyphen_in_it(self) -> None:
        assert not check_token_signature("foo-bar-baz", secret_key="abc", signed=True)

    def test_check_signature_with_signing_disabled(self) -> None:
        assert check_token_signature("gobbledygook", secret_key="abc", signed=False)

    def test_generate_secret_key(self) -> None:
        key = generate_secret_key()
        assert 44 == len(key)
        key2 = generate_secret_key()
        assert 44 == len(key2)
        assert key != key2

    def test_string_encoding_does_not_affect_session_id_check(self) -> None:
        # originates from #6653
        session_id = generate_session_id(signed=True, secret_key="abc")
        token = generate_jwt_token(session_id, signed=True, secret_key="abc")
        assert check_token_signature(token, secret_key="abc", signed=True)

    def test_jwt_token_uses_utc_time(self) -> None:
        # django server generates token using UTC timezone
        token = generate_jwt_token("foo", expiration=0)
        with patch.object(dt, "datetime", Mock(wraps=dt.datetime)) as patched_dt:
            # mock bokeh server localtime to be UTC + 10
            patched_dt.now.return_value = dt.datetime.utcnow() + dt.timedelta(hours=10)
            payload = get_token_payload(token)
        utcnow = calendar.timegm(dt.datetime.utcnow().utctimetuple())
        assert utcnow -1 <= payload['session_expiry'] <= utcnow + 1

#-----------------------------------------------------------------------------
# Dev API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Private API
#-----------------------------------------------------------------------------


class Test__get_sysrandom:
    def test_default(self) -> None:
        import random
        try:
            random.SystemRandom()
            expected = True
        except NotImplementedError:
            expected = False
        _random, using_sysrandom = _get_sysrandom()
        assert using_sysrandom == expected

    @patch('random.SystemRandom', new_callable=_nie)
    def test_missing_sysrandom_no_secret_key(self, _mock_sysrandom: MagicMock) -> None:
        with pytest.warns(UserWarning) as warns:
            random, using_sysrandom = _get_sysrandom()
            assert not using_sysrandom
            assert len(warns) == 2
            assert warns[0].message.args[0] == _MERSENNE_MSG
            assert warns[1].message.args[0] == (
                'A secure pseudo-random number generator is not available '
                'and no BOKEH_SECRET_KEY has been set. '
                'Setting a secret key will mitigate the lack of a secure '
                'generator.'
            )

    @patch('random.SystemRandom', new_callable=_nie)
    def test_missing_sysrandom_with_secret_key(self, _mock_sysrandom: MagicMock) -> None:
        os.environ["BOKEH_SECRET_KEY"] = "foo"
        with pytest.warns(UserWarning) as warns:
            random, using_sysrandom = _get_sysrandom()
            assert not using_sysrandom
            assert len(warns) == 1
            assert warns[0].message.args[0] == _MERSENNE_MSG
        del os.environ["BOKEH_SECRET_KEY"]

#-----------------------------------------------------------------------------
# Code
#-----------------------------------------------------------------------------
