import { Component, type ErrorInfo, type ReactNode } from 'react';

type Props = { onReset: () => void; fallback: (reset: () => void) => ReactNode; children: ReactNode };
type State = { hasError: boolean };

/** Catches render errors (a broken card, a bad save that slipped through). React still needs a class for this. */
export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(_error: Error, _info: ErrorInfo): void {
    // No logging in v1: there is no backend, and the player sees the error screen.
  }

  reset = (): void => {
    this.props.onReset();
    this.setState({ hasError: false });
  };

  render(): ReactNode {
    return this.state.hasError ? this.props.fallback(this.reset) : this.props.children;
  }
}
