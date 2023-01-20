# Basic setup

Install [rustup](https://rustup.rs/):

```bash
$ curl https://sh.rustup.rs -sSf | bash
```

Update the toolchain and set up `wasm` compilation targets:

```bash
$ rustup update
$ rustup target add wasm32-unknown-unknown wasm32-wasi
```

Alternatively you can use conda installed Rust toolchain.

# VSCode setup

Install [rust-analyzer](https://rust-analyzer.github.io/)'s VSCode
[extension](https://marketplace.visualstudio.com/items?itemName=rust-lang.rust-analyzer)
and the following to your workspace configuration:

```json
{
  "rust-analyzer.linkedProjects": [
    "${workspaceFolder}/bokehrs/Cargo.toml"
  ],
  "rust-analyzer.check.extraArgs": [
    "--all-targets",
    "--target-dir", "${workspaceFolder}/bokehrs/target/rust-analyzer"
  ]
}
```

Adding `--target-dir` is really important, because otherwise rust-analyzer
will be at odds with any `cargo` and related commands you run in a terminal,
resulting in an endless update and recompilation cycle.

# Development

To generate WASM and JS glue code, issue:
```bash
$ cd bokehrs
$ ./bindgen.sh
```

To test the project, issue:
```bash
$ cargo test --no-fail-fast
```
