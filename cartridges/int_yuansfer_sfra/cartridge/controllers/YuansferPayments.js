/* eslint-disable new-cap */

'use strict';

var server = require('server');

var yuansferPaymentsHelper = require('*/cartridge/scripts/yuansfer/helpers/controllers/yuansferPaymentsHelper');
var csrfProtection = require('*/cartridge/scripts/middleware/csrf');
/**
 * Entry point for handling payment intent creation and confirmation AJAX calls.
 */
server.post('BeforePaymentAuthorization', server.middleware.https, csrfProtection.validateAjaxRequest, function(req, res, next) {
    var params = JSON.parse(req.httpHeaders.params);
    var responsePayload = yuansferPaymentsHelper.BeforePaymentAuthorization(params);
    res.json(responsePayload);
    next();
});

/**
 * Entry point for handling transaction search.
 */
server.post('HandleConfirm', function(req, res, next) {
    var bodyParams = req.httpParameterMap.requestBodyAsString;
    var params = yuansferPaymentsHelper.DecodeFormParams(bodyParams);
    var responsePayload = yuansferPaymentsHelper.SearchTransaction(params);
    if (responsePayload.ret_code === '000100') {
        if (responsePayload.result.status === 'success') {
            var placeOrderParams = params;
            placeOrderParams.transactionNo = responsePayload.result.transactionNo;
            var confirmPaymentHelper = require('*/cartridge/scripts/yuansfer/helpers/confirmPaymentHelper');
            confirmPaymentHelper.processIncomingNotification(placeOrderParams);
        }
    }
    res.json(responsePayload);

    next();
});

/**
 * An entry point to handle returns from alternative payment methods.
 */

server.get('HandleAPM', function(req, res, next) {
    var redirectUrl = yuansferPaymentsHelper.HandleAPM(true);
    res.redirect(redirectUrl);
    next();
});

/**
 * Get Yuansfer Order Items
 */
server.get('GetYuansferOrderItems', function(req, res, next) {
    var BasketMgr = require('dw/order/BasketMgr');
    var basket = BasketMgr.getCurrentBasket();

    var yuansferOrderDetails = basket ? require('*/cartridge/scripts/yuansfer/helpers/checkoutHelper').getYuansferOrderDetails(basket) : null;

    res.json({
        amount: yuansferOrderDetails ? yuansferOrderDetails.amount : [],
        orderItems: yuansferOrderDetails ? yuansferOrderDetails.order_items : [],
    });

    next();
});

module.exports = server.exports();
