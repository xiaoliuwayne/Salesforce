/* eslint-env es6 */
/* eslint-disable no-plusplus */
/* global session, customer, dw, empty, request */

'use strict';
var yuansferHelper = require('*/cartridge/scripts/yuansfer/helpers/yuansferHelper');
/**
 * Checks if Yuansfer integration for card payments is enabled.
 *
 * @return {boolean} - True if Yuansfer is used as processor for card payments.
 */
exports.isYuansferCardsPaymentMethodEnabled = function () {
    const PaymentMgr = require('dw/order/PaymentMgr');
    const PaymentInstrument = require('dw/order/PaymentInstrument');

    const cardPaymentMethod = PaymentMgr.getPaymentMethod(PaymentInstrument.METHOD_CREDIT_CARD);
    if (cardPaymentMethod && cardPaymentMethod.active) {
        const paymentProcessor = cardPaymentMethod.getPaymentProcessor();

        return (paymentProcessor && 'Yuansfer_CREDIT'.equals(paymentProcessor.ID));
    }

    return false;
};


exports.areYuansferAlernativePaymentMethodsEnabled = function () {
    const PaymentMgr = require('dw/order/PaymentMgr');

    var activePaymentMethods = PaymentMgr.getActivePaymentMethods();

    for (let i = 0; i < activePaymentMethods.length; i++) {
        let paymentMethod = activePaymentMethods[i];
        let paymentProcessor = paymentMethod.getPaymentProcessor();

        if (paymentProcessor && 'Yuansfer_APM'.equals(paymentProcessor.ID)) {
            return true;
        }
    }

    return false;
};


exports.isAnyYuansferPaymentMethodEnabled = function () {
    return this.isYuansferCardsPaymentMethodEnabled() || this.areYuansferAlernativePaymentMethodsEnabled();
};

/**
 * Checks whether a given payment isntrument is handled by Yuansfer.
 *
 * @param {dw.order.PaymentInstrument} paymentInstrument - Payment instrument to check.
 * @return {boolean} - True if a Yuansfer payment instrument
 */
function isYuansferPaymentInstrument(paymentInstrument) {
    if (!paymentInstrument || !paymentInstrument.paymentMethod) {
        return false;
    }

    const yuansferPaymentInstrumentRegex = /(^CREDIT_CARD$|^Yuansfer_.+)/i;
    return yuansferPaymentInstrumentRegex.test(paymentInstrument.paymentMethod);
}


exports.confirmPaymentIntent = function (paymentIntentId) {
    const yuansferService = require('*/cartridge/scripts/yuansfer/services/yuansferService');

    const paymentIntent = yuansferService.paymentIntents.confirm(paymentIntentId);

    return paymentIntent;
};

/**
 * Gets the Yuansfer payment instrument created for a given line item container.
 *
 * @param {dw.order.LineItemContainer} lineItemCtnr - Line item container
 * @return {dw.order.OrderPaymentInstruments} - Yuansfer payment instrument or null
 */
function getYuansferPaymentInstrument(lineItemCtnr) {
    const allPaymentInstruments = lineItemCtnr.paymentInstruments.toArray();
    const yuansferPaymentInstruments = allPaymentInstruments.filter(isYuansferPaymentInstrument);

    return yuansferPaymentInstruments.length ? yuansferPaymentInstruments[0] : null;
}

exports.getYuansferPaymentInstrument = getYuansferPaymentInstrument;

exports.removeYuansferPaymentInstruments = function (lineItemCtnr) {
    const iter = lineItemCtnr.paymentInstruments.iterator();
    var existingPI;

    // remove them
    while (iter.hasNext()) {
        existingPI = iter.next();

        if (isYuansferPaymentInstrument(existingPI)) {
            lineItemCtnr.removePaymentInstrument(existingPI);
        }
    }
};

exports.createYuansferPaymentInstrument = function (lineItemCtnr, paymentMethodId, params) {
    exports.removeYuansferPaymentInstruments(lineItemCtnr);
    var PaymentTransaction = require('dw/order/PaymentTransaction');

    const paymentInstrument = lineItemCtnr.createPaymentInstrument(paymentMethodId, this.getNonGiftCertificateAmount(lineItemCtnr));

    const yuansferService = require('*/cartridge/scripts/yuansfer/services/yuansferService');

    if (session.privacy.yuansferOrderNumber) {
        const paymentTransaction = paymentInstrument.paymentTransaction;
        paymentTransaction.custom.yuansferOrderNumber = session.privacy.yuansferOrderNumber;
        paymentTransaction.custom.yuansferTransactionOpened = true;
        paymentInstrument.paymentTransaction.setType(PaymentTransaction.TYPE_CAPTURE);
    }

    if (paymentInstrument) {
        delete lineItemCtnr.custom.yuansferIsPaymentInReview; // eslint-disable-line
    }
};

