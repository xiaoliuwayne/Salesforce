/* eslint-disable no-console */
/* eslint-disable no-alert */
/* globals yuansfer */
// v3

var newCardFormContainer = document.getElementById('new-card-form-container');
var cardIdInput = document.getElementById('yuansfer_source_id');
var cardNumberInput = document.getElementById('yuansfer_card_number');
var cardHolderInput = document.getElementById('yuansfer_card_holder');
var cardTypeInput = document.getElementById('yuansfer_card_type');
var cardBrandInput = document.getElementById('yuansfer_card_brand');
var cardExpMonthInput = document.getElementById('yuansfer_card_expiration_month');
var cardExpYearInput = document.getElementById('yuansfer_card_expiration_year');

var placeOrderButton = document.querySelector('button[name=submit]');
var forceSubmit = false;

function isSavedCard() {
    return newCardFormContainer && newCardFormContainer.style.display === 'none';
}

function copySelectedSaveCardDetails() {
    var savedCards = document.querySelectorAll('input[name=saved_card_id]');

    for (var i = 0; i < savedCards.length; i++) {
        var savedCard = savedCards[i];
        if (savedCard.checked) {
            cardIdInput.value = savedCard.value;
            cardNumberInput.value = savedCard.dataset.cardnumber;
            cardHolderInput.value = savedCard.dataset.cardholder;
            cardTypeInput.value = savedCard.dataset.cardtype;
            cardExpMonthInput.value = savedCard.dataset.cardexpmonth;
            cardExpYearInput.value = savedCard.dataset.cardexpyear;
            prUsedInput.value = '';

            return true;
        }
    }

    return false;
}

function copyNewCardDetails(paymentMethod) {
    cardIdInput.value = paymentMethod.id;

    if (paymentMethod.card) {
        cardNumberInput.value = '************' + paymentMethod.card.last4;
        cardTypeInput.value = '';
        cardBrandInput.value = paymentMethod.card.brand;
        cardExpMonthInput.value = paymentMethod.card.exp_month;
        cardExpYearInput.value = paymentMethod.card.exp_year;
    }

    cardHolderInput.value = paymentMethod.billing_details && paymentMethod.billing_details.name;
    prUsedInput.value = '';
}

function initNewCardForm() {
    var postalCodeEl = document.querySelector('input[name$="_postal"]');
    cardElement = elements.create('card', { value: { postalCode: postalCodeEl.value }, style: JSON.parse(document.getElementById('yuansferCardFormStyle').value) });
    cardElement.mount('#card-element');

    postalCodeEl.addEventListener('change', function (event) {
        cardElement.update({ value: { postalCode: event.target.value } });
    });

    var switchToSavedCardsLink = document.getElementById('switch-to-saved-cards');
    if (switchToSavedCardsLink) {
        switchToSavedCardsLink.addEventListener('click', function () {
            newCardFormContainer.style.display = 'none';
            savedCardsFormContainer.style.display = 'block';
        });
    }
}

function initSavedCards() {
    var switchToNewCardLink = document.getElementById('switch-to-add-card');
    if (switchToNewCardLink) {
        switchToNewCardLink.addEventListener('click', function () {
            newCardFormContainer.style.display = 'block';
            savedCardsFormContainer.style.display = 'none';
        });
    }
}

function initIdeal() {
    idealBankElement = elements.create('idealBank', { style: JSON.parse(document.getElementById('yuansferIdealElementStyle').value) });

    idealBankElement.mount('#ideal-bank-element');
}

function populateBillingData(pr) {
    var payerName = pr.payerName;
    if (payerName) {
        var payerNameSplit = payerName.split(' ');

        if (payerNameSplit.length > 1) {
            var firstName = payerNameSplit[0];
            var lastName = payerNameSplit[1];

            document.querySelector('input[name$="_firstName"]').value = firstName;
            document.querySelector('input[name$="_lastName"]').value = lastName;
        } else {
            document.querySelector('input[name$="_firstName"]').value = payerName;
            document.querySelector('input[name$="_lastName"]').value = payerName;
        }
    }

    document.querySelector('input[id="cardholder-name"]').value = payerName;
    document.querySelector('input[name$="_email_emailAddress"]').value = pr.payerEmail;
    document.querySelector('input[name$="_phone"]').value = pr.payerPhone;

    var selectCountryElement = document.querySelector('select[name$="_country"]');
    var prCountry = pr.paymentMethod.billing_details.address.country.toLowerCase();
    var prCountryExists = ($('#' + selectCountryElement.id + ' option[value=' + prCountry + ']').length > 0);

    if (prCountryExists) {
        selectCountryElement.value = prCountry;
    }

    document.querySelector('input[name$="_city"]').value = pr.paymentMethod.billing_details.address.city;
    document.querySelector('input[name$="_postal"]').value = pr.paymentMethod.billing_details.address.postal_code;
    document.querySelector('input[name$="_address1"]').value = pr.paymentMethod.billing_details.address.line1;
    document.querySelector('input[name$="_address2"]').value = pr.paymentMethod.billing_details.address.line2;

    var stateElement = document.querySelector('select[name$="_state"]') || document.querySelector('input[name$="_state"]');
    stateElement.value = pr.paymentMethod.billing_details.address.state;
}

