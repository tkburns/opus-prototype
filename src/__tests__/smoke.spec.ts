import { core } from '../core';
import { Input } from '../utils/system/input';
import fs from 'fs';

jest.mock('&/core/runtime', () => {
  const mockRuntime = `
/* runtime goes here */
  `;

  return {
    __esModule: true,
    injectRuntime: {
      run: (output: string) => {
        return mockRuntime + '\n\n' + output;
      }
    }
  };
});


const source = Input.fromString('raw', `
(* comment *)
boolean = true;
number = 12;
atom = :hello;
text = "hello world";

tuple = (atom, text);

(* functions *)
pair = a => b => (a, b);
pair (pair 1 2) (pair 3 4);

(* inline function *)
(a => b => (b, a)) 1 2;

(* pattern match *)
message = name => name match (
  :hello => "hello world";
  :bye => "bye everyone";
  _ => "other";
);

(* ------------------- *)
(* precedence *)

a = :a; b = :b; c = :c; d = :d;
f = x => x; g = x => x;

x => x match (_ => x);
x => f x;

f g a;
f (g a);

(x => a, y => b);
(a match (_ => a), f a);

f b match (_ => a);

x => a match (_ => y => b) (z => c) (d, f x);
`);

describe('smoke test (snapshot)', () => {
  it('matches snapshot', () => {
    fs.readFileSync(require.resolve('&&/runtime/main'), 'utf-8');
    expect(core().run(source)).toMatchSnapshot();
  });
});
