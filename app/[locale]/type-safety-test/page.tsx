import { TypeSafetyTest } from '@/components/TypeSafetyTest';
import type { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'i18n Type Safety Test',
    description: 'Test page for next-intl type safety configuration'
};

export default function TypeSafetyTestPage() {
    return <TypeSafetyTest />;
}
