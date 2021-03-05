/* eslint-disable no-console */
/* eslint-disable no-alert */
/* globals yuansfer */
// v3

var cardIdInput = document.getElementById('yuansfer_source_id');
var cardNumberInput = document.getElementById('yuansfer_card_number');
var cardHolderInput = document.getElementById('yuansfer_card_holder');
var cardTypeInput = document.getElementById('yuansfer_card_type');
var cardBrandInput = document.getElementById('yuansfer_card_brand');
var cardExpMonthInput = document.getElementById('yuansfer_card_expiration_month');
var cardExpYearInput = document.getElementById('yuansfer_card_expiration_year');

var placeOrderButton = document.querySelector('button[name=submit]');
var forceSubmit = false;
var prUsed = false;

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
 * get yuansfer request payload
 * @param {string} vendor
 */
function getSecurePayPayload(vendor) {
    var merchantNo = document.getElementById('yuansfer_merchant_no').value;
    var storeNo = document.getElementById('yuansfer_store_no').value;
    var token = document.getElementById('yuansfer_token').value;
    var yuansferOrderNumberInput = document.getElementById('yuansfer_order_number').value;
    var yuansferCallbackURLInput = document.getElementById('yuansfer_home_url');
    var yuansferOrderAmountInput = document.getElementById('yuansfer_order_amount');
    var yuansferOrderCurrencyInput = document.getElementById('yuansfer_order_currency');
    var yuansferOrderNoteInput = document.getElementById('yuansfer_order_note');
    var yuansferOrderDescriptionInput = document.getElementById('yuansfer_order_description');
    var yuansferOrderGoodsInput = document.getElementById('yuansfer_order_items').value;
    var yuansferOrderSettleCurrencyInput = document.getElementById('yuansfer_order_settle_currency');

    var amountToPay = parseFloat(yuansferOrderAmountInput.value);
    var currencyCode = yuansferOrderCurrencyInput.value;
    // var settleCurrencyCode = yuansferOrderSettleCurrencyInput.value;
    var returnURL = yuansferCallbackURLInput.value;
    var terminal = '';
    terminal = 'ONLINE';
    var reference = token + yuansferOrderNumberInput;
    yuansferCallbackURLInput = returnURL + '?transactionNo={transactionNo}&amount={amount}&status={status}&reference={reference}';
    var param = {
        merchantNo: merchantNo,
        storeNo: storeNo,
        amount: amountToPay,
        currency: currencyCode,
        settleCurrency: currencyCode,
        vendor: vendor,
        ipnUrl: returnURL,
        callbackUrl: returnURL,
        terminal: terminal,
        reference: reference,
        description: yuansferOrderDescriptionInput,
        note: yuansferOrderNoteInput,
        goodsInfo: yuansferOrderGoodsInput
    };
    var verifySign = calculateVerifySign(param, token);
    param.verifySign = verifySign;
    return param;
}

/**
 * validate on email format
 * @param {string} email
 */
function notEmailFormat(email) {
     /**
       * @return {boolean}
      */
    const reg = /^[\w.%+-]+@[\w.-]+\.[\w]{2,6}$/;
    return !reg.test(email);
}

/**
 * check if field is valid
 * @param {element} seletor
 */
function checkFieldNotPass(seletor) {
    // check fields
    var flag = false;
    var contactInfos = $(seletor);
    for (let info of contactInfos) {
        if (!info.value) {
            flag = true;
            break;
        } else if (info.name && info.name.indexOf('email') !== -1) {
            flag = notEmailFormat(info.value);
            if (flag) {
                break;
            }
        }
    }
    return flag;
}

document.querySelector('button.submit-payment').addEventListener('click', function (event) {
    if (checkFieldNotPass('#dwfrm_billing .contact-info-block input')) {
        return false;
    }
    $.spinner().start();

    let yuansferReturnURL = document.getElementById('yuansfer_return_url_in_checkout').value;
    var activeTabId = $('.tab-pane.active').attr('id');
    var paymentInfoSelector = '#dwfrm_billing .' + activeTabId + ' .payment-form-fields input.form-control';
    var selectedPaymentMethod = $(paymentInfoSelector).val();
    window.localStorage.setItem('yuansfer_payment_method', selectedPaymentMethod);
    document.getElementById('dwfrm_billing').submit();
    window.location.replace(yuansferReturnURL);
    $.spinner().stop();
});

