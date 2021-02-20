'use strict';

var server = require('server');
var page = module.superModule;
server.extend(page);

server.prepend('Start', function (req, res, next) {
    var URLRedirectMgr = require('dw/web/URLRedirectMgr');
    var yuansferHelper = require('*/cartridge/scripts/yuansfer/helpers/yuansferHelper');

    // Yuansfer changes BEGIN
    if (yuansferHelper.isStripeEnabled() && URLRedirectMgr.getRedirectOrigin() === '/.well-known/apple-developer-merchantid-domain-association') { // Intercept the incoming path request
        res.render('stripe/util/apple');
        return null;
    }

    return next();
});

module.exports = server.exports();
