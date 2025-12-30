import React, { Component, ErrorInfo, ReactNode } from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { RefreshCcw, AlertCircle } from "lucide-react";

interface Props {
    children: ReactNode;
}

interface State {
    hasError: boolean;
    error: Error | null;
    errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
    public state: State = {
        hasError: false,
        error: null,
        errorInfo: null,
    };

    public static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error, errorInfo: null };
    }

    public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error("Uncaught error:", error, errorInfo);
        this.setState({ errorInfo });
    }

    public render() {
        if (this.state.hasError) {
            return (
                <div className="p-6 m-4 border border-destructive/20 rounded-xl bg-destructive/10">
                    <Alert variant="destructive" className="mb-4 bg-transparent border-none">
                        <AlertCircle className="h-4 w-4" />
                        <AlertTitle className="text-lg font-bold">Something went wrong</AlertTitle>
                        <AlertDescription>
                            {this.state.error && this.state.error.toString()}
                        </AlertDescription>
                    </Alert>

                    <div className="bg-secondary/50 p-4 rounded-lg overflow-auto max-h-[300px] mb-4 text-xs font-mono">
                        <p className="font-semibold mb-2">Component Stack:</p>
                        {this.state.errorInfo?.componentStack}
                    </div>

                    <Button
                        variant="outline"
                        onClick={() => window.location.reload()}
                        className="w-full"
                    >
                        <RefreshCcw className="w-4 h-4 mr-2" />
                        Reload Page
                    </Button>
                </div>
            );
        }

        return this.props.children;
    }
}
