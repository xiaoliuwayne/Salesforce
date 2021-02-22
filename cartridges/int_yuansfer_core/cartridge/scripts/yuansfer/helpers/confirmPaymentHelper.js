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

function decodeFormParams(params) {
    var pairs = params.split('&'),
        result = {};
  
    for (var i = 0; i < pairs.length; i++) {
      var pair = pairs[i].split('='),
          key = decodeURIComponent(pair[0]),
          value = decodeURIComponent(pair[1]),
          isArray = /\[\]$/.test(key),
          dictMatch = key.match(/^(.+)\[([^\]]+)\]$/);
  
      if (dictMatch) {
        key = dictMatch[1];
        var subkey = dictMatch[2];
  
        result[key] = result[key] || {};
        result[key][subkey] = value;
      } else if (isArray) {
        key = key.substring(0, key.length-2);
        result[key] = result[key] || [];
        result[key].push(value);
      } else {
        result[key] = value;
      }
    }
  
    return result;
}

exports.processIncomingNotification = function (params) {
    var json = decodeFormParams(params);
    try {

        
        var success = Transaction.wrap(function () {
            if(json==null || json.status == false || json.transactionNo == null){
                return false;
            }else{
                var yuansferHelper=require('*/cartridge/scripts/yuansfer/helpers/yuansferHelper');
                var token = yuansferHelper.getYuansferToken();
                var orderId = json.reference.replace(token,'');
                var order = OrderMgr.getOrder(orderId);
                const Order = require('dw/order/Order');
                if(!order){
                    return false;
                }else{
                    if (order.status === Order.ORDER_STATUS_CREATED) {
                        OrderMgr.placeOrder(order);
                    }

                    order.custom.yuansferIsPaymentInReview = false; // eslint-disable-line no-param-reassign
                    order.setPaymentStatus(Order.PAYMENT_STATUS_PAID);
                    order.setExportStatus(Order.EXPORT_STATUS_READY);

                    return true;
                }
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
