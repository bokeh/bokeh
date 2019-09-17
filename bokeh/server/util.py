#-----------------------------------------------------------------------------
# Copyright (c) 2012 - 2019, Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------
''' Provide some utility functions useful for implementing different
components in ``bokeh.server``.

'''

#-----------------------------------------------------------------------------
# Boilerplate
#-----------------------------------------------------------------------------
from __future__ import absolute_import, division, print_function, unicode_literals

import logging
log = logging.getLogger(__name__)

#-----------------------------------------------------------------------------
# Imports
#-----------------------------------------------------------------------------

# Standard library imports

# External imports
from tornado import netutil

# Bokeh imports

#-----------------------------------------------------------------------------
# Globals and constants
#-----------------------------------------------------------------------------

__all__ = (
    'bind_sockets',
    'check_whitelist',
    'create_hosts_whitelist',
    'match_host',
)

#-----------------------------------------------------------------------------
# General API
#-----------------------------------------------------------------------------

def bind_sockets(address, port):
    ''' Bind a socket to a port on an address.

    Args:
        address (str) :
            An address to bind a port on, e.g. ``"localhost"``

        port (int) :
            A port number to bind.

            Pass 0 to have the OS automatically choose a free port.

    This function returns a 2-tuple with the new socket as the first element,
    and the port that was bound as the second. (Useful when passing 0 as a port
    number to bind any free port.)

    Returns:
        (socket, port)

    '''
    ss = netutil.bind_sockets(port=port or 0, address=address)
    assert len(ss)
    ports = {s.getsockname()[1] for s in ss}
    assert len(ports) == 1, "Multiple ports assigned??"
    actual_port = ports.pop()
    if port:
        assert actual_port == port
    return ss, actual_port

def check_whitelist(host, whitelist):
    ''' Check a given request host against a whitelist.

    Args:
        host (str) :
            A host string to compare against a whitelist.

            If the host does not specify a port, then ``":80"`` is implicitly
            assumed.

        whitelist (seq[str]) :
            A list of host patterns to match against

    Returns:
        ``True``, if ``host`` matches any pattern in ``whitelist``, otherwise
        ``False``

     '''
    if ':' not in host:
        host = host + ':80'

    if host in whitelist:
        return True

    return any(match_host(host, pattern) for pattern in whitelist)

def create_hosts_whitelist(host_list, port):
    '''

    This whitelist can be used to restrict websocket or other connections to
    only those explicitly originating from approved hosts.

    Args:
        host_list (seq[str]) :
            A list of string `<name>` or `<name>:<port>` values to add to the
            whitelist.

            If no port is specified in a host string, then ``":80"``  is
            implicitly assumed.

        port (int) :
            If ``host_list`` is empty or ``None``, then the whitelist will
            be the single item list `` [ 'localhost:<port>' ]``

            If ``host_list`` is not empty, this parameter has no effect.

    Returns:
        list[str]

    Raises:
        ValueError, if host or port values are invalid

    Note:
        If any host in ``host_list`` contains a wildcard ``*`` a warning will
        be logged regarding permissive websocket connections.

    '''
    if not host_list:
        return ['localhost:' + str(port)]

    hosts = []
    for host in host_list:
        if '*' in host:
            log.warning(
                "Host wildcard %r will allow connections originating "
                "from multiple (or possibly all) hostnames or IPs. Use non-wildcard "
                "values to restrict access explicitly", host)
        if host == '*':
            # do not append the :80 port suffix in that case: any port is
            # accepted
            hosts.append(host)
            continue
        parts = host.split(':')
        if len(parts) == 1:
            if parts[0] == "":
                raise ValueError("Empty host value")
            hosts.append(host+":80")
        elif len(parts) == 2:
            try:
                int(parts[1])
            except ValueError:
                raise ValueError("Invalid port in host value: %s" % host)
            if parts[0] == "":
                raise ValueError("Empty host value")
            hosts.append(host)
        else:
            raise ValueError("Invalid host value: %s" % host)
    return hosts

def match_host(host, pattern):
    ''' Match a host string against a pattern

    Args:
        host (str)
            A hostname to compare to the given pattern

        pattern (str)
            A string representing a hostname pattern, possibly including
            wildcards for ip address octets or ports.

    This function will return ``True`` if the hostname matches the pattern,
    including any wildcards. If the pattern contains a port, the host string
    must also contain a matching port.

    Returns:
        bool

    Examples:

        >>> match_host('192.168.0.1:80', '192.168.0.1:80')
        True
        >>> match_host('192.168.0.1:80', '192.168.0.1')
        True
        >>> match_host('192.168.0.1:80', '192.168.0.1:8080')
        False
        >>> match_host('192.168.0.1', '192.168.0.2')
        False
        >>> match_host('192.168.0.1', '192.168.*.*')
        True
        >>> match_host('alice', 'alice')
        True
        >>> match_host('alice:80', 'alice')
        True
        >>> match_host('alice', 'bob')
        False
        >>> match_host('foo.example.com', 'foo.example.com.net')
        False
        >>> match_host('alice', '*')
        True
        >>> match_host('alice', '*:*')
        True
        >>> match_host('alice:80', '*')
        True
        >>> match_host('alice:80', '*:80')
        True
        >>> match_host('alice:8080', '*:80')
        False

    '''
    if ':' in host:
        host, host_port = host.rsplit(':', 1)
    else:
        host_port = None

    if ':' in pattern:
        pattern, pattern_port = pattern.rsplit(':', 1)
        if pattern_port == '*':
            pattern_port = None
    else:
        pattern_port = None

    if pattern_port is not None and host_port != pattern_port:
        return False

    host = host.split('.')
    pattern = pattern.split('.')

    if len(pattern) > len(host):
        return False

    for h, p in zip(host, pattern):
        if h == p or p == '*':
            continue
        else:
            return False
    return True

#-----------------------------------------------------------------------------
# Dev API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Private API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Code
#-----------------------------------------------------------------------------
