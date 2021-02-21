/* eslint-env es6 */
/* global request, dw, empty */

'use strict';

/**
 * Created a response payload for beforePaymentAuthorization based on the status
 * of a given payment intent.
 *
 * @param {Object} intent - PaymentIntent object
 * @return {Object} - Response payload to return to client
 */
function generateCardsPaymentResponse(intent) {
    const yuansferChargeCapture = dw.system.Site.getCurrent().getCustomPreferenceValue('yuansferChargeCapture');
    var responsePayload;
    if (intent.status === 'requires_capture' && !yuansferChargeCapture) {
        // The payment requires capture which will be made later
        responsePayload = {
            success: true
        };
    } else if (
        intent.status === 'requires_action' &&
        intent.next_action.type === 'use_yuansfer_sdk'
    ) {
        // Tell the client to handle the action
        responsePayload = {
            requires_action: true,
            payment_intent_client_secret: intent.client_secret
        };
    } else if (intent.status === 'succeeded') {
        // The payment didn’t need any additional actions and completed!
        // Handle post-payment fulfilment
        responsePayload = {
            success: true
        };
    } else {
        // Invalid status
        responsePayload = {
            error: 'Invalid PaymentIntent status'
        };
    }

    return responsePayload;
}

/**
 * Entry point for handling payment creation and confirmation AJAX calls.
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

            if (yuansferPaymentInstrument && yuansferPaymentInstrument.paymentMethod === 'CREDIT_CARD') {
                var paymentIntent;
                var paymentIntentId = (yuansferPaymentInstrument.paymentTransaction) ?
                    yuansferPaymentInstrument.paymentTransaction.getTransactionID() : null;
                if (paymentIntentId) {
                    paymentIntent = checkoutHelper.confirmPaymentIntent(paymentIntentId);
                } else {
                    paymentIntent = checkoutHelper.createPaymentIntent(yuansferPaymentInstrument);

                    Transaction.wrap(function () {
                        yuansferPaymentInstrument.paymentTransaction.setTransactionID(paymentIntent.id);
                    });
                }

                if (paymentIntent.review) {
                    Transaction.wrap(function () {
                        basket.custom.yuansferIsPaymentInReview = true;
                    });
                }

                responsePayload = generateCardsPaymentResponse(paymentIntent);
            } else if (yuansferPaymentInstrument){
                responsePayload = checkoutHelper.createSecurePay(params);
                if(yuansferPaymentInstrument.paymentMethod === 'YUANSFER_WECHATPAY') {
                    Transaction.wrap(function () {
                        basket.custom.yuansferWeChatPayQRCodeURL = "https://yuansfer1.oss-accelerate.aliyuncs.com/images/securepayQrcode/qrcode_200043_104330309613935997.jpg";
                        basket.custom.yuansferIsPaymentInReview = true;
                    });
                } else if(yuansferPaymentInstrument.paymentMethod === 'YUANSFER_ALIPAY') {
                    Transaction.wrap(function () {
                        basket.custom.yuansferAlipayQRCodeURL = responsePayload.result;
                        basket.custom.yuansferIsPaymentInReview = true;
                    });
                }else if(yuansferPaymentInstrument.paymentMethod === 'YUANSFER_KAKAOPAY') {
                    Transaction.wrap(function () {
                        basket.custom.yuansferKakaoPayQRCodeURL = responsePayload.result;
                        basket.custom.yuansferIsPaymentInReview = true;
                    });
                }else if(yuansferPaymentInstrument.paymentMethod === 'YUANSFER_ALIPAYHK') {
                    Transaction.wrap(function () {
                        basket.custom.yuansferAlipayHKQRCodeURL = responsePayload.result;
                        basket.custom.yuansferIsPaymentInReview = true;
                    });
                }else if(yuansferPaymentInstrument.paymentMethod === 'YUANSFER_GCASH') {
                    Transaction.wrap(function () {
                        basket.custom.yuansferGCashQRCodeURL = responsePayload.result;
                        basket.custom.yuansferIsPaymentInReview = true;
                    });
                }else if(yuansferPaymentInstrument.paymentMethod === 'YUANSFER_DANA') {
                    Transaction.wrap(function () {
                        basket.custom.yuansferDanaQRCodeURL = responsePayload.result;
                        basket.custom.yuansferIsPaymentInReview = true;
                    });
                }
            }  
        }
    } catch (e) {
        if (e.callResult) {
            var o = JSON.parse(e.callResult.errorMessage);
            responsePayload = {
                error: {
                    code: o.error.code,
                    message: o.error.message
                }
            };
        } else {
            responsePayload = {
                error: {
                    message: e.message
                }
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
    const paramsMap = request.httpParameterMap;

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


