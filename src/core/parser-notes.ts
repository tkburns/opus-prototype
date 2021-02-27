
/*

  5 options:
    1 - expicitly define return types
    2 - type one fn to break the chain
    3 - abstract away one call in the recursive chain and
          phantom type the returned value, then translate
          into actual return type after (similar to next option)
    4 - use placeholder returns types (or cast recursive callse)
          using phantom types (?) or some kind of tag
          and translate into actual AST after the fact
    5 - add a wrapper around all recursive rules that orchestrates
          recursive calls & gets around ts inferrence limitations?

*/


// doesn't infer types even if recursion is casted over
const f2 = (i: number) => {
  if (i > 0) {
    return 1 + (f2(i - 1) as number);
  } else {
    return 0;
  }
};



// use Z combinator -> add type param for the returned type
// cast return of bound rec to type param, map to actual type after

const r = <F extends (...args: any[]) => any>(f: (rec: F) => F) =>
  (...args: Parameters<F>) => {};









const f = (i: number) => {
  const arr = g(i);

  return {
    arr
  };
};

const g = (i: number) => {
  if (i <= 0 ) {
    return [];
  } else {
    return [f(i - 1)];
  }
};



const mapObject = <O extends {}, M extends (k: O[keyof O]) => any>(o: O, m: M) => {
  return Object.entries<O[keyof O]>(o)
    .map(([k, v]) => [k, m(v)])
    .reduce((o2, [k, mapped]) => Object.assign(o2, { [k]: mapped }), {});
};


const wrap = <M extends {}>(m: M) => {
  const bound = mapObject(m, () => {});
};



wrap({
  f: (x, i: number) => {
    const arr = x.g(i);

    return {
      arr
    };
  },

  g: (x, i: number) => {
    if (i <= 0 ) {
      return [];
    } else {
      return [x.f(i - 1)];
    }
  }
});
