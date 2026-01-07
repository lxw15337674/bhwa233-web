import { createNavigation } from 'next-intl/navigation';
import { locales } from '../lib/i18n';

export const { Link, redirect, usePathname, useRouter } = createNavigation({
    locales,
    localePrefix: 'always'
});
