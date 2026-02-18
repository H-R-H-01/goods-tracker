"use client";

import { AuthProvider } from "@/contexts/AuthContext";

// Actually, simple provider for Auth. 

export function Providers({ children }: { children: React.ReactNode }) {
    return (
        <AuthProvider>
            {children}
        </AuthProvider>
    );
}
