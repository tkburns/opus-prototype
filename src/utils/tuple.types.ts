export type Head<L extends unknown[]> =
  L extends [infer H, ...unknown[]] ? H :   // tuple with >= 1 element
	L extends [] ? never :                    // empty tuple
    L[number] | undefined;                  // list with unknown length (eg x[])

export type Tail<L extends unknown[]> =
  L extends [head: unknown, ...tail: infer T] ? T :   // tuple with >= 1 element
  L extends [] ? [] :                                 // empty tuple
    L;                                                // list with unknown length (eg x[])

export type Last<L extends unknown[]> =
  L extends Tail<L> ? (L[number] | undefined) :   // list of unknown length (not a tuple)
  L extends [] ? never :                          // empty tuple
  L extends [unknown] ? Head<L> :                 // 1-element tuple
    Last<Tail<L>>;                                // tuple with >= 2 elements


export type Prepend<L extends unknown[], T> = [T, ...L];
