import { View, StyleSheet } from 'react-native'
import { AppText } from './AppText'
import { Button } from './Button'
import { Screen } from './Screen'
import { spacing } from '@/theme/spacing'

export type MobileErrorKind = 'not-found' | 'server' | 'offline' | 'generic'

type Props = {
  kind?: MobileErrorKind
  title?: string
  description?: string
  actionLabel?: string
  onAction?: () => void
  secondaryLabel?: string
  onSecondary?: () => void
}

const COPY: Record<MobileErrorKind, { title: string; description: string; code: string }> = {
  'not-found': {
    title: 'Screen not found',
    description: 'This screen does not exist or the link is outdated.',
    code: '404',
  },
  server: {
    title: 'Something went wrong',
    description: 'An unexpected error occurred. Please try again.',
    code: '500',
  },
  offline: {
    title: 'You are offline',
    description: 'Check your internet connection, then try again.',
    code: 'OFFLINE',
  },
  generic: {
    title: 'Unable to continue',
    description: 'Something unexpected happened. Please try again.',
    code: 'ERROR',
  },
}

/** Full-screen branded error used by not-found, crash, and offline states. */
export function ErrorScreen({
  kind = 'generic',
  title,
  description,
  actionLabel = 'Go home',
  onAction,
  secondaryLabel,
  onSecondary,
}: Props) {
  const copy = COPY[kind]
  return (
    <Screen>
      <View style={styles.wrap}>
        <AppText muted style={styles.code}>
          {copy.code}
        </AppText>
        <AppText variant="title" weight="700" style={styles.title}>
          {title ?? copy.title}
        </AppText>
        <AppText muted style={styles.desc}>
          {description ?? copy.description}
        </AppText>
        {onAction ? <Button label={actionLabel} onPress={onAction} /> : null}
        {secondaryLabel && onSecondary ? (
          <Button label={secondaryLabel} onPress={onSecondary} variant="secondary" />
        ) : null}
      </View>
    </Screen>
  )
}

const styles = StyleSheet.create({
  wrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xxl,
  },
  code: {
    letterSpacing: 2,
    textTransform: 'uppercase',
    fontSize: 12,
  },
  title: {
    textAlign: 'center',
  },
  desc: {
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
})
