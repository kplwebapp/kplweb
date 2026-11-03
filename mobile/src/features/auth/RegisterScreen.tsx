import { useMemo, useState } from 'react'
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  TextInput,
  View,
} from 'react-native'
import { Link, useRouter } from 'expo-router'
import { AppText } from '@/components/ui/AppText'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Screen } from '@/components/ui/Screen'
import { BLOOD_GROUP_OPTIONS, VIBHAAG_OPTIONS } from '@/constants/profileOptions'
import { authApi } from '@/services/api/authApi'
import { ApiClientError } from '@/services/api/client'
import { useTheme } from '@/theme/ThemeProvider'
import { radii, spacing } from '@/theme/spacing'

type FormState = {
  firstName: string
  middleName: string
  lastName: string
  email: string
  mobile: string
  dateOfBirth: string
  vibhaag: string
  bloodGroup: string
  password: string
  confirmPassword: string
}

const empty: FormState = {
  firstName: '',
  middleName: '',
  lastName: '',
  email: '',
  mobile: '',
  dateOfBirth: '',
  vibhaag: '',
  bloodGroup: '',
  password: '',
  confirmPassword: '',
}

export function RegisterScreen() {
  const { theme } = useTheme()
  const router = useRouter()
  const [form, setForm] = useState<FormState>(empty)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const inputStyle = useMemo(
    () => [styles.input, { borderColor: theme.colors.border, color: theme.colors.text }],
    [theme.colors.border, theme.colors.text],
  )

  const setField = (key: keyof FormState, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  const submit = async () => {
    setError('')
    if (!form.firstName.trim() || !form.middleName.trim() || !form.lastName.trim()) {
      setError('Enter your full name')
      return
    }
    if (!form.email.trim() || !form.mobile.trim()) {
      setError('Email and mobile are required')
      return
    }
    if (!form.dateOfBirth || !form.vibhaag || !form.bloodGroup) {
      setError('Date of birth, vibhaag, and blood group are required')
      return
    }
    if (form.password.length < 8) {
      setError('Password must be at least 8 characters')
      return
    }
    if (form.password !== form.confirmPassword) {
      setError('Passwords do not match')
      return
    }

    setLoading(true)
    try {
      await authApi.register({
        firstName: form.firstName.trim(),
        middleName: form.middleName.trim(),
        lastName: form.lastName.trim(),
        email: form.email.trim(),
        mobile: form.mobile.trim(),
        dateOfBirth: form.dateOfBirth.trim(),
        vibhaag: form.vibhaag,
        bloodGroup: form.bloodGroup,
        password: form.password,
      })
      router.replace('/pending-approval')
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : 'Registration failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Screen scroll>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={styles.header}>
          <AppText variant="title" weight="700" color={theme.colors.primary}>
            Register
          </AppText>
          <AppText muted>
            KPL membership is for community members only. After you submit, a super admin must approve your account
            before you can sign in.
          </AppText>
        </View>

        <Card style={styles.card}>
          <Field label="First name" value={form.firstName} onChange={(v) => setField('firstName', v)} style={inputStyle} />
          <Field label="Middle name" value={form.middleName} onChange={(v) => setField('middleName', v)} style={inputStyle} />
          <Field label="Last name" value={form.lastName} onChange={(v) => setField('lastName', v)} style={inputStyle} />
          <Field
            label="Email"
            value={form.email}
            onChange={(v) => setField('email', v)}
            style={inputStyle}
            keyboardType="email-address"
            autoCapitalize="none"
          />
          <Field
            label="Mobile"
            value={form.mobile}
            onChange={(v) => setField('mobile', v)}
            style={inputStyle}
            keyboardType="phone-pad"
          />
          <Field
            label="Date of birth (YYYY-MM-DD)"
            value={form.dateOfBirth}
            onChange={(v) => setField('dateOfBirth', v)}
            style={inputStyle}
            placeholder="1995-08-15"
          />

          <AppText weight="600">Vibhaag</AppText>
          <ChipRow
            options={[...VIBHAAG_OPTIONS]}
            value={form.vibhaag}
            onChange={(v) => setField('vibhaag', v)}
          />

          <AppText weight="600">Blood group</AppText>
          <ChipRow
            options={[...BLOOD_GROUP_OPTIONS]}
            value={form.bloodGroup}
            onChange={(v) => setField('bloodGroup', v)}
          />

          <Field
            label="Password"
            value={form.password}
            onChange={(v) => setField('password', v)}
            style={inputStyle}
            secureTextEntry
          />
          <Field
            label="Confirm password"
            value={form.confirmPassword}
            onChange={(v) => setField('confirmPassword', v)}
            style={inputStyle}
            secureTextEntry
          />

          {error ? (
            <AppText color={theme.colors.danger} variant="caption">
              {error}
            </AppText>
          ) : null}

          <Button label={loading ? 'Submitting…' : 'Submit registration'} onPress={submit} disabled={loading} />
        </Card>

        <View style={styles.footer}>
          <AppText muted>Already registered?</AppText>
          <Link href="/login">
            <AppText weight="700" color={theme.colors.primary}>
              Login with OTP
            </AppText>
          </Link>
        </View>
      </KeyboardAvoidingView>
    </Screen>
  )
}

function Field({
  label,
  value,
  onChange,
  style,
  ...rest
}: {
  label: string
  value: string
  onChange: (value: string) => void
  style: object[]
  placeholder?: string
  keyboardType?: 'default' | 'email-address' | 'phone-pad'
  autoCapitalize?: 'none' | 'sentences'
  secureTextEntry?: boolean
}) {
  const { theme } = useTheme()
  return (
    <View style={{ gap: 6 }}>
      <AppText weight="600">{label}</AppText>
      <TextInput
        value={value}
        onChangeText={onChange}
        placeholderTextColor={theme.colors.textSecondary}
        style={style}
        {...rest}
      />
    </View>
  )
}

function ChipRow({
  options,
  value,
  onChange,
}: {
  options: string[]
  value: string
  onChange: (value: string) => void
}) {
  const { theme } = useTheme()
  return (
    <View style={styles.chips}>
      {options.map((option) => {
        const active = option === value
        return (
          <Pressable
            key={option}
            onPress={() => onChange(option)}
            style={[
              styles.chip,
              {
                backgroundColor: active ? theme.colors.primary : theme.colors.surface,
                borderColor: active ? theme.colors.primary : theme.colors.border,
              },
            ]}
          >
            <AppText variant="caption" weight="600" color={active ? '#FFFFFF' : theme.colors.text}>
              {option}
            </AppText>
          </Pressable>
        )
      })}
    </View>
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
    fontSize: 15,
  },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  chip: {
    borderWidth: 1,
    borderRadius: radii.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    minHeight: 36,
    justifyContent: 'center',
  },
  footer: {
    marginTop: spacing.xl,
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.xxl,
  },
})
