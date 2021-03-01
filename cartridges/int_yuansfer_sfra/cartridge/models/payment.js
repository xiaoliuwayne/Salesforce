/* global request, dw */
/* eslint-disable no-plusplus */

'use strict';

var PaymentMgr = require('dw/order/PaymentMgr');
var collections = require('*/cartridge/scripts/util/collections');
var base = module.superModule;

/**
 * Creates an array of objects containing applicable payment methods
 * @param {dw.util.ArrayList<dw.order.dw.order.PaymentMethod>} paymentMethods - An ArrayList of
 *      applicable payment methods that the user could use for the current basket.
 * @returns {Array} of object that contain information about the applicable payment methods for the
 *      current cart
 */
function applicablePaymentMethods(paymentMethods) {
    return collections.map(paymentMethods, function (method) {
        return {
            ID: method.ID,
            name: method.name
        };
    });
}

/**
 * Payment class that represents payment information for the current basket
 * @param {dw.order.Basket} currentBasket - the target Basket object
 * @param {dw.customer.Customer} currentCustomer - the associated Customer object
 * @param {string} countryCode - the associated Site countryCode
 * @constructor
 */
function Payment(currentBasket, currentCustomer, countryCode) {
    base.call(this, currentBasket, currentCustomer, countryCode);

    var yuansferHelper = require('*/cartridge/scripts/yuansfer/helpers/yuansferHelper');
    if (yuansferHelper.isYuansferEnabled()) {
        var paymentAmount = currentBasket.totalGrossPrice;
        var paymentMethods = PaymentMgr.getApplicablePaymentMethods(
            currentCustomer,
            countryCode,
            paymentAmount.value
        );

        paymentMethods = yuansferHelper.getYuansferPaymentMethods(paymentMethods, request.locale);

        this.applicablePaymentMethods =
            paymentMethods ? applicablePaymentMethods(paymentMethods) : null;
    } else {
        var applicablePaymentMethodsWithoutYuansfer = [];
        for (var i = 0; i < this.applicablePaymentMethods.length; i++) {
            var paymentMethod = this.applicablePaymentMethods[i];
            var currentPaymentMethod = dw.order.PaymentMgr.getPaymentMethod(paymentMethod.ID);
            if (currentPaymentMethod.paymentProcessor.ID !== 'YUANSFER_APM' && currentPaymentMethod.paymentProcessor.ID !== 'YUANSFER_CREDIT') {
                applicablePaymentMethodsWithoutYuansfer.push({
                    ID: paymentMethod.ID,
                    name: paymentMethod.name
                });
            }
        }

        this.applicablePaymentMethods = applicablePaymentMethodsWithoutYuansfer;
    }
}

module.exports = Payment;
