import { Component, type ReactNode } from "react";

// A failed chunk download or a render error in the stage shows the film fallback instead of
// unmounting the whole page.
export default class FilmBoundary extends Component<
  { children: ReactNode; onFailure: () => void },
  { failed: boolean }
> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch(error: Error) {
    console.error("Film stage:", error);
    this.props.onFailure();
  }

  render() {
    return this.state.failed ? null : this.props.children;
  }
}
