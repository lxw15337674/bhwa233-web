import { getRequestConfig } from 'next-intl/server';
import { locales, type Locale } from '../lib/i18n';

export default getRequestConfig(async ({ requestLocale }) => {
    // This typically corresponds to the `[locale]` segment
    let locale = await requestLocale;

    // Ensure that a valid locale is used
    if (!locale || !locales.includes(locale as Locale)) {
        locale = 'en';
    }

    return {
        locale,
        messages: (await import(`../i18n/${locale}.json`)).default
    };
});