exports.createSecurePay = function (params) {
    const yuansferService = require('*/cartridge/scripts/yuansfer/services/yuansferService');

    const securePay = yuansferService.securePay.create(params);

    return securePay;
};

exports.getSiteID = function () {
    return require('dw/system/Site').getCurrent().getID();
};

exports.getNewYuansferOrderNumber = function () {
    const OrderMgr = require('dw/order/OrderMgr');
    var yuansferOrderNumber = session.privacy.yuansferOrderNumber;

    if (!yuansferOrderNumber // Order number has not been created yet
        || OrderMgr.getOrder(yuansferOrderNumber) // The created order number has already been used, could happen in case a payment authorization attempt fails.
    ) {
        // v1
        // eslint-disable-next-line no-multi-assign
        yuansferOrderNumber = session.privacy.yuansferOrderNumber = OrderMgr.createOrderNo();
    }

    return yuansferOrderNumber;
};

/**
 * Returns the saved order number.
 * of the given line item container, then falls back to the value stored in session.
 *
 * @param {dw.order.LineItemCtnr} lineItemCtnr - Line item container to check
 * @return {string} - Saved Order number
 */
function getSavedYuansferOrderNumber(lineItemCtnr) {
    var yuansferOrderNumber = null;

    if (lineItemCtnr) {
        const yuansferPaymentInstrument = getYuansferPaymentInstrument(lineItemCtnr);

        if (yuansferPaymentInstrument) {
            const paymentTransaction = yuansferPaymentInstrument.paymentTransaction;
            if ('yuansferOrderNumber' in paymentTransaction.custom) {
                yuansferOrderNumber = paymentTransaction.custom.yuansferOrderNumber;
            }
        }
    }

    if (!yuansferOrderNumber) {
        yuansferOrderNumber = session.privacy.yuansferOrderNumber;
    }

    return yuansferOrderNumber;
}

exports.getNonGiftCertificateAmount = function (lineItemCtnr) {
    const Money = require('dw/value/Money');

    // The total redemption amount of all gift certificate payment instruments in the basket.
    var giftCertTotal = new Money(0.0, lineItemCtnr.getCurrencyCode());

    // Gets the list of all gift certificate payment instruments
    var gcPaymentInstrs = lineItemCtnr.getGiftCertificatePaymentInstruments();
    var iter = gcPaymentInstrs.iterator();
    var orderPI = null;

    // Sums the total redemption amount.
    while (iter.hasNext()) {
        orderPI = iter.next();
        giftCertTotal = giftCertTotal.add(orderPI.getPaymentTransaction().getAmount());
    }

    // Gets the order total.
    var orderTotal = lineItemCtnr.getTotalGrossPrice();
    if (orderTotal.value === 0) {
        orderTotal = lineItemCtnr.getAdjustedMerchandizeTotalPrice(true).add(lineItemCtnr.giftCertificateTotalPrice);
    }

    // Calculates the amount to charge for the payment instrument.
    // This is the remaining open order total that must be paid.
    var amountOpen = orderTotal.subtract(giftCertTotal);

    // Returns the open amount to be paid.
    return amountOpen;
};


/**
 * Attempts to create an order from the current basket
 * @param {dw.order.Basket} currentBasket - The current basket
 * @returns {dw.order.Order} The order object created from the current basket
 */
exports.createOrder = function (currentBasket) {
    const OrderMgr = require('dw/order/OrderMgr');
    const Transaction = require('dw/system/Transaction');
    const yuansferOrderNumber = getSavedYuansferOrderNumber(currentBasket);

    var order;
    try {
        order = Transaction.wrap(function () {
            var newOrder;

            if (yuansferOrderNumber) {
                newOrder = OrderMgr.createOrder(currentBasket, yuansferOrderNumber);
            } else {
                newOrder = OrderMgr.createOrder(currentBasket);
            }

            return newOrder;
        });

        session.privacy.yuansferOrderNumber = null;
        delete session.privacy.yuansferOrderNumber;
    } catch (error) {
        return null;
    }

    return order;
};

/**
 * Checks if order is APM
 * @param {dw.order.Order} order object
 * @returns {bool} true if AMP order
 */
exports.isAPMOrder = function (order) {
    for (let i = 0; i < order.paymentInstruments.length; i++) {
        let paymentInstrument = order.paymentInstruments[i];
        let paymentTransaction = paymentInstrument.paymentTransaction;
        let paymentProcessor = paymentTransaction && paymentTransaction.paymentProcessor;

        if (paymentProcessor && 'YUANSFER_APM'.equals(paymentProcessor.ID)) {
            return true;
        }
    }

    return false;
};

