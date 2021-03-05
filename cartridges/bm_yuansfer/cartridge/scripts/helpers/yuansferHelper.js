'use strict';

/* API Includes */
var SystemObjectMgr = require('dw/object/SystemObjectMgr');
var PaymentMgr = require('dw/order/PaymentMgr');
var PaymentTransaction = require('dw/order/PaymentTransaction');
var Resource = require('dw/web/Resource');
var Logger = require('dw/system/Logger');
var Transaction = require('dw/system/Transaction');
var Money = require('dw/value/Money');
var OrderMgr = require('dw/order/OrderMgr');

/**
 * Helper functions for the cartridge integration.
 */
var YuansferHelper = {
    /**
     * Handles string translation with language resource files.
     * @param {string} strValue The strin to translate
     * @param {string} strFile The translation file
     * @returns {string} Retuns the translated string
     */
    _: function(strValue, strFile) {
        return Resource.msg(strValue, strFile, null);
    },

    /**
     * Get the orders.
     * @returns {array} Retuns the orders array
     */
    getYuansferOrders: function() {
        // Prepare the output array
        var data = [];

        // Query the orders
        var result = SystemObjectMgr.querySystemObjects('Order', '', 'creationDate desc');

        // Loop through the results
        while (result.hasNext()) {
            var item = result.next();

            // Get the payment instruments
            var paymentInstruments = item.getPaymentInstruments().toArray();

            // Loop through the payment instruments
            for (var i = 0; i < paymentInstruments.length; i++) {
                if (this.isYuansferItem(paymentInstruments[i].paymentMethod) && !this.containsObject(item, data)) {
                    data.push(item);
                }
            }
        }

        return data;
    },

    /**
     * Get the transactions.
     * @returns {array} Retuns the transactions array
     */
    getYuansferTransactions: function() {
        // Prepare the output array
        var data = [];

        // Query the orders
        var result = this.getYuansferOrders();

        // Loop through the results
        var i = 1;
        for (var j = 0; j < result.length; j++) {
            // Get the payment instruments
            var paymentInstruments = result[j].getPaymentInstruments().toArray();

            // Loop through the payment instruments
            for (var k = 0; k < paymentInstruments.length; k++) {
                // Get the payment transaction
                var paymentTransaction = paymentInstruments[k].getPaymentTransaction();
                var transactionNo = OrderMgr.getOrder(result[j].orderNo, result[j].orderToken).custom.yuansferTransactionNo;

                // Add the payment transaction to the output
                if (!this.containsObject(paymentTransaction, data) && this.isTransactionNeeded(paymentTransaction, paymentInstruments[k], transactionNo)) {
                    // Build the row data

                    var row = {
                        id: i,
                        order_no: result[j].orderNo,
                        transaction_id: transactionNo,
                        payment_id: paymentTransaction.paymentInstrument.paymentMethod,
                        opened: paymentTransaction.custom.yuansferTransactionOpened,
                        amount: paymentTransaction.amount.value,
                        currency: paymentTransaction.amount.currencyCode,
                        creation_date: paymentTransaction.getCreationDate().toDateString(),
                        type: paymentTransaction.type.displayValue,
                        processor: this.getProcessorId(paymentInstruments[k]),
                        refundable_amount: 0,
                        data_type: paymentTransaction.type.toString(),
                    };

                    // Calculate the refundable amount
                    var condition1 = row.data_type === PaymentTransaction.TYPE_CAPTURE;
                    var condition2 = row.opened !== false;
                    if (condition1 && condition2) {
                        row.refundable_amount = this.getRefundableAmount(paymentInstruments);
                    }

                    if (row.refundable_amount === '0.00' && row.transaction_id) {
                        row.type = 'REFUNDED';
                        row.data_type = 'REFUNDED';
                    }
                    // Add the transaction
                    data.push(row);
                    i++;
                }
            }
        }

        return data;
    },

    /**
     * Check if a capture transaction can allow refunds.
     * @param {array} paymentInstruments The paymentInstruments array
     * @returns {number} The refundable amount
     */
    getRefundableAmount: function(paymentInstruments) {
        // Prepare the totals
        var totalRefunded = 0;
        var totalCaptured = 0;

        // Loop through the payment instruments
        // eslint-disable-next-line
        for (var i = 0; i < paymentInstruments.length; i++) {
            // Get the payment transaction
            var paymentTransaction = paymentInstruments[i].getPaymentTransaction();

            // Calculate the total refunds
            if (paymentTransaction.type.toString() === PaymentTransaction.TYPE_CREDIT) {
                totalRefunded += parseFloat(paymentTransaction.amount.value);
            }

            // Calculate the total captures
            if (paymentTransaction.type.toString() === PaymentTransaction.TYPE_CAPTURE) {
                totalCaptured += parseFloat(paymentTransaction.amount.value);
            }
        }

        // Return the final amount
        var finalAmount = totalCaptured - totalRefunded;
        return finalAmount.toFixed(2);
    },

    /**
     * Checks if a transaction should be returned in the reaults.
     * @param {Object} paymentTransaction The paymentTransaction object
     * @param {Object} paymentInstrument The paymentInstrument object
     * @param {Object} transactionNo The transaction number
     * @returns {boolean} The status of the current transaction
     */
    isTransactionNeeded: function(paymentTransaction, paymentInstrument, transactionNo) {
        // Get an optional transaction id
        // eslint-disable-next-line
        var tid = request.httpParameterMap.get('tid').stringValue;

        // Return true only if conditions are met
        var condition1 = (tid && transactionNo === tid) || !tid;
        var condition2 = this.isYuansferItem(paymentInstrument.paymentMethod);
        var condition3 = this.isYuansferItem(this.getProcessorId(paymentInstrument));
        var condition5 = paymentTransaction.custom.yuansferOrderNumber && paymentTransaction.custom.yuansferOrderNumber !== '';

        if (condition1 && condition2 && condition3 && condition5) {
            return true;
        }

        return false;
    },

    /**
     * Checks if a payment instrument is.
     * @param {Object} item The payment instrument
     * @returns {boolean} The status of the current payment instrument
     */
    isYuansferItem: function(item) {
        return item.length > 0 && (item.indexOf('YUANSFER_WECHATPAY') >= 0 || item.indexOf('YUANSFER_ALIPAY') >= 0 || item.indexOf('YUANSFER_KAKAOPAY') >= 0 || item.indexOf('YUANSFER_GCASH') >= 0
        || item.indexOf('YUANSFER_ALIPAYHK') >= 0 || item.indexOf('YUANSFER_DANA') >= 0 || item.indexOf('YUANSFER_CREDITCARD') >= 0 || item.indexOf('YUANSFER_APM') >= 0 || item.indexOf('YUANSFER_PAYPAL') >= 0);
    },

    /**
     * Get the processor ID for a payment instrument.
     * @param {Object} instrument The payment instrument
     * @returns {string} The payment instrument Id
     */
    getProcessorId: function(instrument) {
        var paymentMethod = PaymentMgr.getPaymentMethod(instrument.getPaymentMethod());
        if (paymentMethod) {
            if (paymentMethod.getPaymentProcessor()) {
                return paymentMethod.getPaymentProcessor().getID();
            }
        }
        return '';
    },

    /**
     * Checks if an object already exists in an array.
     * @param {Object} obj The object
     * @param {array} list The list of objects to parse
     * @returns {boolean} The status of the current object
     */
    containsObject: function(obj, list) {
        var i;
        for (i = 0; i < list.length; i++) {
            if (list[i] === obj) {
                return true;
            }
        }

        return false;
    },

    /**
     * Writes gateway information to the website's custom log files.
     * @param {string} dataType The data type
     * @param {Object} gatewayData The gateway data
     */
    log: function(dataType, gatewayData) {
        if ((gatewayData)) {
            // Get the logger
            var logger = Logger.getLogger('yuansferdebug');

            if (logger) {
                logger.debug(this._('yuansfer.gateway.name', 'yuansferbm') + ' ' + dataType + ' : {0}', gatewayData);
            }
        }
    },

    /**
     * Create an HTTP client to handle request to refund.
     * @param {Object} params The request data
     * @returns {Object} The HTTP response
     */
    createRefund: function(params) {
        var yuansferService = require('*/cartridge/scripts/services/yuansferService');
        var resp = yuansferService.refund.create(params);

        return resp;
    },

    /**
     * Get the HTTP service.
     * @param {string} serviceId The service Id
     * @returns {Object} The service instance
     */
    getService: function(serviceId) {
        var parts = serviceId.split('.');
        var entity = parts[1];
        var action = parts[2];
        var mode = parts[3];
        var svcFile = entity + action.charAt(0).toUpperCase() + action.slice(1);
        var svcClass = require('~/cartridge/scripts/services/' + svcFile);

        return svcClass[mode]();
    },

    /**
     *  Change refund status
     * @param {Object} params parameters
     */
    paymentRefunded: function(params) {
        // Load the order
        var order = OrderMgr.searchOrder('orderNo={0}', params.orderNumber);

        // Get the payment processor id
        var paymentProcessorId = order.paymentInstrument.paymentTransaction.paymentProcessor.ID;
        var paymentProcessor = order.paymentInstrument.paymentTransaction.paymentProcessor;
        // Create the refunded transaction
        var paymentInstrument;
        var amount = new Money(params.amount, params.currency);
        Transaction.wrap(function() {
            paymentInstrument = order.createPaymentInstrument(paymentProcessorId, amount);

            paymentInstrument.paymentTransaction.transactionID = params.orderNumber;
            paymentInstrument.paymentTransaction.paymentProcessor = paymentProcessor;
            paymentInstrument.paymentTransaction.custom.yuansferOrderNumber = params.orderNumber;
            paymentInstrument.paymentTransaction.custom.yuansferTransactionOpened = false;
            paymentInstrument.paymentTransaction.setType(PaymentTransaction.TYPE_CREDIT);

            var setPaymentPaymentInstruments = order.getPaymentInstruments().toArray();
            var amountPaid = 0;
            var orderTotal = order.getTotalGrossPrice().getValue();

            for (var i = 0; i < setPaymentPaymentInstruments.length; i++) {
                var paymentTransaction = setPaymentPaymentInstruments[i].paymentTransaction;
                if (paymentTransaction.type.value === 'CAPTURE') {
                    amountPaid += paymentTransaction.amount.value;
                    if (amountPaid > orderTotal) {
                        amountPaid = orderTotal;
                    }
                } else if (paymentTransaction.type.value === 'CREDIT') {
                    amountPaid -= paymentTransaction.amount.value;
                }
            }
            var Order = require('dw/order/Order');
            if (amountPaid === orderTotal) {
                order.setPaymentStatus(Order.PAYMENT_STATUS_PAID);
            } else if (amountPaid >= 0.01) {
                order.setPaymentStatus(Order.PAYMENT_STATUS_PARTPAID);
            } else {
                order.setPaymentStatus(Order.PAYMENT_STATUS_NOTPAID);
                OrderMgr.cancelOrder(order);
            }
        });
    },

    // Get Yuansfer token from custom preference
    getYuansferToken: function() {
        return require('dw/system/Site').current.preferences.custom.yuansferToken;
    },

    // Get Yuansfer store number from custom preference
    getYuansferStoreNo: function() {
        return require('dw/system/Site').current.preferences.custom.yuansferStoreNo;
    },

    // Get Yuansfer merchant number from custom preference
    getYuansferMerchantNo: function() {
        return require('dw/system/Site').current.preferences.custom.yuansferMerchantNo;
    },

    // Get Yuansfer enable status from custom preference
    isYuansferEnabled: function() {
        var Site = require('dw/system/Site');
        return Site.current.preferences.custom.yuansferEnable;
    },
};

/*
 * Module exports
 */
module.exports = YuansferHelper;
