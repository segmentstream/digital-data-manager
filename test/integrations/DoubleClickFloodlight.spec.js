import assert from 'assert'
import sinon from 'sinon'
import noop from '@segmentstream/utils/noop'
import reset from './../reset'
import DoubleClickFloodlight from './../../src/integrations/DoubleClickFloodlight'
import ddManager from './../../src/ddManager'

describe('Integrations: DoubleClick Floodlight', () => {
  let doubleClick
  const options = {
    events: [
      {
        event: 'Custom Event',
        floodlightConfigID: '123',
        activityGroupTagString: 'GROUP1',
        activityTagString: 'TAG1',
        countingMethod: 'standard',
        customVars: {
          u1: {
            type: 'digitalData',
            value: 'user.userId'
          },
          u2: {
            type: 'event',
            value: 'label'
          }
        }
      },
      {
        event: 'Completed Transaction',
        floodlightConfigID: '123',
        activityGroupTagString: 'GROUP1',
        activityTagString: 'TAG2',
        countingMethod: 'transactions',
        customVars: {
          u1: {
            type: 'digitalData',
            value: 'user.userId'
          },
          u2: {
            type: 'event',
            value: 'label'
          }
        }
      },
      {
        event: 'Completed Transaction',
        floodlightConfigID: '124',
        activityGroupTagString: 'GROUP2',
        activityTagString: 'TAG3',
        countingMethod: 'transactions',
        customVars: {
          u1: {
            type: 'digitalData',
            value: 'user.userId'
          },
          u2: {
            type: 'event',
            value: 'label'
          }
        }
      }
    ]
  }

  beforeEach(() => {
    window.digitalData = {
      website: {},
      page: {},
      user: {
        userId: 'user123'
      },
      events: []
    }
    doubleClick = new DoubleClickFloodlight(window.digitalData, options)
    ddManager.addIntegration('DoubleClickFloodlight', doubleClick)

    window.gtag = window.gtag || noop
    sinon.stub(window, 'gtag')
  })

  afterEach(() => {
    window.gtag.restore()
    doubleClick.reset()
    ddManager.reset()
    reset()
  })

  describe('before loading', () => {
    beforeEach(() => {
      sinon.stub(doubleClick, 'load')
    })

    afterEach(() => {
      doubleClick.load.restore()
    })

    describe('#constructor', () => {
      it('should add proper options', () => {
        assert.strict.equal(options.events, doubleClick.getOption('events'))
      })
    })

    describe('#initialize', () => {
      it('should initialize gtag', () => {
        ddManager.initialize()
        assert.ok(window.gtag)
        assert.ok(window.gtag.calledWith('config', 'DC-123'))
        assert.ok(window.gtag.calledWith('config', 'DC-124'))
      })

      it('should not load any tags load after initialization', () => {
        ddManager.initialize()
        assert.ok(window.gtag.calledTwice)
      })
    })
  })

  describe('after loading', () => {
    beforeEach((done) => {
      sinon.stub(doubleClick, 'load')
      ddManager.once('ready', () => {
        done()
      })
      ddManager.initialize()
    })

    describe('#Custom Event', () => {
      it('should track custom event', () => {
        window.digitalData.events.push({
          name: 'Custom Event',
          label: 'exampleLabel',
          callback: () => {
            assert.ok(window.gtag.calledWith('event', 'conversion', {
              allow_custom_scripts: true,
              send_to: 'DC-123/GROUP1/TAG1+standard',
              u1: 'user123',
              u2: 'exampleLabel'
            }))
          }
        })
      })
    })

    describe('#Completed Transaction', () => {
      it('should track sale', () => {
        window.digitalData.events.push({
          name: 'Completed Transaction',
          transaction: {
            orderId: 'order123',
            lineItems: [
              {
                product: {
                  id: '123'
                },
                quantity: 1
              },
              {
                product: {
                  id: '234'
                },
                quantity: 2
              }
            ],
            total: 10000
          },
          label: 'exampleLabel',
          callback: () => {
            assert.ok(window.gtag.calledWith('event', 'purchase', {
              allow_custom_scripts: true,
              send_to: 'DC-123/GROUP1/TAG2+transactions',
              transaction_id: 'order123',
              value: 10000,
              u1: 'user123',
              u2: 'exampleLabel'
            }))
            assert.ok(window.gtag.calledWith('event', 'purchase', {
              allow_custom_scripts: true,
              send_to: 'DC-124/GROUP2/TAG3+transactions',
              transaction_id: 'order123',
              value: 10000,
              u1: 'user123',
              u2: 'exampleLabel'
            }))
          }
        })
      })
    })
  })
})
