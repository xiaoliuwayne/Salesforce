/* eslint-env es6 */
/* global */

'use strict';

/**
 * Decode parameter
 * @param {Object} params parameters
 * @return {Object} - decoded object
 */
function decodeFormParams(params) {
    var pairs = params.split('&');
    var result = {};

    for (var i = 0; i < pairs.length; i++) {
        var pair = pairs[i].split('=');
        var key = decodeURIComponent(pair[0]);
        var value = decodeURIComponent(pair[1]);
        var isArray = /\[\]$/.test(key);
        var dictMatch = key.match(/^(.+)\[([^\]]+)\]$/);

        if (dictMatch) {
            key = dictMatch[1];
            var subkey = dictMatch[2];

            result[key] = result[key] || {};
            result[key][subkey] = value;
        } else if (isArray) {
            key = key.substring(0, key.length - 2);
            result[key] = result[key] || [];
            result[key].push(value);
        } else {
            result[key] = value;
        }
    }

    return result;
}
exports.DecodeFormParams = decodeFormParams;

/**
 * Created a response payload for beforePaymentAuthorization based on the status
 * of a given payment params.
 *
 * @param {Object} params - PaymentIntent object
 * @return {Object} - Response payload to return to client
 */
function searchTransaction(params) {
    var responsePayload;
    const yuansferService = require('*/cartridge/scripts/yuansfer/services/yuansferService');
    if (params) {
        responsePayload = yuansferService.tranQuery.create(params);
    }

    return responsePayload;
}

exports.SearchTransaction = searchTransaction;

/**
 * Entry point for handling payment creation and confirmation AJAX calls.
 * @param {Object} params - parameter object
 * @return {Object} responsePayload.
 */
function beforePaymentAuthorization(params) {
    var BasketMgr = require('dw/order/BasketMgr');
    var Transaction = require('dw/system/Transaction');
    var responsePayload;
    var checkoutHelper = require('*/cartridge/scripts/yuansfer/helpers/checkoutHelper');
    try {
        var basket = BasketMgr.getCurrentBasket();
        if (basket) {
            var yuansferPaymentInstrument = checkoutHelper.getYuansferPaymentInstrument(basket);
            if (yuansferPaymentInstrument) {
                responsePayload = checkoutHelper.createSecurePay(params);
                let paymentMethod = yuansferPaymentInstrument.paymentMethod;
                if (paymentMethod === 'YUANSFER_WECHATPAY') {
                    Transaction.wrap(function() {
                        basket.custom.yuansferWeChatPayQRCodeURL = responsePayload.result.cashierUrl;
                        basket.custom.yuansferIsPaymentInReview = true;
                    });
                } else if (paymentMethod === 'YUANSFER_CREDITCARD') {
                    // 跳转到yuasnfer 信用卡收银台支付
                    Transaction.wrap(function() {
                        basket.custom.yuansferCreditCardQRCodeURL = responsePayload.result.cashierUrl;
                        basket.custom.yuansferIsPaymentInReview = true;
                    });
                } else if (paymentMethod === 'YUANSFER_ALIPAY') {
                    Transaction.wrap(function() {
                        basket.custom.yuansferAlipayQRCodeURL = responsePayload.result.cashierUrl;
                        basket.custom.yuansferIsPaymentInReview = true;
                    });
                } else if (paymentMethod === 'YUANSFER_KAKAOPAY') {
                    Transaction.wrap(function() {
                        basket.custom.yuansferKakaoPayQRCodeURL = responsePayload.result.cashierUrl;
                        basket.custom.yuansferIsPaymentInReview = true;
                    });
                } else if (paymentMethod === 'YUANSFER_ALIPAYHK') {
                    Transaction.wrap(function() {
                        basket.custom.yuansferAlipayHKQRCodeURL = responsePayload.result.cashierUrl;
                        basket.custom.yuansferIsPaymentInReview = true;
                    });
                } else if (paymentMethod === 'YUANSFER_GCASH') {
                    Transaction.wrap(function() {
                        basket.custom.yuansferGCashQRCodeURL = responsePayload.result.cashierUrl;
                        basket.custom.yuansferIsPaymentInReview = true;
                    });
                } else if (paymentMethod === 'YUANSFER_DANA') {
                    Transaction.wrap(function() {
                        basket.custom.yuansferDanaQRCodeURL = responsePayload.result.cashierUrl;
                        basket.custom.yuansferIsPaymentInReview = true;
                    });
                } else if (paymentMethod === 'YUANSFER_PAYPAL') {
                    Transaction.wrap(function() {
                        basket.custom.yuansferPaypalQRCodeURL = responsePayload.result.cashierUrl;
                        basket.custom.yuansferIsPaymentInReview = true;
                    });
                }
            }
        }
    } catch (e) {
        if (e.callResult) {
            var o = e.callResult;
            responsePayload = {
                error: {
                    message: o.status,
                },
            };
        } else {
            responsePayload = {
                error: {
                    message: e.message,
                },
            };
        }
    }

    return responsePayload;
}

exports.BeforePaymentAuthorization = beforePaymentAuthorization;
exports.BeforePaymentAuthorization.public = true;

/**
 * An entry point to handle returns from alternative payment methods.
 * @param {Object} sfra - .
 * @return {Object} redirectUrl.
 */
function handleAPM(sfra) {
    const URLUtils = require('dw/web/URLUtils');

    var redirectUrl = '';
    try {
        if (sfra) {
            redirectUrl = URLUtils.url('Checkout-Begin', 'stage', 'placeOrder');
        } else {
            redirectUrl = URLUtils.url('COSummary-Start');
        }
    } catch (e) {
        if (sfra) {
            redirectUrl = URLUtils.url('Checkout-Begin', 'stage', 'payment', 'apm_return_error', e.message);
        } else {
            redirectUrl = URLUtils.url('COBilling-Start', 'apm_return_error', e.message);
        }
    }

    return redirectUrl;
}
exports.HandleAPM = handleAPM;
exports.HandleAPM.public = true;

