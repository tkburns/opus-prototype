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
  OpusError: class extends Error {},

  kind: (x) => {
    if (typeof x === 'boolean') {
      return 'boolean';
    } else if (typeof x === 'number') {
      return 'number';
    } else if (typeof x === 'string') {
      return 'text';
    } else if (typeof x === 'symbol') {
      return 'atom';
    } else if (typeof x === 'object') {
      if (x == null) {
        throw new __opus_internals__.OpusError('encountered unsupported value: null');
      }

      return x.__opus_kind__;
    } else if (typeof x === 'function') {
      return 'function';
    } else {
      throw new __opus_internals__.OpusError(`encountered unsupported js type: ${typeof x}`);
    }
  },

  // uses deep comparison (ie recursively compares members on complex types)
  equals: (a, b) => {
    if (
      typeof a !== typeof b ||
      __opus_internals__.kind(a) !== __opus_internals__.kind(b)
    ) {
      return false;
    }


    if (__opus_internals__.kind(a) === 'tuple') {
      return a.length === b.length && a.every((aElement, index) =>
        __opus_internals__.equals(aElement, b[index])
      );
    } else {
      return a === b;
    }
  },

  /*
    pattern matchers
  */
  match: {
    // don't need to use equals(); all particles can be compared by ===
    particle: (subject, target) => subject === target,
    name: (subject, target) => __opus_internals__.equals(subject, target),
    tuple: (subject, members) => {
      if (__opus_internals__.kind(subject) !== 'tuple') {
        return false;
      }

      if (subject.size !== members.length) {
        return false;
      }

      return members.every(member => member() === true);
    },
  }
};

/*
  ---------------------------------
    end of opus runtime
  ---------------------------------
*/
