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
  opus internals
*/
const __opus_internals__ = {
  /*
    pattern matchers
  */
  match: {
    value: (subject, target) => subject === target,
  }
};

/*
  ---------------------------------
    end of opus runtime
  ---------------------------------
*/
