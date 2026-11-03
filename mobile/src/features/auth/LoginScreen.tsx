import { useState } from 'react'
import { KeyboardAvoidingView, Platform, StyleSheet, TextInput, View } from 'react-native'
import { Link, useRouter } from 'expo-router'
import { AppText } from '@/components/ui/AppText'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Screen } from '@/components/ui/Screen'
import { isMobileAllowedToLogin } from '@/constants/config'
import { authApi } from '@/services/api/authApi'
import { ApiClientError } from '@/services/api/client'
import { useAuth } from '@/services/AuthProvider'
import { useTheme } from '@/theme/ThemeProvider'
import { radii, spacing } from '@/theme/spacing'

const LOGIN_BLOCKED_MESSAGE =
  'Login is temporarily limited to an approved test mobile number. Contact KPL admin if you need access.'

export function LoginScreen() {
  const { theme } = useTheme()
  const router = useRouter()
  const { signInWithTokens } = useAuth()
  const [mobile, setMobile] = useState('9726101600')
  const [otp, setOtp] = useState('')
  const [otpSent, setOtpSent] = useState(false)
  const [devOtp, setDevOtp] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const assertAllowedMobile = () => {
    if (!isMobileAllowedToLogin(mobile)) {
      setError(LOGIN_BLOCKED_MESSAGE)
      return false
    }
    return true
  }

  const completeLogin = async (accessToken: string, refreshToken: string, user: Parameters<typeof signInWithTokens>[2]) => {
    await signInWithTokens(accessToken, refreshToken, user)
    router.replace('/(tabs)')
  }

  /** One-step path for the allowlisted test mobile: request OTP and auto-verify when Dev OTP is returned. */
  const continueToDashboard = async () => {
    setError('')
    if (!assertAllowedMobile()) return
    setLoading(true)
    try {
      const requested = await authApi.requestOtp(mobile.trim())
      const code = requested.data.devOtp
      if (code) {
        const verified = await authApi.verifyOtp(mobile.trim(), code)
        await completeLogin(verified.data.accessToken, verified.data.refreshToken, verified.data.user)
        return
      }
      setOtpSent(true)
      setDevOtp(null)
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : 'Could not sign in')
    } finally {
      setLoading(false)
    }
  }

  const requestOtp = async () => {
    setError('')
    if (!assertAllowedMobile()) return
    setLoading(true)
    try {
      const res = await authApi.requestOtp(mobile.trim())
      setOtpSent(true)
      setDevOtp(res.data.devOtp ?? null)
      if (res.data.devOtp) setOtp(res.data.devOtp)
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : 'Could not send OTP')
    } finally {
      setLoading(false)
    }
  }

  const verifyOtp = async () => {
    setError('')
    if (!assertAllowedMobile()) return
    setLoading(true)
    try {
      const res = await authApi.verifyOtp(mobile.trim(), otp.trim())
      await completeLogin(res.data.accessToken, res.data.refreshToken, res.data.user)
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : 'Could not verify OTP')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Screen scroll>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={styles.header}>
          <AppText variant="title" weight="700" color={theme.colors.primary}>
            Welcome back
          </AppText>
          <AppText muted>
            Enter your mobile number to open the KPL dashboard. New members register below and wait for admin
            approval.
          </AppText>
        </View>

        <Card style={styles.card}>
          <AppText weight="600">Mobile number</AppText>
          <TextInput
            value={mobile}
            onChangeText={setMobile}
            keyboardType="phone-pad"
            placeholder="e.g. 9726101600"
            placeholderTextColor={theme.colors.textSecondary}
            style={[styles.input, { borderColor: theme.colors.border, color: theme.colors.text }]}
            editable={!loading}
          />

          {otpSent ? (
            <>
              <AppText weight="600">OTP</AppText>
              <TextInput
                value={otp}
                onChangeText={setOtp}
                keyboardType="number-pad"
                maxLength={6}
                placeholder="6-digit code"
                placeholderTextColor={theme.colors.textSecondary}
                style={[styles.input, { borderColor: theme.colors.border, color: theme.colors.text }]}
                editable={!loading}
              />
              {devOtp ? (
                <AppText variant="caption" muted>
                  Dev OTP: {devOtp}
                </AppText>
              ) : null}
            </>
          ) : null}

          {error ? (
            <AppText color={theme.colors.danger} variant="caption">
              {error}
            </AppText>
          ) : null}

          {!otpSent ? (
            <Button
              label={loading ? 'Signing in…' : 'Continue to dashboard'}
              onPress={continueToDashboard}
              disabled={loading || !mobile.trim()}
            />
          ) : (
            <>
              <Button
                label={loading ? 'Verifying…' : 'Verify & login'}
                onPress={verifyOtp}
                disabled={loading || otp.trim().length !== 6}
              />
              <Button label="Resend OTP" variant="ghost" onPress={requestOtp} disabled={loading} />
            </>
          )}
        </Card>

        <View style={styles.footer}>
          <AppText muted>Don&apos;t have an account?</AppText>
          <Link href="/register">
            <AppText weight="700" color={theme.colors.primary}>
              Register for KPL
            </AppText>
          </Link>
        </View>
      </KeyboardAvoidingView>
    </Screen>
  )
}

const styles = StyleSheet.create({
  header: { gap: spacing.sm, marginTop: spacing.lg },
  card: { gap: spacing.md, marginTop: spacing.lg },
  input: {
    borderWidth: 1,
    borderRadius: radii.md,
    minHeight: 48,
    paddingHorizontal: spacing.md,
    fontFamily: 'Poppins_400Regular',
    fontSize: 16,
  },
  footer: {
    marginTop: spacing.xl,
    alignItems: 'center',
    gap: spacing.sm,
  },
})
