import { flattenIndentation, code } from '../stringification';

describe('flattenIndentation', () => {
  it('flattens indentation', () => {
    expect(flattenIndentation(`
      {
        foo
      }
    `)).toEqual(
      '\n' +
      '{\n' +
      '  foo\n' +
      '}\n'
    );

    expect(flattenIndentation(`
      foo:
        bar:
          baz
    `)).toEqual(
      '\n' +
      'foo:\n' +
      '  bar:\n' +
      '    baz\n'
    );

    expect(flattenIndentation(`
      foo
    bar
      baz
    `)).toEqual(
      '\n' +
      '  foo\n' +
      'bar\n' +
      '  baz\n'
    );
  });
});

describe('code template processor', () => {
  it('flattens indentation & trims leading/trailing lines', () => {
    expect(code`
      foo
    `).toEqual('foo');

    expect(code`
      {
        foo
      }
    `).toEqual(
      '{\n' +
      '  foo\n' +
      '}'
    );
  });

  it('indents inserted strings', () => {
    expect(code`
      {
        ${'(\n  foo,\n  bar,\n)'}
      }
    `).toEqual(
      '{\n' +
      '  (\n' +
      '    foo,\n' +
      '    bar,\n' +
      '  )\n' +
      '}'
    );
  });

  it('inserts arrays of strings (and indents them)', () => {
    expect(code`
      {
        ${['(', '  foo,', '  bar,', ')']}
      }
    `).toEqual(
      '{\n' +
      '  (\n' +
      '    foo,\n' +
      '    bar,\n' +
      '  )\n' +
      '}'
    );

    /*
      arrays are essentially joined with newlines &
      treated the same as a string interpolation
    */
    expect(code`
      {
        ${['foo:\n  bar', 'blah\nbaz']}
      }
    `).toEqual(
      '{\n' +
      '  foo:\n' +
      '    bar\n' +
      '  blah\n' +
      '  baz\n' +
      '}'
    );
  });

  it('indents with interpolations', () => {
    const cond = 'x === true';
    const body = 'f(y)';

    const s = code`
      if (${cond}) {
        return ${body};
      }
    `;

    expect(s).toEqual(
      `if (${cond}) {\n` +
      `  return ${body};\n` +
      '}'
    );
  });
});
