# Opus

Opus is a functional language with [algebraic effects](https://overreacted.io/algebraic-effects-for-the-rest-of-us/).

It also features typical functional language features: static type system with type inference,
ADTs, and pattern matching, etc. Currently, Opus compiles to JS, though I have plans to
also support compiling to WASM.

Opus was primarily inspired by [Unison](https://www.unisonweb.org/),
[Eff](https://www.eff-lang.org/), [Effekt](https://effekt-lang.org/),
[Koka](https://koka-lang.github.io/koka/doc/index.html),
[Haskell](https://www.haskell.org/), [ML](https://en.wikipedia.org/wiki/ML_(programming_language)).

> :warning: **Note:** this is a just a hobby project that I work on
for fun. It is definitely a work in progress; it's not really useable yet, and
everything is subject to change. But if you are interested & brave enough, feel free to
clone the project and try things out!

## :book: Example

Sample program that prints the first 10 numbers using a generator:
```
yield = effect;

numsGenerator = current => (
  !(yield current);
  numsGenerator (current + 1)
);
nums = { numsGenerator 1 };

take = count => handler (
  initial k => (
    count match (
      0 => ();
      _ => !k;
    );
  );
  yield n k => (
    !(yield n);
    !k with take (count - 1)
  );
);

!nums
  with take 10
  with handler (
    yield n k => (
      !(print n);
      !k;
    ) 
  )
```

> :warning: **Note:** this example is not runnable quite yet, nor is it completely
representable of the final language syntax (eg it's missing type annotations)

## :clipboard: Current Status

This is very much a work in progress, and will definitely change over time. I've taken a
incremental & iterative approach; the compiler is currently runnable, but only supports a very
small subset of the planned features.

For a very quick overview of the current syntax, see [./examples/syntax.op](./examples/syntax.op).

The currently implemented features include (but aren't limited to):
 - standard primitives (eg boolean, numbers, text) and atoms (aka symbols)
 - tuples, 1st class functions
 - simple structural pattern matching

## :zap: Installing & Running

If you are interested enough to want to try Opus out, just clone this repo and use
the npm scripts to build and/or run it. All run scripts take the source file name
as a parameter (note you have to use `--` before any arguments due to
[how `npm run` works](https://docs.npmjs.com/cli/v8/commands/npm-run-script))

Here are some of the supported npm scripts (for a complete list see [here](./package.json#L6))
```
build             - build the compiler
build:watch       - build the compiler in watch mode

start             - runs the compiler (prints generated code to stdout)
start:pure        - runs the compiler without rebuilding

start:run         - runs the compiler & immediately runs the result (via nodejs)
start:example     - runs the compiler on one of the example files
(NOTE - the examples may contain syntax that is not yet implemented)
```

Usage of the actual compiler:
```
npm run start -- [options] [file | -]

passing - instead of a file reads from the stdin with one caveat:
the input must be piped in (eg using direct pipe, heredoc, file redirect, etc);
running on interactive/user input is not supported and will error.

Options:
-h / --help       prints the usage information
-v / --version    prints the version
-o / --output t   changes what stage of the compiler is output
                    [tokens, ast, aast, code, ...]
```

Example commands:
```sh
# compiles "./my-file.op"
npm run start -- ./my-file.op

# compiles using a heredoc as input
npm run start -- - <<EOI
  (* your code here *)
EOI

# compiles & immediately runs "./my-file.op"
npm run start:run -- ./my-file.op

# compiles "./examples/hello-world.op" and prints out the AST
npm run start:example -- hello-world --output ast
```
