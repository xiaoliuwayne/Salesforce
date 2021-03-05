/* eslint-env es6 */

'use strict';

var COHelpers = module.superModule;
var yuansferHelper = require('*/cartridge/scripts/yuansfer/helpers/yuansferHelper');
if (yuansferHelper.isYuansferEnabled()) {
    /**
     * Validates payment - Overriden because yuansfer validates the cards.
     * @param {Object} req - The local instance of the request object
     * @param {dw.order.Basket} currentBasket - The current basket
     * @returns {Object} an object that has error information
     */
    // v1
    // eslint-disable-next-line no-unused-vars
    COHelpers.validatePayment = function validatePayment(req, currentBasket) {
        return { error: false };
    };

    COHelpers.createOrder = function createOrder(currentBasket) {
        const yuansferCheckoutHelper = require('*/cartridge/scripts/yuansfer/helpers/checkoutHelper');
        return yuansferCheckoutHelper.createOrder(currentBasket);
    };
}

module.exports = COHelpers;
