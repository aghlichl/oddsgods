"use client";

import { usePrivy } from "@privy-io/react-auth";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export function UserProfile() {
    const { user, logout } = usePrivy();

    if (!user) return null;

    return (
        <Card className="p-4 w-full max-w-md mx-auto mt-10 border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
            <h2 className="text-xl font-bold mb-4">User Profile</h2>
            <div className="space-y-2">
                <p><strong>ID:</strong> {user.id}</p>
                <p><strong>Email:</strong> {user.email?.address || "Not linked"}</p>
                <p><strong>Wallet:</strong> {user.wallet?.address || "Not linked"}</p>

                <div className="pt-4">
                    <Button onClick={logout} variant="destructive" className="w-full">
                        Log Out
                    </Button>
                </div>
            </div>
        </Card>
    );
}
