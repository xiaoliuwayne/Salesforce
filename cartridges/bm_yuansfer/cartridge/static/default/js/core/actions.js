'use strict';

/**
 * jQuery Ajax helpers on DOM ready.
 */
document.addEventListener('DOMContentLoaded', function () {
    // Initialize the button events
    // eslint-disable-next-line
    initButtons();
}, false);

/**
 * Initialise the buttons beahviour.
 */
function initButtons() {
    // Close the modal window
    jQuery('.yuansferModal .modal-content .close').click(function (e) {
        jQuery('.yuansferModal .modal-content input').val('');
        jQuery('.yuansferModal .modal-content span').not('.close, .label').empty();
        jQuery('.yuansferModal').hide();
    });

    // Define the transaction buttons click events
    document.addEventListener('click', function (e) {
        // Prevent double click
        if (typeof e.target.className === 'string' && e.target.className.indexOf('yuansferAction') !== -1) {
            // Ignore double cliks
            if (e.detail > 1) {
                return;
            }

            // Open the modal
            // eslint-disable-next-line
            openModal(e.target);
        }
    }, true);

    // Submit the action request
    jQuery('.yuansferModal .modal-content .submit').click(function () {
        // Prepare the origin element id members
        var elt = jQuery(this).closest('.modal-content').find('input');
        var members = elt.attr('id').split('_');

        // Get the transaction task
        var task = members[0];

        // Perform the requested action
        // eslint-disable-next-line
        performAction(task);
    });
}

/**
 * Open the modal window.
 * @param {Object} elt The DOM element
 */
function openModal(elt) {
    // Prepare the origin element id members
    var members = elt.id.split('-');

    // Get the transaction data
    var tidExists = members[2] !== null && members[2] !== 'undefined';
    var isValidTid = members[2].length > 0;
    if (tidExists && isValidTid) {
        // eslint-disable-next-line
        getTransactionData(members);
    } else {
        // eslint-disable-next-line no-alert
        alert(window.yuansferLang.transactionMissing);
    }
}

/**
 * Get the transaction data.
 * @param {array} members The transaction data array
 */
function getTransactionData(members) {
    // Prepare the controller URL for the AJAX request
    var controllerUrl = jQuery('[id="transactionsControllerUrl"]').val();

    // Set the transaction action
    var task = members[0];

    // Set the transaction id
    var transactionId = members[2];

    // Set the modal window id
    var modalId = '[id="' + task + '_modal"]';

    // Send the AJAX request
    jQuery.ajax({
        type: 'POST',
        url: controllerUrl,
        data: { tid: transactionId },
        success: function (data) {
            // Get the data
            var transaction = JSON.parse(data)[0];

            // Set the transation data field ids
            var field1Id = '[id="' + task + '_value"]';
            var field2Id = '[id="' + task + '_currency"]';
            var field3Id = '[id="' + task + '_transaction_id"]';
            var field4Id = '[id="' + task + '_payment_id"]';
            var field5Id = '[id="' + task + '_full_amount"]';
            var field6Id = '[id="' + task + '_order_no"]';
            var field7Id = '[id="' + task + '_refundable_amount"]';

            // Handle the capture case transation amount value
            if (transaction.data_type === 'CAPTURE') {
                jQuery(field1Id).val(transaction.refundable_amount);
                jQuery(field7Id).append(transaction.refundable_amount + ' ' + transaction.currency);
            } else {
                jQuery(field1Id).val(transaction.amount);
            }

            // Add the remaining values
            jQuery(field2Id).append(transaction.currency);
            jQuery(field3Id).append(transaction.transaction_id);
            jQuery(field4Id).append(transaction.payment_id);
            jQuery(field5Id).append(transaction.amount + ' ' + transaction.currency);
            jQuery(field6Id).append(transaction.order_no);

            // Show the modal window
            jQuery(modalId).show();
        },
        error: function (request, status, error) {
            // eslint-disable-next-line no-console
            console.log(error);
        }
    });
}

/**
 * Show the error message.
 * @param {string} selector The CSS selector
 */
function showErrorMessage(selector) {
    // Show the error message
    jQuery('.' + selector).show(
        'fast',
        function () {
            setTimeout(function () {
                jQuery('.' + selector).hide();
            }, 7000);
        }
    );
}

function calculateVerifySign(contents, token) {
    // 1.对参数进行排序，然后用a=1&b=2..的形式拼接
    var sortArray = [];

    Object.keys(contents).sort().forEach(function (k) {
        if (contents[k] || contents[k] === false) {
            sortArray.push(k + '=' + contents[k]);
        }
    });

    // 对token进行md5，得到的结果追加到sortArray之后
    sortArray.push(MD5(token));

    var tempStr = sortArray.join('&');
    // console.log('tempStr:', tempStr);

    // 对tempStr 再进行一次md5加密得到verifySign
    var verifySign = MD5(tempStr);
    // console.log('veirfySign:', verifySign)

    return verifySign;
}

function isJson(str) {
    try {
        JSON.parse(str);
    } catch (e) {
        return false;
    }
    return true;
}

/**
 * Perform a transaction action.
 * @param {string} task The task to perform
 */
function performAction(task) {
    // set params
    var actionUrl = jQuery('[id="actionControllerUrl"]').val();
    var currency = jQuery('[id="' + task + '_currency"]').text();
    var transactionNo = jQuery('[id="' + task + '_transaction_id"]').text();
    var amount = jQuery('[id="' + task + '_value"]').val();
    var merchantNo = document.getElementById('yuansfer_merchant_no').value;
    var storeNo = document.getElementById('yuansfer_store_no').value;
    var token = document.getElementById('yuansfer_token').value;
    var orderNumber = jQuery('[id="' + task + '_order_no"]').text();
    // Prepare the action data
    var data = {
        merchantNo: merchantNo,
        storeNo: storeNo,
        refundAmount: amount,
        currency: currency,
        settleCurrency: currency,
        transactionNo: transactionNo
    };
    var verifySign = calculateVerifySign(data, token);
    data.verifySign = verifySign;
    data.orderNumber = orderNumber;
    // Send the AJAX request
    jQuery.ajax({
        type: 'POST',
        url: actionUrl,
        data: data,
        beforeSend:function(){
            jQuery('#loading').show();
        },
        complete: function() {
            jQuery('#loading').hide();
        },
        success: function(res) {
            if (isJson(res)) {
                var response = JSON.parse(res);
                console.log(response.ret_code);
                if (response.ret_code != '000100') {
                    showErrorMessage('yuansferErrorMessage');
                } else {
                    // Close the modal window
                    jQuery('.yuansferModal .modal-content .close').trigger('click');

                    // Reload the table data
                    // eslint-disable-next-line
                    getTransactions(reloadTable);
                    setTimeout(function(){
                        location.reload();
                    },3000);
                }
            }
        },
        error: function(request, status, error) {
            // eslint-disable-next-line no-console
            console.log(error);
        },
    });
}

/**
 * Reload the table data.
 * @param {string} tableData The table data
 */
function reloadTable(tableData) {
    // Update the row data
    window.yuansferTransactionsTable.replaceData(tableData);

    // Show the success message
    // eslint-disable-next-line
    showSuccessMessage();

}

/**
 * Show a success message.
 */
function showSuccessMessage() {
    // Show the success message
    jQuery('.yuansferSuccessMessage').show(
        'fast',
        function () {
            setTimeout(function () {
                jQuery('.yuansferSuccessMessage').hide('fast');
            }, 7000);
        }
    );
}

jQuery(window).load(function() {
    jQuery('#loading').hide();
});
