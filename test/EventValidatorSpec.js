import { validateEvent } from './../src/EventValidator';
import assert from 'assert';

describe('EventValidator', () => {
  it('should validate event field with error (no product.id)', () => {
    const event = {
      name: 'Viewed Product Detail',
      product: {
        name: 'Test'
      }
    };
    const result = validateEvent(event, [
      [ 'product.id', { required: true } ]
    ]);

    assert.deepEqual(result, [false,[['product.id', 'is required', undefined, 'ERR']]]);
  });

  it('should validate event field with error (no product)', () => {
    const event = {
      name: 'Viewed Product Detail'
    };
    const result = validateEvent(event, [
      [ 'product.id', { required: true } ]
    ]);

    assert.deepEqual(result, [false,[['product.id', 'is required', undefined, 'ERR']]]);
  });

  it('should validate event field with success', () => {
    const event = {
      name: 'Viewed Product Detail',
      product: {
        id: '123'
      }
    };
    const result = validateEvent(event, [
      [ 'product.id', { required: true } ]
    ]);

    assert.equal(result[0], true);
  });

  it('should validate event field with warning', () => {
    const event = {
      name: 'Viewed Product Detail'
    };
    const result = validateEvent(event, [
      [ 'product.id', { required: true }, { critical: false } ]
    ]);

    assert.deepEqual(result, [true, [['product.id', 'is required', undefined, 'WARN']]]);
  });

  it('should validate event array field with error (no lineItem)', () => {
    const event = {
      name: 'Viewed Product Listing',
    };
    const result = validateEvent(event, [
      [ 'listing.items[].product.id', { required: true } ]
    ]);

    assert.deepEqual(result, [false,[['listing.items[].product.id', 'is required', undefined, 'ERR']]]);
  });

  it('should validate event array field with warning (no lineItem)', () => {
    const event = {
      name: 'Viewed Product Listing',
    };
    const result = validateEvent(event, [
      [ 'listing.items[].product.id', { required: true }, { critical: false } ]
    ]);

    assert.deepEqual(result, [true, [['listing.items[].product.id', 'is required', undefined, 'WARN']]]);
  });
});
