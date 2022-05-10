import { a, tokenIterator } from './common';
import { createRDParser } from '../index';
import { lrec } from '../lrec';
import { precedented } from '../precedence';
import { TokenMismatch } from '../errors';

const tokens = (input) => {
  const chars = input.split('')
    .filter(c => c != ' ');

  return tokenIterator(chars);
};

const print = (node) => {
  if (node.type === 'start') {
    return node.children
      .map(print)
      .map(s => s[0] === '(' && s.slice(-1)[0] === ')'
        ? s.slice(1, -1)
        : s
      )
      .join('\n');
  } else if (node.type === 'op') {
    return `(${print(node.left)} ${node.op} ${print(node.right)})`;
  } else if (node.type === 'apply') {
    return `(${print(node.left)} ${print(node.right)})`;
  } else {
    return node.type;
  }
};

const run = (parser, ts) => {
  const input = ts.next && ts.source ? ts : tokens(ts);
  return print(parser.run(input));
};

const lassoc = p => [p, p+1];
const rassoc = p => [p+1, p];

const rules = {
  binary:  (op, ps) => rec => (handle, ctx, precedence) => {
    const [lp, rp] = ps(precedence);

    const left = rec(handle, ctx, lp);
    handle.consume(op);
    const right = rec(handle, ctx, rp);

    return { type: 'op', op, left, right };
  },

  apply: (ps = lassoc) => rec => (handle, ctx, precedence) => {
    const [lp, rp] = ps(precedence);

    const left = rec(handle, ctx, lp);
    const right = rec(handle, ctx, rp);

    return { type: 'apply', left, right };
  },

  parens: rec => (handle, context) => {
    handle.consume('(');
    const node = rec(handle, context, 0);
    handle.consume(')');

    return node;
  },

  pure: parser => rec => parser,
};

const createExpressionParser = (precedencedRules) => {
  const start = (handle, ctx) => {
    const node = expr(handle, ctx);

    handle.consumeEOI();

    return { type: 'start', children: [node] };
  };

  const expr = lrec(
    (_ctx, precedence = 0) => `prec=${precedence}`,
    (handle, ctx, precedence = 0) => {
      return precedented(handle, ctx, { precedence, rec: expr }, precedenceTable);
    }
  );

  const precedenceTable = precedencedRules.map(rules =>
    rules.map(rule => rule(expr))
  );

  return createRDParser(start);
};


const add = rules.binary('+', lassoc);
const sub = rules.binary('-', lassoc);

const mult = rules.binary('*', lassoc);
const div = rules.binary('/', lassoc);

const append = rules.binary(':', rassoc);
const app = rules.apply(lassoc);

const parser = createExpressionParser([
  [add, sub],
  [mult, div],
  [append],
  [app],
  [rules.parens, rules.pure(a)],
]);

it('respects precedence', () => {
  expect(run(parser, 'a + a * a : a (a + a * a : a a)'))
    .toEqual('a + (a * (a : (a (a + (a * (a : (a a)))))))');

  expect(run(parser, '(a a : a / a - a) a : a / a - a'))
    .toEqual('(((((((a a) : a) / a) - a) a) : a) / a) - a');

  expect(run(parser, 'a + a * a + a (a - a + a) / a'))
    .toEqual('(a + (a * a)) + ((a ((a - a) + a)) / a)');
});

it('emulates associativity with precedence', () => {
  expect(run(parser, 'a + a + a + a'))
    .toEqual('((a + a) + a) + a');

  expect(run(parser, 'a : a : a : a'))
    .toEqual('a : (a : (a : a))');
});

it('supports alternating associativity', () => {
  expect(run(parser, 'a + a - a : a : a + a - a'))
    .toEqual('(((a + a) - (a : (a : a))) + a) - a');

  expect(run(parser, 'a * a / a : a : a a a'))
    .toEqual('(a * a) / (a : (a : ((a a) a)))');
});

it('supports adjusting precedence on left recursion', () => {
  const allLower = p => [p+1, p+1];

  const one = rules.binary('1', allLower);
  const two = rules.binary('2', allLower);
  const three = rules.binary('3', allLower);

  const parser = createExpressionParser([
    [one],
    [two],
    [three],
    [rules.parens, rules.pure(a)],
  ]);

  expect(run(parser, 'a 1 a 3 (a 1 a) 2 a'))
    .toEqual('a 1 ((a 3 (a 1 a)) 2 a)');

  const ts1 = tokens('a 1 a 1 a');
  expect(() => run(parser, ts1))
    .toThrow(new TokenMismatch('EOI', ts1.tokens[3]));

  const ts2 = tokens('a 1 a 2 a 1 a');
  expect(() => run(parser, ts2))
    .toThrow(new TokenMismatch('EOI', ts2.tokens[5]));
});

describe('working with lrec', () => {
  it('works with lrec - caches based on precedence', () => {
    /* either side of wonkyAdd must be 'a' or parens */
    const wonkyAdd = rules.binary('+', p => [p + 2, p + 2]);

    const parser = createExpressionParser([
      [wonkyAdd],
      [app],
      [rules.parens, rules.pure(a)],
    ]);

    /*
      if lrec doesn't consider precedence in the cache, this will successfully
      parse as (a + a) a, even though wonkyAdd is higher precedence that app
    */
    const ts = tokens('a + a a');
    expect(() => run(parser, ts))
      .toThrow(new TokenMismatch('EOI', ts.tokens[3]));
  });

  it('works with lrec - properly descends through precedence levels', () => {
    const parser = createExpressionParser([
      [add, sub],
      [app],
      [rules.parens, rules.pure(a)],
    ]);

    /*
      if lrec doesn't use the correct cache key immediately when descending to
      the next precedence level, these will throw an error ([1:3] expected EOI).

      this is due to the greediness of lrec; if the cache key is still prec=0
      first time `app` is called, the recursive call with prec=1 will eat up
      both the first and second `a` and then the initial `app` will fail,
      as the next available token is `+`.
    */
    expect(run(parser, 'a a + a'))
      .toEqual('(a a) + a');

    expect(run(parser, 'a a + a a + a'))
      .toEqual('((a a) + (a a)) + a');
  });
});