function calculateVerifySign(contents,token) {
    //1.对参数进行排序，然后用a=1&b=2..的形式拼接
    var sortArray = [];

    Object.keys(contents).sort().forEach(function (k) {
      if (contents[k] || contents[k] === false) {
        sortArray.push(k + '=' + contents[k]);
      }
    });

    //对token进行md5，得到的结果追加到sortArray之后
    sortArray.push(MD5(token));

    var tempStr = sortArray.join('&');
    // console.log('tempStr:', tempStr);

    //对tempStr 再进行一次md5加密得到verifySign
    var verifySign = MD5(tempStr);
    // console.log('veirfySign:', verifySign)

    return verifySign;
  }

function getSecurePayPayload() {
    var merchantNo = document.getElementById('yuansfer_merchant_no').value;
    var storeNo = document.getElementById('yuansfer_store_no').value;
    var env = document.getElementById('yuansfer_env').value;
    var token = document.getElementById('yuansfer_token').value;
    var yuansferOrderNumberInput = document.getElementById('yuansfer_order_number').value;
    var yuansferReturnURLInput = document.getElementById('yuansfer_return_url');
    var yuansferOrderAmountInput = document.getElementById('yuansfer_order_amount');
    var yuansferOrderCurrencyInput = document.getElementById('yuansfer_order_currency');
    var yuansferOrderNoteInput = document.getElementById('yuansfer_order_note');
    var yuansferOrderDescriptionInput = document.getElementById('yuansfer_order_description');
    var yuansferOrderGoodsInput = document.getElementById('yuansfer_order_items').value;
    var yuansferOrderSettleCurrencyInput = document.getElementById('yuansfer_order_settle_currency');

    var amountToPay = parseFloat(yuansferOrderAmountInput.value);
    var currencyCode = yuansferOrderCurrencyInput.value;
    // var settleCurrencyCode = yuansferOrderSettleCurrencyInput.value;
    var returnURL = yuansferReturnURLInput.value;
    var terminal = "ONLINE";
    var param = {
        merchantNo: merchantNo,
        storeNo: storeNo,
        env: env,
        amount: amountToPay,                       
        currency: currencyCode,        
        vendor: null,                             
        callbackUrl: returnURL,      
        terminal: terminal,            
        reference: yuansferOrderNumberInput,          
        description: yuansferOrderDescriptionInput,      
        note: yuansferOrderNoteInput,                                 
        goodsInfo: yuansferOrderGoodsInput
    }
    var verifySign = calculateVerifySign(param,token);
    param["verifySign"] =verifySign;
    return param;
}

function processSecurePayResult(result) {
    if (result.ret_code!="000100") {
        alert(result.ret_msg);
    } else {

        document.getElementById('dwfrm_billing').submit();
    }
}

document.querySelector('button.submit-payment').addEventListener('click', function (event) {
    var activeTabId = $('.tab-pane.active').attr('id');
    var paymentInfoSelector = '#dwfrm_billing .' + activeTabId + ' .payment-form-fields input.form-control';
    var selectedPaymentMethod = $(paymentInfoSelector).val();
    window.localStorage.setItem('yuansfer_payment_method', selectedPaymentMethod);
});

