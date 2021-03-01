/* eslint-env es6 */
/* global request */

/**
 * Maps Yuansfer card brand like 'visa' to SFCC card type, exactly as defined in
 * BM > Merchant Tools > Ordering > Payment Methods > Credit/Debit Cards.
 *
 * @param {string} YuansferCardBrand - card brand as returned by Yuansfer APIs
 * @return {string} - SFCC card type
 */
function getCardTypeByBrand(YuansferCardBrand) {
    var brandsToCardTypeMap = {
        visa: 'Visa',
        mastercard: 'Master',
        amex: 'Amex',
        discover: 'Discover'
    };

    return brandsToCardTypeMap[YuansferCardBrand] || YuansferCardBrand;

    // The mapping does not need to be exact, as validatePaymentInstruments has
    // been modified not to check for a match in case card payment are handled by
    // Yuansfer. So values can be stored as resource strings and the following code
    // can be used instead:
    // return require('dw/web/Resource').msg('cardtype.' + YuansferCardBrand, 'Yuansfer', YuansferCardBrand);
}

/**
 * Returns the SFCC card type based on the Yuansfer-SFCC mappings and the request
 * For new cards we receive only card brand and will get the type based on that
 * For saved cards we already have the cart type to use
 *
 * @return {string} - SFCC card type
 */
function getCardType() {
    const paramsMap = request.httpParameterMap;
    const cardBrand = paramsMap.Yuansfer_card_brand.stringValue;
    var cardType = paramsMap.Yuansfer_card_type.stringValue;

    if (!cardType && cardBrand) {
        cardType = getCardTypeByBrand(cardBrand);
    }

    return cardType;
}

exports.getCardTypeByBrand = getCardTypeByBrand;
exports.getCardType = getCardType;