exports.getYuansferOrderDetails = function (basket) {
    var yuansferOrderAmount = exports.getNonGiftCertificateAmount(basket);
    var currentCurency = dw.util.Currency.getCurrency(yuansferOrderAmount.getCurrencyCode());
    var yuansferOrderAmountCalculated = yuansferOrderAmount.getValue();

    var billingAddress = basket.billingAddress;
    var billingAddressCountryCode = billingAddress ? billingAddress.countryCode.value : '';

    var shippingAddress = null;
    var shipments = basket.getShipments();
    var iter = shipments.iterator();
    while (iter != null && iter.hasNext()) {
        var shipment = iter.next();
        shippingAddress = shipment.getShippingAddress();

        if (shippingAddress) {
            break;
        }
    }

    var orderShipping = {
        phone: shippingAddress ? shippingAddress.getPhone() : '',
        address: {
            line1: shippingAddress ? shippingAddress.getAddress1() : '',
            line2: shippingAddress ? shippingAddress.getAddress2() : '',
            city: shippingAddress ? shippingAddress.getCity() : '',
            postal_code: shippingAddress ? shippingAddress.getPostalCode() : '',
            country: shippingAddress ? shippingAddress.getCountryCode().value : '',
            state: shippingAddress ? shippingAddress.getStateCode() : ''
        }
    };

    var shippingFirstName = shippingAddress ? shippingAddress.getFirstName() : '';
    var shippingLastName = shippingAddress ? shippingAddress.getLastName() : '';

    var orderItems = [];

    var subTotal = new dw.value.Money(0, yuansferOrderAmount.getCurrencyCode());

    var productLineItems = basket.getAllProductLineItems().iterator();
    while (productLineItems.hasNext()) {
        var productLineItem = productLineItems.next();

        if (productLineItem.price.available) {
            var product = productLineItem.getProduct();
            var productID = (product) ? product.getID() : '';
            var productName = (product) ? product.getName() : '';

            // var productItem = {
            //     type: 'sku',
            //     parent: productID,
            //     description: productName,
            //     quantity: productLineItem.quantity.value,
            //     currency: productLineItem.price.currencyCode,
            //     amount: Math.round(productLineItem.getAdjustedPrice().getValue() * multiplier)
            // };
            var productItem = {
                goods_name: productName,
                quantity: productLineItem.quantity.value
            };
            orderItems.push(productItem);

            subTotal = subTotal.add(productLineItem.getAdjustedPrice());
        }
    }

    // add shipping
    // var shippingTotalPrice = basket.getAdjustedShippingTotalPrice();
    // if (shippingTotalPrice.available) {
    //     var shippingItem = {
    //         type: 'shipping',
    //         description: 'Shipping',
    //         currency: shippingTotalPrice.currencyCode,
    //         amount: shippingTotalPrice.getValue()
    //     };
    //     orderItems.push(shippingItem);

    //     subTotal = subTotal.add(shippingTotalPrice);
    // }

    // add tax
    // var totalTax = yuansferOrderAmount.subtract(subTotal);
    // if (totalTax.value > 0) {
    //     var taxItem = {
    //         type: 'tax',
    //         description: 'Taxes',
    //         currency: basket.totalTax.currencyCode,
    //         amount:totalTax.getValue()
    //     };
    //     orderItems.push(taxItem);
    // }

    return {
        amount: yuansferOrderAmountCalculated,
        currency: yuansferOrderAmount.getCurrencyCode(),
        purchase_country: billingAddressCountryCode,
        order_items: JSON.stringify(orderItems),
        order_shipping: JSON.stringify(orderShipping),
        shipping_first_name: shippingFirstName,
        shipping_last_name: shippingLastName,
        note: '',
        description: ''
    };
};

exports.getShippingOptions = function () {
    var basket = dw.order.BasketMgr.getCurrentBasket();
    var shipments = basket.getShipments();

    var currentCurency = dw.util.Currency.getCurrency(basket.getCurrencyCode());
    var multiplier = Math.pow(10, currentCurency.getDefaultFractionDigits());

    var shipmentShippingModel = dw.order.ShippingMgr.getShipmentShippingModel(shipments[0]);
    var shippingMethods = shipmentShippingModel.getApplicableShippingMethods();

    // Filter out whatever the method associated with in store pickup
    var result = [];
    for (let i = 0; i < shippingMethods.length; i++) {
        var shippingMethod = shippingMethods[i];
        if (!shippingMethod.custom.storePickupEnabled) {
            result.push({
                id: shippingMethod.ID,
                label: shippingMethod.displayName,
                detail: shippingMethod.description,
                amount: Math.round(shipmentShippingModel.getShippingCost(shippingMethod).amount.value * multiplier)
            });
        }
    }

    return result;
};

