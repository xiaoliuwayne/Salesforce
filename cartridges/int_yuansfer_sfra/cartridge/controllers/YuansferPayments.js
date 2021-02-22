/* eslint-disable new-cap */

'use strict';

var server = require('server');

var yuansferPaymentsHelper = require('*/cartridge/scripts/yuansfer/helpers/controllers/yuansferPaymentsHelper');
var csrfProtection = require('*/cartridge/scripts/middleware/csrf');
/**
 * Entry point for handling payment intent creation and confirmation AJAX calls.
 */
server.post('BeforePaymentAuthorization',server.middleware.https, csrfProtection.validateAjaxRequest, function (req, res, next) {
    
    var params = JSON.parse( req.httpHeaders.params);
    var responsePayload = yuansferPaymentsHelper.BeforePaymentAuthorization(params);
    res.json(responsePayload);
    next();
});

/**
 * An callback entry point to handle returns from payment.
 */

server.get('ConfirmPayment', function (req, res, next) {
    const payload = req.httpHeaders["x-is-query_string"];
    const confirmPaymentHelper = require('*/cartridge/scripts/yuansfer/helpers/confirmPaymentHelper');
    var success = confirmPaymentHelper.processIncomingNotification(payload);

    res.setStatusCode(success ? 200 : 500);
    res.json({
        success: !!success
    });
    // if(success){
    //     var URLUtils = require('dw/web/URLUtils');
    //     res.redirect(URLUtils.url('Home-Show'));
    // }
    next();
});

/**
 * An entry point to handle returns from alternative payment methods.
 */

server.get('HandleAPM', function (req, res, next) {
    var redirectUrl = yuansferPaymentsHelper.HandleAPM(true);
    res.redirect(redirectUrl);
    next();
});

/**
 * Get Yuansfer Order Items
 */
server.get('GetYuansferOrderItems', function (req, res, next) {
    var BasketMgr = require('dw/order/BasketMgr');
    var basket = BasketMgr.getCurrentBasket();

    var yuansferOrderDetails = basket ? require('*/cartridge/scripts/yuansfer/helpers/checkoutHelper').getYuansferOrderDetails(basket) : null;

    res.json({
        amount: yuansferOrderDetails ? yuansferOrderDetails.amount : [],
        orderItems: yuansferOrderDetails ? yuansferOrderDetails.order_items : []
    });

    next();
});

module.exports = server.exports();
