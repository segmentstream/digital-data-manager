import { validateEvent, ERROR_TYPE_NOTICE } from './../src/EventValidator';
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

    assert.deepEqual(result.errors, [['product.id', 'is required']]);
  });

  it('should validate event field with error (no product)', () => {
    const event = {
      name: 'Viewed Product Detail'
    };
    const result = validateEvent(event, [
      [ 'product.id', { required: true } ]
    ]);

    assert.deepEqual(result.errors, [['product.id', 'is required']]);
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

    assert.equal(result.errors.length, 0);
  });

  it('should validate event field with warning', () => {
    const event = {
      name: 'Viewed Product Detail'
    };
    const result = validateEvent(event, [
      [ 'product.id', { required: true }, ERROR_TYPE_NOTICE ]
    ]);

    assert.equal(result.errors.length, 0);
    assert.deepEqual(result.warnings, [['product.id', 'is required']]);
  });

  it.only('should validate event array field with error (no lineItem)', () => {
    const event = {
      name: 'Viewed Product Listing',
    };
    const result = validateEvent(event, [
      [ 'listing.items[].product.id', { required: true } ]
    ]);

    assert.deepEqual(result.errors, [['listing.items[].product.id', 'is required']]);
  });
});