/**
 * Get WeChat QR Code URL by Order Number
 * @param {Integer} orderNumber to get QR Code URL
 * @returns {string} WeChat QR Code URL
 */
exports.getWeChatPayQRCodeURL = function (orderNumber) {
    const OrderMgr = require('dw/order/OrderMgr');

    var order = OrderMgr.getOrder(orderNumber);

    return !empty(order) ? order.custom.yuansferWeChatPayQRCodeURL : '';
};

/**
 * Get Alipay QR Code URL by Order Number
 * @param {Integer} orderNumber to get QR Code URL
 * @returns {string} Alipay QR Code URL
 */
exports.getAlipayQRCodeURL = function (orderNumber) {
    const OrderMgr = require('dw/order/OrderMgr');

    var order = OrderMgr.getOrder(orderNumber);

    return !empty(order) ? order.custom.yuansferAlipayQRCodeURL : '';
};

/**
 * Get Kakao Pay QR Code URL by Order Number
 * @param {Integer} orderNumber to get QR Code URL
 * @returns {string} KakaoPay QR Code URL
 */
exports.getKakaoPayCodeURL = function (orderNumber) {
    const OrderMgr = require('dw/order/OrderMgr');

    var order = OrderMgr.getOrder(orderNumber);

    return !empty(order) ? order.custom.yuansferKakaoPayQRCodeURL : '';
};

/**
 * Get Dana QR Code URL by Order Number
 * @param {Integer} orderNumber to get QR Code URL
 * @returns {string} Dana QR Code URL
 */
exports.getDanaQRCodeURL = function (orderNumber) {
    const OrderMgr = require('dw/order/OrderMgr');

    var order = OrderMgr.getOrder(orderNumber);

    return !empty(order) ? order.custom.yuansferDanaQRCodeURL : '';
};

/**
 * Get GCash QR Code URL by Order Number
 * @param {Integer} orderNumber to get QR Code URL
 * @returns {string} GCash QR Code URL
 */
exports.getGCashQRCodeURL = function (orderNumber) {
    const OrderMgr = require('dw/order/OrderMgr');

    var order = OrderMgr.getOrder(orderNumber);

    return !empty(order) ? order.custom.yuansferGCashQRCodeURL : '';
};

/**
 * Get HK Alipay QR Code URL by Order Number
 * @param {Integer} orderNumber to get QR Code URL
 * @returns {string} HK Alipay QR Code URL
 */
exports.getAlipayHKQRCodeURL = function (orderNumber) {
    const OrderMgr = require('dw/order/OrderMgr');

    var order = OrderMgr.getOrder(orderNumber);

    return !empty(order) ? order.custom.yuansferAlipayHKQRCodeURL : '';
};

/**
 * Get Credit Card QR Code URL by Order Number
 * @param {Integer} orderNumber to get QR Code URL
 * @returns {string} credit Card QR Code URL
 */
exports.getCreditCardQRCodeURL = function (orderNumber) {
    const OrderMgr = require('dw/order/OrderMgr');

    var order = OrderMgr.getOrder(orderNumber);

    return !empty(order) ? order.custom.yuansferCreditCardQRCodeURL : '';
};

/**
 * Get Paypal QR Code URL by Order Number
 * @param {Integer} orderNumber to get QR Code URL
 * @returns {string} Paypal QR Code URL
 */
exports.getPaypalQRCodeURL = function (orderNumber) {
    const OrderMgr = require('dw/order/OrderMgr');

    var order = OrderMgr.getOrder(orderNumber);

    return !empty(order) ? order.custom.yuansferPaypalQRCodeURL : '';
};

/**
 * Get TransactionNo by Order Number
 * @param {Integer} orderNumber to get TransactionNo
 * @returns {string} TransactionNo
 */
exports.getTransactionNo = function (orderNumber) {
    const OrderMgr = require('dw/order/OrderMgr');

    var order = OrderMgr.getOrder(orderNumber);

    return !empty(order) ? order.custom.yuansferTransactionNo : '';
};

/**
 * Get Reference by Order Number
 * @param {Integer} orderNumber to get Reference
 * @returns {string} ReferenceNo
 */
exports.getPaymentStatus = function (orderNumber) {
    const OrderMgr = require('dw/order/OrderMgr');

    var order = OrderMgr.getOrder(orderNumber);

    return !empty(order) ? order.custom.yuansferIsPaymentInReview : '';
};