/**
 * Get Yuansfer global params
 */
function getGlobalParams() {
    var selectedPaymentMethod = window.localStorage.getItem('yuansfer_payment_method');
    // var params = getSecurePayPayload();
    let params;

    switch (selectedPaymentMethod) {
        case 'YUANSFER_CREDITCARD':

            params = getSecurePayPayload('creditcard');
            break;
        case 'YUANSFER_WECHATPAY':

            // params.vendor = "wechatpay";
            params = getSecurePayPayload('wechatpay');
            break;
        case 'YUANSFER_ALIPAY':
            params = getSecurePayPayload('alipay');
            break;
        case 'YUANSFER_DANA':

            params = getSecurePayPayload('dana');
            break;
        case 'YUANSFER_ALIPAYHK':

            params = getSecurePayPayload('alipay_hk');
            break;
        case 'YUANSFER_GCASH':

            params = getSecurePayPayload('gcash');
            break;
        case 'YUANSFER_KAKAOPAY':

            params = getSecurePayPayload('kakaopay');
            break;
        case 'YUANSFER_PAYPAL':

            params = getSecurePayPayload('paypal');
            break;
        default:

            alert('Unknown payment method');
    }
    return JSON.stringify(params);
}

document.querySelector('button.place-order').addEventListener('click', function (event) {
    if (forceSubmit) {
        forceSubmit = false;
        return;
    }
    event.preventDefault();
    event.stopPropagation();

    var currentParams = getGlobalParams();
    var token = $('[name="csrf_token"]').val();
    var form = $(this);
    $.ajax({
        url: document.getElementById('beforePaymentAuthURL').value,
        type: 'POST',
        dataType: 'json',
        headers: {
            'X-Requested-With': 'XMLHttpRequest',
            params: currentParams
        },
        data: {
            csrf_token: token
        }
    }).done(function (json) {
        if (json.ret_code == '000100') {
            forceSubmit = true;
            form.trigger('click');
        } else if (json.error) {
            alert(json.error.message);
        } else {
            alert(json.ret_msg);
        }
    }).fail(function (msg) {
        if (msg.responseJSON.redirectUrl) {
            window.location.href = msg.responseJSON.redirectUrl;
        } else {
            alert(msg.error);
        }
    });
});

var ready = (callback) => {
    if (document.readyState !== 'loading') {
        callback();
    } else {
        document.addEventListener('DOMContentLoaded', callback);
    }
};

ready(() => {
    // eslint-disable-next-line no-unused-vars
    document.querySelector('.payment-summary .edit-button').addEventListener('click', (e) => {
        var list = document.querySelector('.payment-form').querySelectorAll('.tab-pane');
        for (var i = 0; i < list.length; ++i) {
            list[i].classList.remove('active');
        }

        var activePaymentMethod = document.getElementsByClassName('nav-link credit-card-tab active');
        if (activePaymentMethod.length) {
            var selectedPaymentContent = document.getElementById(activePaymentMethod[0].attributes.href.value.replace('#', ''));

            if (selectedPaymentContent) {
                selectedPaymentContent.classList.add('active');
            }
        }
    });

    // eslint-disable-next-line no-unused-vars
    document.querySelector('.shipping-summary .edit-button').addEventListener('click', (e) => {
        var list = document.querySelector('.payment-form').querySelectorAll('.tab-pane');
        for (var i = 0; i < list.length; ++i) {
            list[i].classList.remove('active');
        }

        var activePaymentMethod = document.getElementsByClassName('nav-link credit-card-tab active');
        if (activePaymentMethod.length) {
            var selectedPaymentContent = document.getElementById(activePaymentMethod[0].attributes.href.value.replace('#', ''));
            if (selectedPaymentContent) {
                selectedPaymentContent.classList.add('active');
            }
        }
    });
});

