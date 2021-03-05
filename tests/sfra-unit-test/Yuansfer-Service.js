/* eslint-disable no-unused-expressions */

const { assert } = require('chai');
const yuansferService = require('../sfra-mock-test/int_yuansfer_core/cartridge/scripts/yuansfer/services/YuansferService');

describe('Yuansfer Service', () => {
    describe('Secure Pay', () => {
        it('Should create a payment through Yuansfer secure pay API', () => {
            const svc = {
                requestMethod: null,
                params: {},
                headers: {},
                configuration: {
                    credential: { URL: 'someUrl' }
                },
                getURL() {
                    return this.URL;
                },
                setURL(url) {
                    this.URL = url;
                },
                setRequestMethod(method) {
                    this.requestMethod = method;
                },
                addParam(name, value) {
                    if (name.endsWith('[]')) {
                        this.params[name] = this.params[name] || [];
                        this.params[name].push(value);
                    } else {
                        this.params[name] = value;
                    }
                },
                addHeader(name, value) {
                    this.headers[name] = value;
                }
            };
            const response = yuansferService.exports.getYuansferServiceDefinition().callback.createRequest(svc, {
                endpoint: '/online/v3/secure-pay',
                httpMethod: 'POST',
                payload: {
                    x: 123,
                    s: {
                        s1: 1
                    },
                    p: ['q1', 'q2']
                }
            });

            assert.equal(svc.requestMethod, 'POST');
            assert.equal(svc.URL, 'https://mapi.yuansfer.yunkeguan.com/online/v3/secure-pay');
            assert.notEqual(response.ret_code, '000100');
        });
    });
    describe('Search Transaction', () => {
        it('Should search for transaction', () => {
            const svc = {
                requestMethod: null,
                params: {},
                headers: {},
                configuration: {
                    credential: { URL: 'someUrl' }
                },
                getURL() {
                    return this.URL;
                },
                setURL(url) {
                    this.URL = url;
                },
                setRequestMethod(method) {
                    this.requestMethod = method;
                },
                addParam(name, value) {
                    if (name.endsWith('[]')) {
                        this.params[name] = this.params[name] || [];
                        this.params[name].push(value);
                    } else {
                        this.params[name] = value;
                    }
                },
                addHeader(name, value) {
                    this.headers[name] = value;
                }
            };
            const response = yuansferService.exports.getYuansferServiceDefinition().callback.createRequest(svc, {
                endpoint: '/app-data-search/v3/tran-query',
                httpMethod: 'POST',
                payload: {
                    x: 123,
                    s: {
                        s1: 1
                    },
                    p: ['q1', 'q2']
                }
            });

            assert.equal(svc.requestMethod, 'POST');
            assert.equal(svc.URL, 'https://mapi.yuansfer.yunkeguan.com/app-data-search/v3/tran-query');
            assert.notEqual(response.ret_code, '000100');
        });
    });
    describe('Refund', () => {
        it('Should make a refund', () => {
            const svc = {
                requestMethod: null,
                params: {},
                headers: {},
                configuration: {
                    credential: { URL: 'someUrl' }
                },
                getURL() {
                    return this.URL;
                },
                setURL(url) {
                    this.URL = url;
                },
                setRequestMethod(method) {
                    this.requestMethod = method;
                },
                addParam(name, value) {
                    if (name.endsWith('[]')) {
                        this.params[name] = this.params[name] || [];
                        this.params[name].push(value);
                    } else {
                        this.params[name] = value;
                    }
                },
                addHeader(name, value) {
                    this.headers[name] = value;
                }
            };
            const response = yuansferService.exports.getYuansferServiceDefinition().callback.createRequest(svc, {
                endpoint: '/app-data-search/v3/refund',
                httpMethod: 'POST',
                payload: {
                    x: 123,
                    s: {
                        s1: 1
                    },
                    p: ['q1', 'q2']
                }
            });

            assert.equal(svc.requestMethod, 'POST');
            assert.equal(svc.URL, 'https://mapi.yuansfer.yunkeguan.com/app-data-search/v3/refund');
            assert.notEqual(response.ret_code, '000100');
        });
    });
});
