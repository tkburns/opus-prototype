import fs from 'fs';
import { Module } from '&/utils/system/system';

const runtime = fs.readFileSync(require.resolve('&&/runtime/main.js'), 'utf-8');

export const injectRuntime: Module<string, string> = {
  run: (output) => {
    return runtime + '\n\n' + output;
  }
};
