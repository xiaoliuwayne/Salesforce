/* eslint-env es6 */
/* eslint-disable no-console */
/* eslint-disable no-alert */
/* eslint-disable no-param-reassign */
/* eslint-disable dot-notation */
/* eslint-disable no-plusplus */
/* eslint-disable require-jsdoc */
/* globals Yuansfer, $ */
// v3

function setCustomCardOutcome(result) {
    var displayError = document.getElementById('card-errors');
    if (result.error) {
        displayError.textContent = result.error.message;
    } else {
        displayError.textContent = '';
    }
}

var cardBrandToPfClass = {
    visa: 'pf-visa',
    mastercard: 'pf-mastercard',
    amex: 'pf-american-express',
    discover: 'pf-discover',
    diners: 'pf-diners',
    jcb: 'pf-jcb',
    unknown: 'pf-credit-card'
};

function setCustomCardBrandIcon(brand) {
    var brandIconElement = document.getElementById('brand-icon');
    var pfClass = 'pf-credit-card';
    if (brand in cardBrandToPfClass) {
        pfClass = cardBrandToPfClass[brand];
    }

    for (var i = brandIconElement.classList.length - 1; i >= 0; i--) {
        brandIconElement.classList.remove(brandIconElement.classList[i]);
    }
    brandIconElement.classList.add('pf');
    brandIconElement.classList.add(pfClass);
}

var cardElement = null;
var cardNumberElement = null;
if (document.getElementById('card-element')) {
    cardElement = elements.create('card');
    cardElement.mount('#card-element');
    cardElement.addEventListener('change', function (event) {
        var displayError = document.getElementById('card-errors');
        if (event.error) {
            displayError.textContent = event.error.message;
        } else {
            displayError.textContent = '';
        }
    });
} else if (document.getElementById('yuansfer-custom-card-group')) {
    var style = JSON.parse(document.getElementById('yuansfer-custom-card-group').dataset.elementstyle);

    cardNumberElement = elements.create('cardNumber', {
        style: style
    });
    cardNumberElement.mount('#card-number-element');

    var cardExpiryElement = elements.create('cardExpiry', {
        style: style
    });
    cardExpiryElement.mount('#card-expiry-element');

    var cardCvcElement = elements.create('cardCvc', {
        style: style
    });
    cardCvcElement.mount('#card-cvc-element');

    cardNumberElement.on('change', function (event) {
        // Switch brand logo
        if (event.brand) {
            setCustomCardBrandIcon(event.brand);
        }

        setCustomCardOutcome(event);
    });
}

var newCardFormContainer = document.getElementById('new-card-form-container');
var savedCardsFormContainer = document.getElementById('saved-cards-container');
var cardIdInput = document.getElementsByName('yuansfer_source_id');
var cardNumberInput = document.getElementById('yuansfer_card_number');
var cardHolderInput = document.getElementById('yuansfer_card_holder');
var cardTypeInput = document.getElementById('yuansfer_card_type');
var cardTypeInputSFCC = document.getElementById('cardType');
var cardBrandInput = document.getElementById('yuansfer_card_brand');
var cardExpMonthInput = document.getElementById('yuansfer_card_expiration_month');
var cardExpYearInput = document.getElementById('yuansfer_card_expiration_year');

var forceSubmit = false;
var prUsed = false;

var switchToSavedCardsLink = document.getElementById('switch-to-saved-cards');
if (switchToSavedCardsLink) {
    switchToSavedCardsLink.addEventListener('click', function () {
        newCardFormContainer.style.display = 'none';
        savedCardsFormContainer.style.display = 'block';
    });
}

var switchToNewCardLink = document.getElementById('switch-to-add-card');
if (switchToNewCardLink) {
    switchToNewCardLink.addEventListener('click', function () {
        newCardFormContainer.style.display = 'block';
        savedCardsFormContainer.style.display = 'none';
    });
}

if (savedCardsFormContainer) {
    newCardFormContainer.style.display = 'none';
}

function isSavedCard() {
    return newCardFormContainer && newCardFormContainer.style.display === 'none';
}

function capitalize(text) {
    return text.replace(/\b\w/g, function (letter) {
        return letter.toUpperCase();
    });
}

