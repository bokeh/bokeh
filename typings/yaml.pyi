from typing import IO, Any, Text, Union

class SafeLoader:
  pass

def load(stream: Union[bytes, IO[bytes], Text, IO[Text]], Loader: Any = ...) -> Any: ...

def safe_load(stream: Union[bytes, IO[bytes], Text, IO[Text]], Loader: Any = ...) -> Any: ...
