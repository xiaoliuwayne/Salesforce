/* eslint-env es6 */
/* global dw, empty */

'use strict';

/**
 * Checks if the payment is a Yuansfer APM method
 *
 * @param {dw.order.PaymentMethod} paymentMethod - SFCC PaymentMethod
 * @return {boolean} - True if Yuansfer is used as processor for the payment
 */
function isYuansferAPMPayment(paymentMethod) {
    if (!empty(paymentMethod)) {
        var paymentProcessor = paymentMethod.getPaymentProcessor();
        if (!empty(paymentProcessor) && paymentProcessor.ID.equals('Yuansfer_APM')) {
            return true;
        }
    }

    return false;
}

/**
 * Checks if Yuansfer integration is enabled.
 *
 * @return {boolean} - True if sitepreference is set to true.
 */
exports.isYuansferEnabled = function() {
    var Site = require('dw/system/Site');
    return Site.current.preferences.custom.yuansferEnable;
};


/**
* Gets the Yuansfer MerchantNo from Site Preferences.
*
* @returns {string} Yuansfer MerchantNo.
*/
exports.getYuansferMerchantNo = function() {
    return require('dw/system/Site').current.preferences.custom.yuansferMerchantNo;
};

/**
* Gets the Yuansfer Token from Site Preferences.
*
* @returns {string} Yuansfer Token.
*/
exports.getYuansferToken = function() {
    return require('dw/system/Site').current.preferences.custom.yuansferToken;
};

/**
* Gets the Yuansfer StoreNo from Site Preferences.
*
* @returns {string} Yuansfer StoreNo.
*/
exports.getYuansferStoreNo = function() {
    return require('dw/system/Site').current.preferences.custom.yuansferStoreNo;
};

/**
 * Returns Yuansfer allowed payment methods
 *
 * @param {dw.util.Collection} applicablePaymentMethods - SFCC payment methods
 * @param {string} locale - the APM locale
 * @return {dw.util.Collection} - filtered payment methods
 */
exports.getYuansferPaymentMethods = function(applicablePaymentMethods, locale) {
    const localeConfig = JSON.parse(require('dw/system/Site').current.getCustomPreferenceValue('yuansferAllowedAPMMethods')) || {};
    const list = localeConfig[locale] != null ? localeConfig[locale] : localeConfig.default;
    const applicablePaymentMethodsIterator = applicablePaymentMethods.iterator();

    if (!empty(list)) {
        let filteredPaymentMethods = new dw.util.ArrayList();

        while (applicablePaymentMethodsIterator.hasNext()) {
            let method = applicablePaymentMethodsIterator.next();
            let isAPM = isYuansferAPMPayment(method);
            if ((isAPM && list.indexOf(method.ID.substr(7).toLowerCase()) > -1) || !isAPM) {
                filteredPaymentMethods.push(method);
            }
        }

        return filteredPaymentMethods;
    }

    return applicablePaymentMethods;
};

exports.isYuansferAPMPayment = isYuansferAPMPayment;

