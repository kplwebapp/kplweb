import { useEffect } from 'react'
import { StyleSheet, View } from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated'
import { useRouter } from 'expo-router'
import { AppText } from '@/components/ui/AppText'
import { Button } from '@/components/ui/Button'
import { useAuth } from '@/services/AuthProvider'
import { spacing } from '@/theme/spacing'
import { palette } from '@/theme/types'

/** Flat cricket bat silhouette (blade + cane handle), not a racket / badminton shape. */
function CricketBat() {
  return (
    <View style={batStyles.root} accessibilityElementsHidden>
      <View style={batStyles.handle}>
        <View style={batStyles.gripStripe} />
        <View style={[batStyles.gripStripe, { top: 14 }]} />
        <View style={[batStyles.gripStripe, { top: 28 }]} />
        <View style={batStyles.knob} />
      </View>
      <View style={batStyles.shoulder} />
      <View style={batStyles.blade}>
        <View style={batStyles.spine} />
        <View style={batStyles.faceEdge} />
      </View>
    </View>
  )
}

function CricketBall() {
  return (
    <View style={ballStyles.root}>
      <View style={ballStyles.seam} />
      <View style={[ballStyles.seam, ballStyles.seamAlt]} />
    </View>
  )
}

export function WelcomeScreen() {
  const router = useRouter()
  const { markWelcomeSeen } = useAuth()
  const ballX = useSharedValue(-120)
  const ballY = useSharedValue(0)
  const batRotate = useSharedValue(-28)
  const hitScale = useSharedValue(0)
  const titleOpacity = useSharedValue(0)

  useEffect(() => {
    ballX.value = withRepeat(
      withSequence(
        withTiming(40, { duration: 900, easing: Easing.inOut(Easing.quad) }),
        withTiming(160, { duration: 350, easing: Easing.out(Easing.cubic) }),
        withTiming(-120, { duration: 0 }),
      ),
      -1,
      false,
    )
    ballY.value = withRepeat(
      withSequence(
        withTiming(8, { duration: 900 }),
        withTiming(-70, { duration: 350, easing: Easing.out(Easing.cubic) }),
        withTiming(0, { duration: 0 }),
      ),
      -1,
      false,
    )
    batRotate.value = withRepeat(
      withSequence(
        withDelay(750, withTiming(32, { duration: 180 })),
        withTiming(-28, { duration: 500 }),
      ),
      -1,
      false,
    )
    hitScale.value = withRepeat(
      withSequence(
        withDelay(900, withTiming(1, { duration: 120 })),
        withTiming(0, { duration: 400 }),
      ),
      -1,
      false,
    )
    titleOpacity.value = withDelay(300, withTiming(1, { duration: 700 }))
  }, [ballX, ballY, batRotate, hitScale, titleOpacity])

  const ballStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: ballX.value }, { translateY: ballY.value }],
  }))
  const batStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${batRotate.value}deg` }],
  }))
  const hitStyle = useAnimatedStyle(() => ({
    opacity: hitScale.value,
    transform: [{ scale: 0.6 + hitScale.value }],
  }))
  const titleStyle = useAnimatedStyle(() => ({ opacity: titleOpacity.value }))

  const continueToLogin = async () => {
    await markWelcomeSeen()
    router.replace('/login')
  }

  return (
    <LinearGradient
      colors={[palette.indigo, palette.magenta, palette.rose, palette.coral]}
      locations={[0, 0.4, 0.75, 1]}
      style={styles.root}
    >
      <Animated.View style={[styles.copy, titleStyle]}>
        <AppText variant="hero" weight="700" color="#FFFFFF" style={{ textAlign: 'center' }}>
          Kansara Premier League
        </AppText>
        <AppText color="#FFE8C8" style={{ textAlign: 'center' }}>
          Community cricket. Live matches. Auctions. One league.
        </AppText>
      </Animated.View>

      <View style={styles.stage} accessibilityLabel="Bowling and batting animation">
        <View style={styles.pitch} />
        <Animated.View style={[styles.batWrap, batStyle]}>
          <CricketBat />
        </Animated.View>
        <Animated.View style={[styles.ballWrap, ballStyle]}>
          <CricketBall />
        </Animated.View>
        <Animated.View style={[styles.hit, hitStyle]}>
          <AppText weight="700" color={palette.highlight}>
            FOUR!
          </AppText>
        </Animated.View>
      </View>

      <View style={styles.footer}>
        <Button label="Get started" onPress={continueToLogin} />
        <AppText variant="caption" color="#FFD6A8" style={{ textAlign: 'center' }}>
          Membership is for KPL community members and requires admin approval.
        </AppText>
      </View>
    </LinearGradient>
  )
}

const batStyles = StyleSheet.create({
  root: {
    alignItems: 'center',
    width: 56,
  },
  handle: {
    width: 12,
    height: 52,
    borderRadius: 4,
    backgroundColor: '#5C3A21',
    overflow: 'hidden',
    alignItems: 'center',
  },
  gripStripe: {
    position: 'absolute',
    width: '100%',
    height: 4,
    backgroundColor: 'rgba(233, 173, 69, 0.55)',
    top: 0,
  },
  knob: {
    position: 'absolute',
    top: -4,
    width: 16,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#4A2F1A',
  },
  shoulder: {
    width: 28,
    height: 10,
    borderTopLeftRadius: 4,
    borderTopRightRadius: 4,
    backgroundColor: '#C4A35A',
    marginTop: -2,
  },
  blade: {
    width: 44,
    height: 88,
    borderBottomLeftRadius: 22,
    borderBottomRightRadius: 22,
    borderTopLeftRadius: 4,
    borderTopRightRadius: 4,
    backgroundColor: '#feb148',
    overflow: 'hidden',
    alignItems: 'center',
  },
  spine: {
    position: 'absolute',
    top: 8,
    bottom: 16,
    width: 3,
    borderRadius: 2,
    backgroundColor: 'rgba(92, 58, 33, 0.28)',
  },
  faceEdge: {
    position: 'absolute',
    left: 4,
    top: 6,
    bottom: 12,
    width: 2,
    borderRadius: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
  },
})

const ballStyles = StyleSheet.create({
  root: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#B91C1C',
    borderWidth: 1,
    borderColor: '#7F1D1D',
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  seam: {
    position: 'absolute',
    width: 2,
    height: '100%',
    backgroundColor: '#F8FAFC',
    transform: [{ rotate: '18deg' }],
  },
  seamAlt: {
    transform: [{ rotate: '-18deg' }],
    opacity: 0.85,
  },
})

const styles = StyleSheet.create({
  root: {
    flex: 1,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.xxl,
    justifyContent: 'space-between',
  },
  copy: { gap: spacing.md, marginTop: spacing.xxl },
  stage: {
    height: 220,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pitch: {
    position: 'absolute',
    bottom: 36,
    width: '80%',
    height: 8,
    borderRadius: 8,
    backgroundColor: 'rgba(254, 177, 72, 0.45)',
  },
  batWrap: {
    position: 'absolute',
    right: 52,
    bottom: 40,
    alignItems: 'center',
  },
  ballWrap: {
    position: 'absolute',
    left: 40,
    bottom: 56,
  },
  hit: {
    position: 'absolute',
    top: 24,
  },
  footer: { gap: spacing.md, marginBottom: spacing.lg },
})
