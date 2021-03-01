/* eslint-env es6 */

'use strict';


/**
 * An adapter for Yuansfer payment instrument data objects, to make then
 * compatible (have the same properties) as dw.order.PaymentInstrumnent.
 *
 * @param {Object} yuansferPaymentInstrumentData - Payment instrument obejct
 *   received from Yuansfer service
 * @param {boolean} isDefault - Indicates whether this is the default payment
 *   instrument of the customer
 */
function CustomerPaymentInstrument(yuansferPaymentInstrumentData, isDefault) {
    const yuansferCardData = yuansferPaymentInstrumentData.card;
    const billingDetails = yuansferPaymentInstrumentData.billing_details;

    const maskedCardNumber = '************' + yuansferCardData.last4;

    var custom = Object.create(null, {
        yuansferId: {
            value: yuansferPaymentInstrumentData.id,
            enumerable: true
        },
        yuansferObject: {
            value: yuansferPaymentInstrumentData.object,
            enumerable: true
        },
        yuansferType: {
            value: yuansferPaymentInstrumentData.type,
            enumerable: true
        },
        yuansferCardBrand: {
            value: yuansferCardData.brand,
            enumerable: true
        },
        isDefault: {
            value: isDefault || false,
            enumerable: true
        }
    });

    Object.defineProperties(this, {
        UUID: {
            value: yuansferPaymentInstrumentData.id,
            enumerable: true
        },
        creditCardNumber: {
            value: maskedCardNumber,
            enumerable: true
        },
        maskedCreditCardNumber: {
            value: maskedCardNumber,
            enumerable: true
        },
        permanentlyMasked: {
            value: true,
            enumerable: true
        },
        creditCardType: {
            value: require('../helpers/cardsHelper').getCardTypeByBrand(yuansferCardData.brand),
            enumerable: true
        },
        creditCardHolder: {
            value: (billingDetails && billingDetails.name) || ' ',
            enumerable: true
        },
        creditCardExpirationYear: {
            value: yuansferCardData.exp_year,
            enumerable: true
        },
        creditCardExpirationMonth: {
            value: yuansferCardData.exp_month,
            enumerable: true
        },
        creditCardNumberLastDigits: {
            value: yuansferCardData.last4,
            enumerable: true
        },
        custom: {
            value: Object.freeze(custom),
            enumerable: true
        }
    });
}

module.exports = CustomerPaymentInstrument;
