import React, { Component, ErrorInfo, ReactNode } from 'react';
import ServerErrorPage from '../pages/errors/ServerErrorPage';

interface Props {
    children?: ReactNode;
}

interface State {
    hasError: boolean;
    error?: Error;
}

class ErrorBoundary extends Component<Props, State> {
    public state: State = {
        hasError: false
    };

    public static getDerivedStateFromError(error: Error): State {
        // Update state so the next render will show the fallback UI.
        return { hasError: true, error };
    }

    public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        // You can also log the error to an error reporting service like Sentry here
        console.error('Uncaught error:', error, errorInfo);
    }

    private resetErrorBoundary = () => {
        this.setState({ hasError: false, error: undefined });
    }

    public render() {
        if (this.state.hasError) {
            return <ServerErrorPage error={this.state.error} resetErrorBoundary={this.resetErrorBoundary} />;
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
