/* eslint-env es6 */
/* eslint-disable no-plusplus */
/* global request, response */

'use strict';

// /* global request, response */

const Mac = require('dw/crypto/Mac');
const Encoding = require('dw/crypto/Encoding');
const Transaction = require('dw/system/Transaction');
const CustomObjectMgr = require('dw/object/CustomObjectMgr');
const Site = require('dw/system/Site');
const Logger = require('dw/system/Logger');
const OrderMgr = require('dw/order/OrderMgr');
const Order = require('dw/order/Order');


exports.processIncomingNotification = function () {

    const payload = request.httpParameterMap.requestBodyAsString;
    const stripeSignature = request.httpHeaders['stripe-signature'];

    try {
    
        var json = JSON.parse(payload);
        var success = Transaction.wrap(function () {
            if(json==null || json.status == false || json.transactionNo == null){
                return false;
            }else{
                var yuansferHelper=require('*/cartridge/scripts/yuansfer/helpers/yuansferHelper');
                var token = yuansferHelper.getYuansferToken();
                var orderId = json.reference.replace(token,'');
                var order = OrderMgr.getOrder(orderId);
                const Order = require('dw/order/Order');
                Transaction.wrap(function () {
                    if (testorder.status === Order.ORDER_STATUS_CREATED) {
                        OrderMgr.placeOrder(testorder);
                    }

                    order.custom.yuansferIsPaymentInReview = false; // eslint-disable-line no-param-reassign
                    order.custom.transactionNo =json.transactionNo;
                    order.setPaymentStatus(Order.PAYMENT_STATUS_PAID);
                    order.setExportStatus(Order.EXPORT_STATUS_READY);
                });
                return true;
            }
        });

        if (!success) {
            response.setStatus(500);
            return false;
        }
    } catch (e) {
        Logger.error(e);
        response.setStatus(500);
        return false;
    }

    response.setStatus(200);
    return true;
};