function copySelectedSaveCardDetails() {
    var savedCard = document.querySelector('input[name=saved_card_id]:checked');
    cardIdInput.forEach(function (input) {
        input.value = savedCard.value;
    });
    cardNumberInput.value = savedCard.dataset.cardnumber;
    cardHolderInput.value = savedCard.dataset.cardholder;
    cardTypeInput.value = savedCard.dataset.cardtype;
    cardTypeInputSFCC.value = capitalize(savedCard.dataset.cardtype);
    cardExpMonthInput.value = savedCard.dataset.cardexpmonth;
    cardExpYearInput.value = savedCard.dataset.cardexpyear;
    prUsedInput.value = '';
}

function copyNewCardDetails(paymentMethod) {
    cardIdInput.forEach(function (input) {
        input.value = paymentMethod.id;
    });

    if (paymentMethod.card) {
        cardNumberInput.value = '************' + paymentMethod.card.last4;
        cardTypeInput.value = '';
        cardTypeInputSFCC.value = capitalize(paymentMethod.card.brand);
        cardBrandInput.value = paymentMethod.card.brand;
        cardExpMonthInput.value = paymentMethod.card.exp_month;
        cardExpYearInput.value = paymentMethod.card.exp_year;
    }
    cardHolderInput.value = paymentMethod.billing_details && paymentMethod.billing_details.name;
    prUsedInput.value = '';
}

function getSecurePayPayload() {
    var yuansferOrderNumberInput = document.getElementById('yuansfer_order_number');
    var yuansferReturnURLInput = document.getElementById('yuansfer_return_url');
    var yuansferOrderAmountInput = document.getElementById('yuansfer_order_amount');
    var yuansferOrderCurrencyInput = document.getElementById('yuansfer_order_currency');
    var yuansferOrderNoteInput = document.getElementById('yuansfer_order_note');
    var yuansferOrderDescriptionInput = document.getElementById('yuansfer_order_description');
    var yuansferOrderGoodsInput = document.getElementById('yuansfer_order_goods');
    var yuansferOrderSettleCurrencyInput = document.getElementById('yuansfer_order_settle_currency');

    var amountToPay = parseFloat(yuansferOrderAmountInput.value);
    var currencyCode = yuansferOrderCurrencyInput.value;
    var settleCurrencyCode = yuansferOrderSettleCurrencyInput.value;
    var returnURL = yuansferReturnURLInput.value;
    var terminal = "ONLINE";
    var vendor = "";

    return {
        amount: amountToPay,                       
        currency: currencyCode,        
        vendor: vendor,                             
        callbackUrl: returnURL,      
        terminal: terminal,            
        reference: yuansferOrderNumberInput,          
        description: yuansferOrderDescriptionInput,      
        note: yuansferOrderNoteInput,                                 
        goodsInfo: yuansferOrderGoodsInput            
    };
}

function handleServerResponse(response) {
    if (response.error) {
        alert(response.error.message);
        window.location.replace(document.getElementById('billingPageUrl').value);
    } else if (response.requires_action) {
        // Use Yuansfer.js to handle required card action
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
                        alert(msg);
                    }
                });
            }
        });
    } else {
        forceSubmit = true;
        $('button.place-order').click();
    }
}

function populateBillingData(pr) {
    var form = document.getElementById('dwfrm_billing');

    var payerName = pr.payerName;
    if (payerName) {
        var payerNameSplit = payerName.split(' ');

        if (payerNameSplit.length > 1) {
            var firstName = payerNameSplit[0];
            var lastName = payerNameSplit[1];

            form.querySelector('input[name$="_firstName"]').value = firstName;
            form.querySelector('input[name$="_lastName"]').value = lastName;
        } else {
            form.querySelector('input[name$="_firstName"]').value = payerName;
            form.querySelector('input[name$="_lastName"]').value = payerName;
        }
    }

    form.querySelector('input[name$="_email"]').value = pr.payerEmail;
    form.querySelector('input[name$="_phone"]').value = pr.payerPhone;

    var selectCountryElement = form.querySelector('select[name$="_country"]');
    var prCountry = pr.paymentMethod.billing_details.address.country.toLowerCase();
    var prCountryExists = ($('#' + selectCountryElement.id + ' option[value=' + prCountry + ']').length > 0);

    if (prCountryExists) {
        selectCountryElement.value = prCountry;
    }

    form.querySelector('input[name$="_city"]').value = pr.paymentMethod.billing_details.address.city;
    form.querySelector('input[name$="_postalCode"]').value = pr.paymentMethod.billing_details.address.postal_code;
    form.querySelector('input[name$="_address1"]').value = pr.paymentMethod.billing_details.address.line1;
    form.querySelector('input[name$="_address2"]').value = pr.paymentMethod.billing_details.address.line2;

    var stateElement = form.querySelector('select[name$="_stateCode"]') || form.querySelector('input[name$="_stateCode"]');
    stateElement.value = pr.paymentMethod.billing_details.address.state;
}

