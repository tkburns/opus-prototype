import { core } from '../core';
import { Input } from '../utils/system/input';

jest.mock('&/core/runtime', () => {
  const mockRuntime = '\n/* runtime goes here */\n';

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

block = (
  "ignored";
  alsoIgnored = "foo";
  "returned"
);

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

(1, 2) match (
  (1, _) => "1";
  (_, 2) => "2";
);

boolean match (
  true => (
    ret = "true";
    ret
  );
  false => (
    ret = "false";
    ret
  );
);

(* ------------------- *)
(* thunks *)

one = { 1 };

two = { 1; 2; };

oneAndTwo = {
  id = x => x;
  apply = f => x => f x;
  apply id (1, 2);
};

delay = x => { x };

(!(delay 1), !{ 2 }, !(delay !{ 3 }));

(* nested thunks *)
tdelay = { delay };
!tdelay 1;
!(!tdelay 1);

(* double thunk *)
doubleDelay = x => y => { { (x, y) } };
!!(doubleDelay 1 2);

(* inline forcing as fn args *)
pair = x => y => (x, y);
pair !one !two;

apply = f => x => f x;
!(apply !tdelay 1);

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
x => x match (_ => f) (b);

x => a match (_ => y => b) (z => c) (d, f x);
`);

describe('smoke test (snapshot)', () => {
  it('matches snapshot', () => {
    expect(core().run(source)).toMatchSnapshot();
  });
});
