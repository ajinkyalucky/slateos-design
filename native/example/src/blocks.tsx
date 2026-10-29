import type { ReactElement } from 'react';
import { router } from 'expo-router';
import meta from '../../lib/blocks/blocks.json';
import { DashboardScreen } from '../../lib/blocks/dashboard';
import { ForgotPasswordScreen } from '../../lib/blocks/forgot-password';
import { InboxScreen } from '../../lib/blocks/inbox';
import { OnboardingScreen } from '../../lib/blocks/onboarding';
import { PaywallScreen } from '../../lib/blocks/paywall';
import { ProfileScreen } from '../../lib/blocks/profile';
import { SettingsScreen } from '../../lib/blocks/settings';
import { SidebarScreen } from '../../lib/blocks/sidebar';
import { SignInScreen } from '../../lib/blocks/sign-in';
import { SignUpScreen } from '../../lib/blocks/sign-up';
import { VerifyCodeScreen } from '../../lib/blocks/verify-code';

const back = () => router.back();
const wait = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

// Each block, wired so its buttons do something sensible in the showcase.
const renders: Record<string, (shot: boolean) => ReactElement> = {
  'sign-in': () => <SignInScreen onSubmit={() => wait(900)} onSignUp={() => router.replace('/block/sign-up')} onForgotPassword={() => router.replace('/block/forgot-password')} />,
  'sign-up': () => <SignUpScreen onBack={back} onSubmit={() => wait(900)} onSignIn={() => router.replace('/block/sign-in')} />,
  'verify-code': () => <VerifyCodeScreen onBack={back} onVerify={async (c) => { await wait(600); return c === '123456'; }} />,
  'forgot-password': () => <ForgotPasswordScreen onBack={back} onSubmit={() => wait(900)} />,
  onboarding: () => <OnboardingScreen onDone={back} />,
  dashboard: () => <DashboardScreen onOpenProfile={() => router.replace('/block/profile')} />,
  sidebar: (shot) => <SidebarScreen defaultOpen={shot} onOpenSettings={() => router.replace('/block/settings')} />,
  inbox: () => <InboxScreen />,
  settings: () => <SettingsScreen onSignOut={back} />,
  profile: () => <ProfileScreen onBack={back} />,
  paywall: () => <PaywallScreen onClose={back} onSubscribe={() => wait(1200)} />,
};

export type BlockInfo = (typeof meta.blocks)[number] & { render: (shot?: boolean) => ReactElement };
export const blocks: BlockInfo[] = meta.blocks.map((b) => ({ ...b, render: (shot = false) => renders[b.name](shot) }));
export const blockByName = Object.fromEntries(blocks.map((b) => [b.name, b]));
export const blockCategories = [...new Set(blocks.map((b) => b.category))];
