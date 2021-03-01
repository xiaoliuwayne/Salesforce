const { assert, expect } = require('chai');
const Request = require('superagent');
const config = require('../config');
const Url = config.sfraUrl;

describe('Yuansfer Payments Tests', () => {
    context('Yuansfer Payments BeforePaymentAuthorization', () => {
        const Path = 'YuansferPayments-BeforePaymentAuthorization';
        it('Should return a 500 response statusCode', () => Request.post(Url + Path)
                .set('content-type', 'applicaiton/json')
                .end((data) => {
                    assert.equal(data.response.statusCode, 500, 'Should return a 500 response statusCode');
                }));
    });
    context('Yuansfer Payments HandleConfirm', () => {
        const Path = 'YuansferPayments-HandleConfirm';
        it('Should return a 500 response statusCode', () => Request.post(Url + Path)
                .set('content-type', 'applicaiton/json')
                .end((data) => {
                    assert.equal(data.response.statusCode, 500, 'Should return a 500 response statusCode');
                }));
    });
    context('Yuansfer Payments HandleAPM', () => {
        const Path = 'YuansferPayments-HandleAPM';
        it('Should return a 500 response statusCode', () => Request.get(Url + Path)
                .set('content-type', 'applicaiton/json')
                .end((data) => {
                    assert.equal(data.response.statusCode, 500, 'Should return a 500 response statusCode');
                }));
    });
    context('Yuansfer Payments GetYuansferOrderItems', () => {
        const Path = 'YuansferPayments-GetYuansferOrderItems';
        it('Should return a 500 response statusCode', () => Request.get(Url + Path)
                .set('content-type', 'applicaiton/json')
                .end((data) => {
                    assert.equal(data.response.statusCode, 500, 'Should return a 500 response statusCode');
                }));
    });
});
