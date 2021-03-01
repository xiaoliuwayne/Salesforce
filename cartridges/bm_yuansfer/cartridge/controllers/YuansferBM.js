'use strict';

/* API Includes */
var ISML = require('dw/template/ISML');

/* Cheyuansferut.com Helper functions */
var yuansferHelper = require('~/cartridge/scripts/helpers/yuansferHelper');

/**
 * Get the transactions list
 */
function listTransactions() {
    // Render the template
    ISML.renderTemplate('transactions/list');
}

/**
 * Get the transactions table data
 */
function getTransactionsData() {
    // Prepare the output array
    var data = yuansferHelper.getYuansferTransactions();

    // Send the AJAX response
    // eslint-disable-next-line
    response.writer.println(JSON.stringify(data));
}

/**
 * Perform a remote Hub Call
 */
function remoteCall() {
    // Get the transaction currency
    var orderNumber = request.httpParameterMap.get('orderNumber').value;
    var params = {
        merchantNo: request.httpParameterMap.get('merchantNo').value,
        storeNo: request.httpParameterMap.get('storeNo').value,
        refundAmount: request.httpParameterMap.get('refundAmount').value,
        currency: request.httpParameterMap.get('currency').value,
        settleCurrency: request.httpParameterMap.get('settleCurrency').value,
        transactionNo: request.httpParameterMap.get('transactionNo').value,
        verifySign: request.httpParameterMap.get('verifySign').value
    };

    // Log the payment request data
    yuansferHelper.log(
        yuansferHelper._('yuansfer.request.data', 'yuansfer') + ' - ' + 'refund',
        params
    );

    // Perform the request
    var gResponse = yuansferHelper.createRefund(params);

    // Log the payment response data
    yuansferHelper.log(
        yuansferHelper._('yuansfer.response.data', 'yuansfer') + ' - ' + 'refund',
        gResponse
    );
    if (gResponse.ret_code == '000100') {
        var amount = gResponse.result.refundAmount;
        yuansferHelper.paymentRefunded({
            orderNumber: orderNumber,
            amount: amount,
            currency: params.currency
        });
    }

    // Return the response
    // eslint-disable-next-line
    if(gResponse){
        response.writer.println(JSON.stringify(gResponse));
    }
    
}

/*
* Web exposed methods
*/

listTransactions.public = true;
getTransactionsData.public = true;
remoteCall.public = true;

exports.ListTransactions = listTransactions;
exports.GetTransactionsData = getTransactionsData;
exports.RemoteCall = remoteCall;
