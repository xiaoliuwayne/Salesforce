/* eslint-env es6 */

'use strict';

/* API Includes */
const LocalServiceRegistry = require('dw/svc/LocalServiceRegistry');
const yuansferWallet = require('../models/yuansferWallet');
const yuansferHelper = require('*/cartridge/scripts/yuansfer/helpers/yuansferHelper');

/**
 * Traverses a payload object to collect parameters and values to be passed
 * as key/value pairs either as query string or application/x-www-form-urlencoded
 * body.
 *
 * @param {Object} collector - An object to collect key/value pairs. Must provide
 *   addParam(name, value) method. Could be dw.svc.Service.
 * @param {Object} payload - Payload to collect parameters from. Can be acutal
 *   payload or an object containing query string parameters.
 * @param {string} prefix - Prefix to append to parameter names. Used recursively,
 *   not needed for the intial call.
 */
function collectParams(collector, payload, prefix) {
    if (payload && typeof payload === 'object') {
        Object.keys(payload).forEach(function (key) {
            let paramName = prefix && prefix.length ? prefix + '[' + (Array.isArray(payload) ? '' : key) + ']' : key;
            let paramValue = payload[key];

            if (paramValue === null || typeof paramValue === 'undefined') {
                paramValue = '';
            }

            if (paramValue && typeof paramValue === 'object') {
                collectParams(collector, paramValue, paramName);
            } else {
                collector.addParam(paramName, paramValue);
            }
        });
    }
}

/**
 * Converts a payload object into a application/x-www-form-urlencoded string
 *
 * @param {type} payload - Payload object
 * @return {string} - URL encoded string for that payload
 */
function payloadToBody(payload) {
    if (payload) {
        const payloadParamsCollector = {
            params: [],
            addParam: function (name, value) {
                this.params.push(encodeURIComponent(name) + '=' + encodeURIComponent(value));
            }
        };

        collectParams(payloadParamsCollector, payload);

        if (payloadParamsCollector.params.length) {
            return payloadParamsCollector.params.join('&');
        }
    }

    return null;
}

/**
 * Replaces credit card number (a number following card_number=) in a given
 * string with a masked version, keeping only the last 4 digits.
 *
 * @param {type} msg - The string in which to replace the card number.
 * @return {string} - The same string with only card number masked.
 */
function maskCardNumber(msg) {
    if (msg && msg.length) {
        const matches = msg.match(cardNumberRegex);

        if (matches && matches.length > 1) {
            const matched = matches[0];
            const toMask = matches[1];
            const masked = (new Array(toMask.length - 3)).join('*') + toMask.substr(-4);
            const stringToReplace = matched.replace(toMask, masked);
            return msg.replace(matched, stringToReplace);
        }
    }

    return msg;
}

const cvcRegex = /card.{1,6}cvc[^=]*=(\d*)/;

/**
 * Replaces CVC number (a number following card_cvc=) in a given
 * string with asterisks.
 *
 * @param {type} msg - The string in which to replace the cvc.
 * @return {string} - The same string with only cvc masked.
 */
function maskCVC(msg) {
    if (msg && msg.length) {
        const matches = msg.match(cvcRegex);

        if (matches && matches.length > 1) {
            const matched = matches[0];
            const toMask = matches[1];
            const masked = (new Array(toMask.length + 1)).join('*');
            const stringToReplace = matched.replace(toMask, masked);
            return msg.replace(matched, stringToReplace);
        }
    }

    return msg;
}
/**
 * Creates a Local Services Framework service definition
 *
 * @returns {dw.svc.Service} - The created service definition.
 */
function getYuansferServiceDefinition() {
    return LocalServiceRegistry.createService('yuansfer.http.service', {

        /**
         * A callback function to configure HTTP request parameters before
         * a call is made to Yuansfer web service
         *
         * @param {dw.svc.Service} svc Service instance
         * @param {string} requestObject - Request object, containing the end point, query string params, payload etc.
         * @returns {string} - The body of HTTP request
         */
        createRequest: function (svc, requestObject) {
            const Site = require('dw/system/Site');

            svc.addHeader('Content-Type','application/x-www-form-urlencoded;charset=UTF-8');
            
            svc.addHeader('User-Agent', 'Yuansfer-SFCC-LINK/19.6.0');

            var URL = "https://mapi.yuansfer.com/online/v3";
            URL += requestObject.endpoint;

            svc.setURL(URL);

            if (requestObject.httpMethod) {
                svc.setRequestMethod(requestObject.httpMethod);
            }

            if (requestObject.queryString) {
                collectParams(svc, requestObject.queryString);
            }

            if (requestObject.payload) {
                return payloadToBody(requestObject.payload);
            }
            return null;
        },

        /**
         * A callback function to parse Yuansfer web service response
         *
         * @param {dw.svc.Service} svc - Service instance
         * @param {dw.net.HTTPClient} httpClient - HTTP client instance
         * @returns {string} - Response body in case of a successful request or null
         */
        parseResponse: function (svc, httpClient) {
            return JSON.parse(httpClient.text);
        },

        mockCall: function (svc) {
            var mockResponsesHelper = require('./mockResponsesHelper');

            return mockResponsesHelper.getMockedResponse(svc);
        },


        /**
         * A callback that allows filtering communication URL, request, and response
         * log messages. Must be implemented to have messages logged on Production.
         *
         * @param {string} msg - The original message to log.
         * @returns {string} - The original message itself, as no sensitive data is
         *   communicated.
         */
        filterLogMessage: function (msg) {
            return maskCVC(maskCardNumber(msg));
        }
    });
}

exports.getYuansferServiceDefinition = getYuansferServiceDefinition;

/**
 * Creates an Error and appends web service call result as callResult
 *
 * @param {dw.svc.Result} callResult - Web service call result
 * @return {Error} - Error created
 */
function YuansferServiceError(callResult) {
    var message = 'Yuansfer web service call failed';
    if (callResult && callResult.errorMessage) {
        message += ': ' + callResult.errorMessage;
    }

    const err = new Error(message);
    err.callResult = callResult;
    err.name = 'YuansferServiceError';

    return err;
}

/*
* @param {Object} requestObject - An object having details for the request to
*   be made, including endpoint, payload etc.
* @return {dw.svc.Result} - Result returned by the call.
*/
function callService(requestObject) {
   if (!requestObject) {
       throw new Error('Required requestObject parameter missing or incorrect.');
   }

   const callResult = getYuansferServiceDefinition().call(requestObject);

    if (!callResult.ok) {
        throw new YuansferServiceError(callResult);
    }

    return callResult.object;
}

// https://mapi.yuansfer.com/online/v3/secure-pay
exports.securePay = {
    create: function (params) {
        var requestObject = {
            endpoint: '/secure-pay',
            httpMethod: 'POST',
            payload: params
        };
        return callService(requestObject);
    },
};

// https://mapi.yuansfer.com/app-data-search/v3/cancel
exports.refunds = {
    create: function (params) {
        var requestObject = {
            endpoint: '/cancel',
            httpMethod: 'POST',
            payload: params
        };

        return callService(requestObject);
    },
};
