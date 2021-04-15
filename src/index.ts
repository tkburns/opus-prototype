import './utils/setup-aliases';

import minimist from 'minimist';
import fs from 'fs';
import path from 'path';
import { core } from './core';

const version = '0.0.0-development';
const help =
`Opus Complier (prototype)

Usage:
  opus [flags] source-file

Options:
 --help       [-h]  prints the usage information
 --version    [-v]  prints the version
`;


const args = process.argv.slice(2);

type Flags = {
  help: boolean;
  version: boolean;
};
const flagOptions = {
  alias: {
    help: 'h',
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
    const fileStr = fs.readFileSync(path.resolve(file), 'utf-8');

    const result = core.run(fileStr);

    process.stdout.write(result + '\n');
  } catch (e: unknown) {
    if (!(e instanceof Error)) {
      throw e;
    }

    process.stderr.write(`compilation for '${file}' failed\n\n`);
    process.stderr.write(`[Error] ${e.name}: ${e.message}\n`);
    process.exit(1);
  }
}
