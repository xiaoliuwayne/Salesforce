/* eslint-env es6 */
/* global */

'use strict';

const Status = require('dw/system/Status');

/**
 * A hook to authorize all payment methods other than credit/debit card.
 *
 * Hosted payment page is not to be supported by the cartridge. The following
 * page gives details as to how to customize it if it is ever to
 * be added:
 * https://documentation.b2c.commercecloud.salesforce.com/DOC1/index.jsp?topic=%2Fcom.demandware.dochelp%2FCustomerServiceCenter%2FConfiguringAHostedPaymentPage.html&cp=0_10_12_0
 *
 * @param {dw.order.Order} order - Order for which payment authorization needs
 *   to be processed.
 * @param {dw.order.OrderPaymentInstrument} paymentInstrument - Payment instrument
 *   to obtain authorization for.
 * @return {sw.system.Status} - Status of the authorization, Status.OK should be
 *   returned only if it succeeded.
 */
exports.authorize = function (order, paymentInstrument) { // eslint-disable-line
    return new Status(Status.ERROR, 'Not supported');
};
