/// <reference types="npm:@types/react@18.3.1" />

import * as React from 'npm:react@18.3.1'

import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Text,
  Hr,
} from 'npm:@react-email/components@0.0.22'

interface ReauthenticationEmailProps {
  token: string
}

export const ReauthenticationEmail = ({ token }: ReauthenticationEmailProps) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>Your SubIn verification code</Preview>
    <Body style={main}>
      <Container style={container}>
        <Text style={logoText}>Sub<span style={logoAccent}>In</span></Text>
        <Heading style={h1}>Your verification code</Heading>
        <Text style={text}>Use the code below to confirm your identity on SubIn:</Text>
        <Text style={codeStyle}>{token}</Text>
        <Hr style={hr} />
        <Text style={footer}>
          This code will expire shortly. If you didn't request this, you can safely ignore this email.
        </Text>
        <Text style={unsubscribe}>SubIn · Subletting made simple</Text>
      </Container>
    </Body>
  </Html>
)

export default ReauthenticationEmail

const main = { backgroundColor: '#ffffff', fontFamily: "'DM Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" }
const container = { padding: '40px 32px', maxWidth: '560px', margin: '0 auto' }
const logoText = { fontSize: '24px', fontWeight: 'bold' as const, color: '#1a1a2e', margin: '0 0 32px' }
const logoAccent = { color: '#4f46e5' }
const h1 = { fontSize: '24px', fontWeight: 'bold' as const, color: '#1a1a2e', margin: '0 0 16px' }
const text = { fontSize: '15px', color: '#4b5563', lineHeight: '1.6', margin: '0 0 24px' }
const codeStyle = {
  fontFamily: "'DM Sans', Courier, monospace",
  fontSize: '32px',
  fontWeight: 'bold' as const,
  color: '#4f46e5',
  letterSpacing: '4px',
  margin: '0 0 32px',
}
const hr = { borderColor: '#e5e7eb', margin: '32px 0' }
const footer = { fontSize: '13px', color: '#9ca3af', lineHeight: '1.5', margin: '0 0 8px' }
const unsubscribe = { fontSize: '12px', color: '#9ca3af', margin: '0' }
