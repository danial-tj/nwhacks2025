import { Component, type ReactNode } from "react";
export default class ViewBoundary extends Component<
  { children: ReactNode },
  { failed: boolean }
> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    return this.state.failed ? (
      <div className="viewer skeleton">
        <div className="loadMessage" role="alert">
          <strong>3D is unavailable</strong>
          <p>
            You can still explore the scale ruler, science notes, and features.
            Try reloading the view or using a browser with WebGL.
          </p>
          <button onClick={() => this.setState({ failed: false })}>
            Retry 3D view
          </button>
        </div>
      </div>
    ) : (
      this.props.children
    );
  }
}
