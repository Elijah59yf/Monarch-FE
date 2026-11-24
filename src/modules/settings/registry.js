// Every setting the code may read. Values live in the D1 settings table;
// the default is used until a value is stored, or if the stored value is invalid.
// check() runs on set() and sees all current values, for rules that span settings.

export const REGISTRY = {
    'business.name': {
        type: 'string',
        default: 'Monarch',
        description: 'Business name shown in the header, footer and page titles.',
    },
    'business.address': {
        type: 'string',
        default: 'Lagos, Nigeria',
        description: 'Postal address shown on invoices and contact details.',
    },
    'business.contact_email': {
        type: 'email',
        default: 'contact@monarchdem.me',
        description: 'Public contact address shown in the footer.',
    },
    'business.timezone': {
        type: 'timezone',
        default: 'Africa/Lagos',
        description: 'Time zone used to show dates.',
    },
    'currency.default': {
        type: 'currency',
        default: 'NGN',
        description: 'Currency used when none is chosen. Must be one of the enabled currencies.',
        check(value, all) {
            if (!all['currency.enabled'].includes(value)) {
                throw new TypeError('must be one of the enabled currencies');
            }
        },
    },
    'currency.enabled': {
        type: 'currency_list',
        default: ['NGN', 'USD'],
        description: 'Currencies that can be used for prices and invoices.',
        check(value, all) {
            if (!value.includes(all['currency.default'])) {
                throw new TypeError('must include the default currency');
            }
        },
    },
};
