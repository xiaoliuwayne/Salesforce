const sandboxedModule = require('sandboxed-module');
module.exports = sandboxedModule.load('../../../../../../../cartridges/int_yuansfer_sfra/cartridge/scripts/yuansfer/services/yuansferService', {
    requires: {
        'dw/svc/LocalServiceRegistry': require('../../../../../dw-mocks/dw/svc/LocalServiceRegistry'),
        'dw/system/Site': require('../../../../../dw-mocks/dw/system/Site')
    },
    singleOnly: true
});