function processQRCodeResult(result) {
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

        var yuansferReturnURL = document.getElementById('yuansfer_return_url').value;

        // eslint-disable-next-line no-unused-vars
        $('body').on('checkout:updateCheckoutView', function (e, data) {
            window.location.replace(yuansferReturnURL);
        });

        $('.submit-payment').click();
        $.spinner().start();
    }
}

// v1
// eslint-disable-next-line consistent-return
document.querySelector('button.place-order').addEventListener('click', function (event) {
    event.stopImmediatePropagation();

    if (window.localStorage.getItem('yuansfer_payment_method') === 'STRIPE_KLARNA') {
        var klarnaPaymentOption = window.localStorage.getItem('yuansfer_klarna_payment_option');

        window.Klarna.Payments.authorize({
            payment_method_category: klarnaPaymentOption
        }, function (res) {
            if (res.approved) {
                // success
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
            } else if (res.error) {
                // Payment not authorized or an error has occurred
                alert(res.error);
                $('.payment-summary .edit-button').click();
            } else {
                // handle other states
                alert('Order not approved');
                $('.payment-summary .edit-button').click();
            }
        });
    } else {
        if (forceSubmit) return true;

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

document.querySelector('button.submit-payment').addEventListener('click', function (event) {
    let billingForm = document.getElementById('dwfrm_billing');
    $(billingForm).find('.form-control.is-invalid').removeClass('is-invalid');
    if (!billingForm.reportValidity()) {
        billingForm.focus();
        billingForm.scrollIntoView();
        return;
    }

    event.stopImmediatePropagation();

    var activeTabId = $('.tab-pane.active').attr('id');
    var paymentInfoSelector = '#dwfrm_billing .' + activeTabId + ' .payment-form-fields input.form-control';
    var selectedPaymentMethod = $(paymentInfoSelector).val();
    var params;

    window.localStorage.setItem('yuansfer_payment_method', selectedPaymentMethod);

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
            event.preventDefault();

            params = getSecurePayPayload();

            params.vendor = "wechatpay";
            
            yuansfer.securePay(params).then(res=>processQRCodeResult(res,"wechatpay"));
            break;
        case 'YUANSFER_ALIPAY':
            event.preventDefault();

            params = getSecurePayPayload();

            params.vendor = "alipay";

            yuansfer.securePay(params).then(res=>processQRCodeResult(res,"alipay"));
            break;
        case 'YUANSFER_DANA':
            event.preventDefault();

            params = getSecurePayPayload();

            params.vendor = "dana";

            yuansfer.securePay(params).then(res=>processQRCodeResult(res,"dana"));
            break;
        case 'YUANSFER_ALIPAYHK':
            event.preventDefault();

            params = getSecurePayPayload();

            params.vendor = "alipay_hk";

            yuansfer.securePay(params).then(res=>processQRCodeResult(res,"alipay_hk"));
            break;
        case 'YUANSFER_GCASH':
            event.preventDefault();

            params = getSecurePayPayload();

            params.vendor = "gcash";

            yuansfer.securePay(params).then(res=>processQRCodeResult(res,"gcash"));
            break;
        case 'YUANSFER_KAKAOPAY':
            event.preventDefault();

            params = getSecurePayPayload();

            params.vendor = "kakaopay";

            yuansfer.securePay(params).then(res=>processQRCodeResult(res,"kakaopay"));
            break;
        default:
            event.preventDefault();

            alert('Unknown payment method');
    }
});

function initYuansfer() {
    var merchantNo = document.getElementById('yuansfer_merchant_no');
    var storeNo = document.getElementById('yuansfer_store_no');
    var token = document.getElementById('yuansfer_token');
    var env = document.getElementById('yuansfer_env');
    var isvFlag = 0;
    var temp =hi;

    yuansfear.init({
        merchantNo: merchantNo,
        storeNo: storeNo,
        token: token,
        isvFlag: isvFlag,
        env: env
    })
}
    initYuansfer();


// Update stored order amount on shipping method change
$('body').on('checkout:updateCheckoutView', function () {
    $.ajax({
        url: document.getElementById('getYuansferOrderItemsURL').value,
        method: 'GET',
        dataType: 'json'
    }).done(function (json) {
        var yuansferOrderAmountInput = document.getElementById('yuansfer_order_amount');
        if (yuansferOrderAmountInput) {
            yuansferOrderAmountInput.value = json.amount;
        }

        var yuansferOrderItems = document.getElementById('yuansfer_order_items');
        if (yuansferOrderItems) {
            yuansferOrderItems.value = json.orderItems;
        }

        refreshKlarnaWhenIsActive();
    });
});

// fix issue with SFRA select payment method when edit payment from Order confirmation
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

            if (activePaymentMethod[0].attributes['href'].value.includes('KLARNA')) {
                // create source and load Klarna widgets
                var createSourcePayload = getCreateKlarnaSourcePayload();
                yuansfer.createSource(createSourcePayload).then(processKlarnaCreateSourceResult);
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

    var klarnaLiEl = document.querySelectorAll("li.nav-item[data-method-id='STRIPE_KLARNA']");
    if (klarnaLiEl.length > 0) {
        klarnaLiEl[0].addEventListener('click', function (event) {
            if (!document.querySelector('input[name$="_address1"]').value
                || !document.querySelector('input[name$="_city"]').value
                || !document.querySelector('input[name$="_postalCode"]').value
                || !document.querySelector('select[name$="_country"]').value
                || !document.querySelector('input[name$="_email"]').value
                || !document.querySelector('input[name$="_phone"]').value) {
                alert(document.getElementById('klarna-widget-wrapper').dataset.errormsg);

                event.stopPropagation();
                $('.nav-item a.active').click();
                return false;
            }

            let billingForm = document.getElementById('dwfrm_billing');
            $(billingForm).find('.form-control.is-invalid').removeClass('is-invalid');
            if (!billingForm.reportValidity()) {
                billingForm.focus();
                billingForm.scrollIntoView();
                event.stopPropagation();
                $('.nav-item a.active').click();
                return false;
            }

            // create source and load Klarna widgets
            var createSourcePayload = getCreateKlarnaSourcePayload();
            yuansfer.createSource(createSourcePayload).then(processKlarnaCreateSourceResult);

            return true;
        });
    }

    if (document.querySelector('#dwfrm_billing input[name$="_firstName"]')) {
        document.querySelector('#dwfrm_billing input[name$="_firstName"]').addEventListener('change', refreshKlarnaWhenIsActive);
    }

    if (document.querySelector('#dwfrm_billing input[name$="_lastName"]')) {
        document.querySelector('#dwfrm_billing input[name$="_lastName"]').addEventListener('change', refreshKlarnaWhenIsActive);
    }

    if (document.querySelector('#dwfrm_billing input[name$="_address1"]')) {
        document.querySelector('#dwfrm_billing input[name$="_address1"]').addEventListener('change', refreshKlarnaWhenIsActive);
    }

    if (document.querySelector('#dwfrm_billing input[name$="_address2"]')) {
        document.querySelector('#dwfrm_billing input[name$="_address2"]').addEventListener('change', refreshKlarnaWhenIsActive);
    }

    if (document.querySelector('#dwfrm_billing input[name$="_city"]')) {
        document.querySelector('#dwfrm_billing input[name$="_city"]').addEventListener('change', refreshKlarnaWhenIsActive);
    }

    if (document.querySelector('#dwfrm_billing input[name$="_postalCode"]')) {
        document.querySelector('#dwfrm_billing input[name$="_postalCode"]').addEventListener('change', refreshKlarnaWhenIsActive);
    }

    if (document.querySelector('#dwfrm_billing select[name$="_country"]')) {
        document.querySelector('#dwfrm_billing select[name$="_country"]').addEventListener('change', refreshKlarnaWhenIsActive);
    }

    if (document.querySelector('#dwfrm_billing input[name$="_email"]')) {
        document.querySelector('#dwfrm_billing input[name$="_email"]').addEventListener('change', refreshKlarnaWhenIsActive);
    }

    if (document.querySelector('#dwfrm_billing input[name$="_phone"]')) {
        document.querySelector('#dwfrm_billing input[name$="_phone"]').addEventListener('change', refreshKlarnaWhenIsActive);
    }

    refreshKlarnaWhenIsActive();
});
