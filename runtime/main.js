/*
  ---------------------------------
    opus runtime
  ---------------------------------
*/

/* eslint-disable no-unused-vars */
/*
  disabling no-unused-vars since this file will be injected into
  the output, so the runtime functions are used without being exported
*/

// this is just for debugging now
// eventually logging will be handled through effects
// eslint-disable-next-line no-console
const print = (text) => console.log(text);

/*
  primitive operations used by match
*/

const runMatch = (principal, clauses) => {
  for (const [pattern, body] of clauses) {
    if (matchesPattern(pattern, principal)) {
      return body();
    }
  }
};

const matchesPattern = (pattern, value) => {
  if (pattern.type === 'value') {
    return pattern.value === value;
  } else if (pattern.type === 'wildcard') {
    return true;
  } else {
    // should never be hit -- the compiler should only produce valid pattern types
    throw new Error(`'${pattern.type}' is not a valid pattern type`);
  }
};

/*
  ---------------------------------
    end of opus runtime
  ---------------------------------
*/
