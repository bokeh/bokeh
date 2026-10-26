# Hosting

Start with [embed_without_a_framework](embed_without_a_framework/) to add a
surrounding page using ASGI routing alone. It imports the reusable
[Fourier studio](../applications/fourier_studio/) and mounts it at `/bkapp`.
Its README gives the launch command.

[authenticate_users](authenticate_users/) shows a bearer-header policy with a
separate `server:app` host. Follow its credential and gateway instructions
before starting it. An ordinary browser tab does not supply bearer headers.
