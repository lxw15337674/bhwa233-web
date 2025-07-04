'use client';

import { ThemeProvider as NextThemeProvider } from "@/components/theme-provider";
import { SidebarProvider } from '@/components/ui/sidebar';

export function ClientProviders({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <SidebarProvider>
            <NextThemeProvider
                attribute="class"
                defaultTheme="dark"
            >
                {children}
            </NextThemeProvider>
        </SidebarProvider>
    );
}