function getGlobalParams() {

    var selectedPaymentMethod = window.localStorage.getItem('yuansfer_payment_method');
    var params = getSecurePayPayload();

    
    switch (selectedPaymentMethod) {
        case 'CREDIT_CARD':
            if (prUsed) {
                break;
            } else if (isSavedCard()) {
                copySelectedSaveCardDetails();
            } else {
                event.preventDefault();

                var cardholderName = document.getElementById('cardholder-name');
                var owner = getOwnerDetails();

                yuansfer.createPaymentMethod('card', cardElement, {
                    billing_details: {
                        name: cardholderName.value,
                        address: owner.address,
                        email: owner.email,
                        phone: owner.phone
                    }
                }).then(function (result) {
                    if (result.error) {
                        alert(result.error.message);
                    } else {
                        copyNewCardDetails(result.paymentMethod);
                        document.getElementById('dwfrm_billing').submit();
                    }
                });
            }
            break;
        case 'YUANSFER_WECHATPAY':
            
            params.vendor = "wechatpay";
            break;
        case 'YUANSFER_ALIPAY':
            
            params.vendor = "alipay";
            break;
        case 'YUANSFER_DANA':
           
            params.vendor = "dana";
            break;
        case 'YUANSFER_ALIPAYHK':
            
            params.vendor = "alipay_hk";
            break;
        case 'YUANSFER_GCASH':
            
            params.vendor = "gcash";
            break;
        case 'YUANSFER_KAKAOPAY':
            
            params.vendor = "kakaopay";
            break;
        default:

            alert('Unknown payment method');
    }
    return params;
}

function init() {
    if (newCardFormContainer) {
        initNewCardForm();
    }
}

function handleServerResponse(response) {
    if (response.error) {
        alert(response.error.message);
        window.location.replace(document.getElementById('billingPageUrl').value);
    } else if (response.requires_action) {
        // Use Stripe.js to handle required card action
        yuansfer.handleCardAction(response.payment_intent_client_secret).then(function (result) {
            if (result.error) {
                alert(result.error.message);
                window.location.replace(document.getElementById('billingPageUrl').value);
            } else {
                // The card action has been handled
                // The PaymentIntent can be confirmed again on the server
                $.ajax({
                    url: document.getElementById('beforePaymentAuthURL').value,
                    method: 'POST',
                    dataType: 'json',
                    data: {
                        csrf_token: $('[name="csrf_token"]').val()
                    }
                }).done(function (json) {
                    handleServerResponse(json);
                }).fail(function (msg) {
                    if (msg.responseJSON.redirectUrl) {
                        window.location.href = msg.responseJSON.redirectUrl;
                    } else {
                        alert(msg.error);
                    }
                });
            }
        });
    } else {
        forceSubmit = true;
        placeOrderButton.click();
    }
}

document.querySelector('button.place-order').addEventListener('click', function (event) {
    if (forceSubmit) return true;
    var currentParams = getGlobalParams();
    $.ajax({
        url: document.getElementById('beforePaymentAuthURL').value,
        method: 'POST',
        dataType: 'json',
        headers: { 'params': JSON.stringify(currentParams)},
        data: {
            csrf_token: $('[name="csrf_token"]').val()
        }
    }).done(function (json) {
        handleServerResponse(json);
    }).fail(function (msg) {
        if (msg.responseJSON.redirectUrl) {
            window.location.href = msg.responseJSON.redirectUrl;
        } else {
            alert(msg.error);
        }
    });   
});

function processQRCodeResult(result,vendor) {
    if (result.ret_code!="000100") {
        alert(result.ret_msg);
    } else {
        switch(vendor){
            case "wechatpay":
                var wechatPayQRCodeURL = document.getElementById('yuansfer_wechat_qrcode_url');
                wechatPayQRCodeURL.value = result.result.qrcodeUrl;   
                break;
            case "alipay":
                var alipayQRCodeURL = document.getElementById('yuansfer_alipay_qrcode_url');
                alipayQRCodeURL.value = result.result.qrcodeUrl;   
                break;
            case "dana":
                var danaQRCodeURL = document.getElementById('yuansfer_dana_qrcode_url');
                danaQRCodeURL.value = result.result.qrcodeUrl;   
                break;
            case "alipay_hk":
                var alipayHKQRCodeURL = document.getElementById('yuansfer_alipayhk_qrcode_url');
                alipayHKQRCodeURL.value = result.result.qrcodeUrl;   
                break;
            case "kakaopay":
                var kakaoPayQRCodeURL = document.getElementById('yuansfer_kakaopay_qrcode_url');
                kakaoPayQRCodeURL.value = result.result.qrcodeUrl;   
                break;
            case "gcash":
                var gcashQRCodeURL = document.getElementById('yuansfer_gcash_qrcode_url');
                gcashQRCodeURL.value = result.result.qrcodeUrl;   
                break;
                
        }
        document.getElementById('dwfrm_billing').submit();
    }
}

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
            var selectedPaymentContent = document.getElementById(activePaymentMethod[0].attributes['href'].value.replace('#', ''));

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
            var selectedPaymentContent = document.getElementById(activePaymentMethod[0].attributes['href'].value.replace('#', ''));
            if (selectedPaymentContent) {
                selectedPaymentContent.classList.add('active');
            }
        }
    });
});

