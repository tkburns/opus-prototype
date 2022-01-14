import './utils/setup-aliases';

import minimist from 'minimist';
import path from 'path';
import { core } from './core';
import { Input } from './utils/system/input';

const version = '0.0.0-development';
const help =
`Opus Complier (prototype)

Usage:
  opus [flags] source-file

Options:
 --help       [-h]  prints the usage information
 --version    [-v]  prints the version
 --output t   [-o]  the output type to print
                    possible values: tokens, all-tokens, ast, code
                    defaults to code
`;


const args = process.argv.slice(2);

type Flags = {
  help: boolean;
  version: boolean;
  output?: string;
};
const flagOptions = {
  alias: {
    help: 'h',
    output: 'o'
  },
  boolean: ['help', 'version']
};

const flags = minimist<Flags>(args, flagOptions);

if (flags.help || flags._.length !== 1) {
  process.stdout.write(help + '\n');
} else if (flags.version) {
  process.stdout.write(version + '\n');
} else {
  const [file] = flags._;

  try {
    let input: Input;
    if (file === '-') {
      input = Input.fromStdin();
    } else {
      input = Input.fromFile(path.resolve(file));
    }

    const result = core(flags.output).run(input);

    process.stdout.write(result + '\n');
  } catch (e: unknown) {
    if (!(e instanceof Error)) {
      throw e;
    }

    const filename = file === '-'
      ? '[stdin]' : file;
    process.stderr.write(`compilation for '${filename}' failed\n\n`);

    type HasCode = { code: string };
    const hasCode = (o: unknown): o is HasCode =>
      typeof o === 'object' && (o as Partial<HasCode>)?.code != null;

    if (hasCode(e) && e.code === 'EAGAIN') {
      process.stderr.write('[Error] unable to read from stdin\n');
      process.stderr.write('reading from stdin interactively is not currently supported;\n');
      process.stderr.write('instead pipe input in directly, from a file, using a heredoc, etc\n');
    } else {
      process.stderr.write(`[Error] ${e.name}: ${e.message}\n`);
    }

    process.exit(1);
  }
}
