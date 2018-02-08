import assert from 'assert';

describe('Polyfill', () => {
  it('Object.values() works in all browsers', () => {
    const object = {
      0: 'String 1',
      1: 'String 2',
    };
    assert.deepEqual(Object.values(object), ['String 1', 'String 2']);
  });
});
