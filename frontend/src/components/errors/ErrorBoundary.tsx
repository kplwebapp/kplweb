import { Component, type ErrorInfo, type ReactNode } from 'react'
import ErrorPage from './ErrorPage'

type Props = {
  children: ReactNode
  /** Where “Go home” should send the user after a crash. */
  homeTo?: string
  homeLabel?: string
}

type State = { error: Error | null }

/** Catches render crashes and shows a branded 500-style page instead of a blank screen. */
export default class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null }

  static getDerivedStateFromError(error: Error): State {
    return { error }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('UI crash', error, info.componentStack)
  }

  private retry = () => {
    this.setState({ error: null })
  }

  render() {
    if (!this.state.error) return this.props.children

    return (
      <ErrorPage
        kind="server"
        title="Something went wrong"
        description="The page crashed unexpectedly. You can try again, or go back home."
        homeTo={this.props.homeTo ?? '/'}
        homeLabel={this.props.homeLabel ?? 'Go home'}
        onRetry={this.retry}
        retryLabel="Reload this page"
      />
    )
  }
}
