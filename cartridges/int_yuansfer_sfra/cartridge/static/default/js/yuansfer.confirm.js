/* eslint-disable no-console */
/* eslint-disable no-alert */
// v3
var orderNumber = document.getElementById('yuansfer_order_number').value;
var merchantNo = document.getElementById('yuansfer_merchant_no').value;
var storeNo = document.getElementById('yuansfer_store_no').value;
var token = document.getElementById('yuansfer_token').value;
var _redirectUrl = document.getElementById('yuansfer_home_show').value;

/**
 * Used to calculate verify sign
 * @param {string} contents
 * @param {string} token
 */
function calculateVerifySign(contents, token) {
    // 1.sort parameter，connect them with a=1&b=2.. format
    var sortArray = [];

    Object.keys(contents).sort().forEach(function (k) {
        if (contents[k] || contents[k] === false) {
            sortArray.push(k + '=' + contents[k]);
        }
    });

    // md5 encrypt token，append result after sortArray
    sortArray.push(MD5(token));

    var tempStr = sortArray.join('&');

    // md5 encrypt tempStr to get verify sign
    var verifySign = MD5(tempStr);

    return verifySign;
}

/**
 * Get Yuansfer request parameter
 */
var _GetYuansferParams = function () {
    var params = {
        merchantNo: merchantNo,
        storeNo: storeNo,
        reference: token + orderNumber
    };
    var verifySign = calculateVerifySign(params);
    params.verifySign = verifySign;
    return params;
};

/**
 * Redirect to home page once the payment is done
 * @param {string} _status
 */
var _RedirectCallback = function (_status) {
    var _n = 1;
    var m = setInterval(function () {
        _n--;
        if (_n == 0) {
            clearInterval(m);
            window.location.href = _redirectUrl + '?status=' + _status;
        }
    }, 3000);
};

/**
 * polling function
 * @param {string} _queryUrl
 * @param {string} _redirectUrl
 */
var _Polling = function (_queryUrl, _redirectUrl) {
    var _num = 500;
    var params = _GetYuansferParams();
    var queryUrl = document.getElementById('yuansfer_handle_confirm_url').value;
    var t = setInterval(function () {
        _num--;
        $.ajax({
            url: queryUrl,
            type: 'POST',
            contentType: 'application/json; charset=utf-8',
            data: params
        }).done(function (json) {
            if (json != null) {
                var _ret_code = json.ret_code;
                var _ret_msg = json.ret_msg;
                if (_ret_code == '000100') {
                    var _status = json.result.status;
                    if (_status == 'fail') {
                        clearInterval(t);
                    } else if (_status == 'success') {
                        clearInterval(t);
                        _RedirectCallback(_status);
                    } else {
                                // continue
                    }
                } else if (_ret_code = '000000') {
                    console.log(_ret_msg);
                }
            } else {
                console.log('query error');
            }
        }).fail(function (err) {
            console.log(err);
        });
        if (_num == 0) {
            clearInterval(t);
        }
        // }
    }, 4000);
};

/**
 * trigger function when dom is ready
 * @param {function} fn
 */
function ready(fn) {
    if (document.addEventListener) {
        // Regular browser
        document.addEventListener('DOMContentLoaded', function () {
            // prevent repeat event
            document.removeEventListener('DOMContentLoaded', arguments.callee, false);
            // execute function
            fn;
        }, false);
    } else if (document.attachEvent) {
        // IE Browser
        document.attachEvent('onreadystatechange', function () {
            if (document.readyState == 'complete') {
                document.detachEvent('onreadystatechange', arguments.callee);
                // execute function
                fn;
            }
        });
    }
}

ready(_Polling());

