/// <reference types="npm:@types/react@18.3.1" />

import * as React from 'npm:react@18.3.1'

import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Text,
  Hr,
} from 'npm:@react-email/components@0.0.22'

interface RecoveryEmailProps {
  siteName: string
  confirmationUrl: string
}

export const RecoveryEmail = ({
  siteName,
  confirmationUrl,
}: RecoveryEmailProps) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>Reset your SubIn password</Preview>
    <Body style={main}>
      <Container style={container}>
        <Text style={logoText}>Sub<span style={logoAccent}>In</span></Text>
        <Heading style={h1}>Reset your password</Heading>
        <Text style={text}>
          We received a request to reset your SubIn password. Click the button below to choose a new password.
        </Text>
        <Button style={button} href={confirmationUrl}>
          Reset Password
        </Button>
        <Hr style={hr} />
        <Text style={footer}>
          If you didn't request a password reset, you can safely ignore this email. Your password will not be changed.
        </Text>
        <Text style={unsubscribe}>SubIn · Subletting made simple</Text>
      </Container>
    </Body>
  </Html>
)

export default RecoveryEmail

const main = { backgroundColor: '#ffffff', fontFamily: "'DM Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" }
const container = { padding: '40px 32px', maxWidth: '560px', margin: '0 auto' }
const logoText = { fontSize: '24px', fontWeight: 'bold' as const, color: '#1a1a2e', margin: '0 0 32px' }
const logoAccent = { color: '#4f46e5' }
const h1 = { fontSize: '24px', fontWeight: 'bold' as const, color: '#1a1a2e', margin: '0 0 16px' }
const text = { fontSize: '15px', color: '#4b5563', lineHeight: '1.6', margin: '0 0 24px' }
const button = {
  backgroundColor: '#4f46e5',
  color: '#ffffff',
  fontSize: '15px',
  fontWeight: '600' as const,
  borderRadius: '10px',
  padding: '14px 28px',
  textDecoration: 'none',
  display: 'inline-block' as const,
}
const hr = { borderColor: '#e5e7eb', margin: '32px 0' }
const footer = { fontSize: '13px', color: '#9ca3af', lineHeight: '1.5', margin: '0 0 8px' }
const unsubscribe = { fontSize: '12px', color: '#9ca3af', margin: '0' }
