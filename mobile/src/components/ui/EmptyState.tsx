import { View, StyleSheet } from 'react-native'
import { AppText } from './AppText'
import { Button } from './Button'
import { spacing } from '@/theme/spacing'

type Props = {
  title: string
  description?: string
  actionLabel?: string
  onAction?: () => void
}

export function EmptyState({ title, description, actionLabel, onAction }: Props) {
  return (
    <View style={styles.wrap}>
      <AppText variant="subtitle" weight="700">
        {title}
      </AppText>
      {description ? (
        <AppText muted style={{ textAlign: 'center' }}>
          {description}
        </AppText>
      ) : null}
      {actionLabel && onAction ? <Button label={actionLabel} onPress={onAction} /> : null}
    </View>
  )
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.xxl,
  },
})
