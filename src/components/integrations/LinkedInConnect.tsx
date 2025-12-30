
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Loader2, CheckCircle2, XCircle, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import { functions, db } from "@/firebaseConfig";
import { httpsCallable } from "firebase/functions";
import { doc, onSnapshot, deleteDoc } from "firebase/firestore";
import { useAuth } from "@/hooks/useAuth";

export function LinkedInConnect() {
    const { user } = useAuth();
    const [loading, setLoading] = useState(false);
    const [connected, setConnected] = useState(false);
    const [profileData, setProfileData] = useState<any>(null);

    useEffect(() => {
        if (!user) return;

        // Real-time listener for connection status
        const unsubscribe = onSnapshot(doc(db, `users/${user.uid}/integrations/linkedin`), (doc) => {
            if (doc.exists()) {
                setConnected(true);
                setProfileData(doc.data());
            } else {
                setConnected(false);
                setProfileData(null);
            }
        });

        return () => unsubscribe();
    }, [user]);

    const handleConnect = async () => {
        if (!user) return;
        setLoading(true);

        try {
            const getAuthUrl = httpsCallable(functions, 'getLinkedInAuthUrl');
            const redirectUri = window.location.origin + "/auth/callback/linkedin";

            // @ts-ignore
            const result = await getAuthUrl({ redirectUri });
            // @ts-ignore
            const url = result.data.url;

            // Persist the redirect location so we can come back *here*
            sessionStorage.setItem('authrax_auth_redirect', window.location.pathname);

            // Redirect
            window.location.href = url;

        } catch (error: any) {
            console.error("LinkedIn Connect Error:", error);
            toast.error("Failed to initiate connection: " + error.message);
            setLoading(false);
        }
    };

    const handleDisconnect = async () => {
        if (!user) return;
        if (!confirm("Are you sure you want to disconnect your LinkedIn account? You won't be able to publish posts directly.")) return;

        try {
            await deleteDoc(doc(db, `users/${user.uid}/integrations/linkedin`));
            toast.success("Disconnected from LinkedIn");
        } catch (error: any) {
            toast.error("Failed to disconnect: " + error.message);
        }
    };

    return (
        <Card className="bg-card border-border">
            <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                    <svg className="w-5 h-5 text-[#0A66C2]" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                    </svg>
                    LinkedIn Integration
                    {connected && <CheckCircle2 className="w-4 h-4 text-green-500 ml-2" />}
                </CardTitle>
                <CardDescription>
                    {connected
                        ? "Your account is connected. You can now publish posts directly to LinkedIn."
                        : "Connect your account to publish posts and analyze your voice"
                    }
                </CardDescription>
            </CardHeader>
            <CardContent>
                {connected ? (
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            {profileData?.picture && (
                                <img
                                    src={profileData.picture}
                                    alt="Profile"
                                    className="w-12 h-12 rounded-full border border-border"
                                />
                            )}
                            <div>
                                <p className="font-medium text-foreground">{profileData?.name || "LinkedIn User"}</p>
                                <p className="text-sm text-muted-foreground">{profileData?.email}</p>
                            </div>
                        </div>
                        <Button variant="outline" size="sm" onClick={handleDisconnect} className="text-destructive hover:text-destructive">
                            Disconnect
                        </Button>
                    </div>
                ) : (
                    <div className="flex flex-col sm:flex-row items-center gap-4 justify-between">
                        <div className="text-sm text-muted-foreground">
                            <ul className="list-disc list-inside space-y-1">
                                <li>Publish posts directly from Authrax</li>
                                <li>Import profile for better AI context</li>
                            </ul>
                        </div>
                        <Button
                            variant="outline"
                            className="w-full sm:w-auto bg-[#0A66C2] hover:bg-[#004182] text-white border-0"
                            onClick={handleConnect}
                            disabled={loading}
                        >
                            {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                            Connect LinkedIn
                        </Button>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
