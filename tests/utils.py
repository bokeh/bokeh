import colorama
colorama.init()


def write(*values, **kwargs):
    end = kwargs.get('end', '\n')
    print(*values, end=end)


def red(text):
    return "%s%s%s" % (colorama.Fore.RED, text, colorama.Style.RESET_ALL)


def yellow(text):
    return "%s%s%s" % (colorama.Fore.YELLOW, text, colorama.Style.RESET_ALL)


def blue(text):
    return "%s%s%s" % (colorama.Fore.BLUE, text, colorama.Style.RESET_ALL)


def green(text):
    return "%s%s%s" % (colorama.Fore.GREEN, text, colorama.Style.RESET_ALL)


def fail(msg=None):
    msg = " " + msg if msg is not None else ""
    write("%s%s" % (red("[FAIL]"), msg))


def warn(msg=None):
    msg = " " + msg if msg is not None else ""
    write("%s%s" % (yellow("[WARN]"), msg))


def info(msg=None):
    msg = " " + msg if msg is not None else ""
    write("%s%s" % ("[INFO]", msg))


def ok(msg=None):
    msg = " " + msg if msg is not None else ""
    write("%s%s" % (green("[OK]"), msg))
