const Calendar = require('../util/Calendar');
const Collection = require('../util/dw.util.Collection');

let mockPreferences = {
    merchantNo: 'merchantNo'
};

const preferences = {
    smart: true,
    galleryDisplay: true,
    twilioNumber: '+987654321'
};

const Site = {
    current: {
        getID() {
            return 'TestYuansfer-TestSite';
        },
        getAllowedLocales() {
            return new Collection(['en_US']);
        },
        getAllowedCurrencies() {
            return new Collection(['USD']);
        },
        getCustomPreferenceValue(key) {
            if (Object.prototype.hasOwnProperty.call(mockPreferences, key)) {
                return mockPreferences[key];
            }

            return preferences[key];
        },
        getCalendar() {
            return new Calendar();
        },
        getPreferences() {
            return {
                getCustom() {
                    return preferences;
                }
            };
        }
    },
    getAllSites() {
        return new Collection([this.getCurrent()].concat([
            {
                getID() {
                    return 'TestYuansfer-TestSite2';
                },
                getAllowedLocales() {
                    return new Collection(['en_AU']);
                },
                getAllowedCurrencies() {
                    return new Collection(['AUD']);
                }
            },
            {
                getID() {
                    return 'TestYuansfer-TestSite';
                },
                getAllowedLocales() {
                    return new Collection(['en_GB']);
                },
                getAllowedCurrencies() {
                    return new Collection(['GBP']);
                }
            },
            {
                getID() {
                    return 'TestBrand2-TestSite2';
                },
                getAllowedLocales() {
                    return new Collection(['en_AU']);
                },
                getAllowedCurrencies() {
                    return new Collection(['AUD']);
                }
            }
        ]));
    },
    getCurrent() {
        return this.current;
    }
};

const setMockPreferenceValue = (key, value, isEnum) => {
    if (isEnum) {
        mockPreferences[key] = {
            getValue() {
                return value;
            }
        };
    } else {
        mockPreferences[key] = value;
    }
};

const restore = () => {
    mockPreferences = {};
};

module.exports = Site;
module.exports.setMockPreferenceValue = setMockPreferenceValue;
module.exports.restore = restore;

Object.defineProperty(module.exports, 'preferences', {
    get: () => Object.assign({}, preferences, mockPreferences)
});
