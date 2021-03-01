'use strict';

/* API Includes */
var LocalServiceRegistry = require('dw/svc/LocalServiceRegistry');

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
        
            var URL =  svc.configuration.credential.URL;
            
            URL += requestObject.endpoint;

            svc.setURL(URL);

            if (requestObject.httpMethod) {
                svc.setRequestMethod(requestObject.httpMethod);
            }

            if (requestObject.queryString) {
                collectParams(svc, requestObject.queryString);
            }

            if (requestObject.payload) {
                var bodyParam = payloadToBody(requestObject.payload);
                return bodyParam;
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

// https://mapi.yuansfer.com/app-data-search/v3/refund
exports.refund = {
    create: function (params) {
        var requestObject = {
            endpoint: '/app-data-search/v3/refund',
            httpMethod: 'POST',
            payload: params
        };
        return callService(requestObject);
    },
}