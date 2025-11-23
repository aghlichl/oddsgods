"use client";

import { PrivyProvider } from "@privy-io/react-auth";

export default function PrivyWrapper({
    children,
}: {
    children: React.ReactNode;
}) {
    const appId = process.env.NEXT_PUBLIC_PRIVY_APP_ID;

    if (!appId) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-background text-foreground p-4 text-center">
                <div className="p-6 border border-destructive/50 rounded-lg bg-destructive/10 max-w-md">
                    <h2 className="text-xl font-bold mb-2 text-destructive">Missing Configuration</h2>
                    <p className="mb-4">
                        Please add <code className="bg-muted px-1 py-0.5 rounded">NEXT_PUBLIC_PRIVY_APP_ID</code> to your <code className="bg-muted px-1 py-0.5 rounded">.env</code> file.
                    </p>
                    <p className="text-sm text-muted-foreground">
                        You can get this ID from the <a href="https://dashboard.privy.io/" target="_blank" rel="noopener noreferrer" className="underline hover:text-primary">Privy Dashboard</a>.
                    </p>
                </div>
                {/* Render children anyway so the app structure is visible behind/below if needed, 
                    but actually without the provider, auth components will crash. 
                    So we stop here. */}
            </div>
        );
    }

    return (
        <PrivyProvider
            appId={appId}
            config={{
                appearance: {
                    theme: "dark",
                    accentColor: "#00FF94",
                    logo: "/polywhalelogo.png",
                    showWalletLoginFirst: false,
                },
                loginMethods: ["email", "wallet", "google", "twitter", "discord"],
                embeddedWallets: {
                    ethereum: {
                        createOnLogin: "users-without-wallets",
                    },
                },
            }}
        >
            {children}
        </PrivyProvider>
    );
}
