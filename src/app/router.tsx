import { lazy, Suspense, type ComponentType, type LazyExoticComponent } from 'react'
import { createBrowserRouter, Navigate } from 'react-router-dom'
import { PageSkeleton } from '@/components/common/states'
import { AuthLayout } from '@/layouts/AuthLayout'
import { ConsoleLayout } from '@/layouts/ConsoleLayout'
import { DossierLayout } from '@/layouts/DossierLayout'
import { EnterpriseLayout } from '@/layouts/EnterpriseLayout'
import { RootLayout } from '@/layouts/RootLayout'
import { TenantLayout } from '@/layouts/TenantLayout'
import { RedirectIfAuthenticated, RequireAuth } from './guards'
import { RouteError } from '@/features/auth/pages/StatusPages'

function page<T extends ComponentType>(loader: () => Promise<{ default: T }>) {
  const C = lazy(loader) as LazyExoticComponent<ComponentType>
  return (
    <Suspense fallback={<PageSkeleton />}>
      <C />
    </Suspense>
  )
}

const named = <K extends string>(p: Promise<Record<K, ComponentType>>, key: K) => p.then((m) => ({ default: m[key] }))

const kitRoutes = [
  { index: true, element: <Navigate to="vue-ensemble" replace /> },
  { path: 'vue-ensemble', element: page(() => named(import('@/features/kit/overview/OverviewPage'), 'OverviewPage')) },
  { path: 'analyse-ecart', element: page(() => named(import('@/features/kit/gap-analysis/GapAnalysisPage'), 'GapAnalysisPage')) },
  { path: 'plan', element: page(() => named(import('@/features/kit/transition-plan/PlanPage'), 'PlanPage')) },
  { path: 'documents', element: page(() => named(import('@/features/kit/documents/DocumentsPage'), 'DocumentsPage')) },
  { path: 'formations', element: page(() => named(import('@/features/kit/trainings/TrainingsPage'), 'TrainingsPage')) },
  { path: 'rapport', element: page(() => named(import('@/features/kit/report/ReportPage'), 'ReportPage')) },
]

const common = [
  { path: 'notifications', element: page(() => named(import('@/features/notifications/NotificationsPage'), 'NotificationsPage')) },
  { path: 'profil', element: page(() => named(import('@/features/profile/ProfilePage'), 'ProfilePage')) },
]

export const router = createBrowserRouter([
  {
    element: <RootLayout />,
    errorElement: <RouteError />,
    children: [
      { path: '/', element: page(() => named(import('@/features/public/LandingPage'), 'LandingPage')) },
      {
        element: (
          <RedirectIfAuthenticated>
            <AuthLayout />
          </RedirectIfAuthenticated>
        ),
        children: [
          { path: '/connexion', element: page(() => named(import('@/features/auth/pages/LoginPage'), 'LoginPage')) },
          { path: '/connexion/2fa', element: page(() => named(import('@/features/auth/pages/TwoFactorPage'), 'TwoFactorPage')) },
          { path: '/mot-de-passe-oublie', element: page(() => named(import('@/features/auth/pages/PasswordPages'), 'ForgotPasswordPage')) },
          { path: '/reinitialiser', element: page(() => named(import('@/features/auth/pages/PasswordPages'), 'ResetPasswordPage')) },
        ],
      },
      {
        element: (
          <RedirectIfAuthenticated>
            <AuthLayout wide />
          </RedirectIfAuthenticated>
        ),
        children: [{ path: '/inscription', element: page(() => named(import('@/features/enterprise/signup/SignupPage'), 'SignupPage')) }],
      },
      { path: '/bienvenue-entreprise', element: page(() => named(import('@/features/enterprise/signup/SignupPage'), 'SignupWelcome')) },
      { path: '/suspendu', element: page(() => named(import('@/features/auth/pages/StatusPages'), 'SuspendedPage')) },
      { path: '/403', element: page(() => named(import('@/features/auth/pages/StatusPages'), 'ForbiddenPage')) },
      { path: '/design-system', element: page(() => named(import('@/features/public/DesignSystemPage'), 'DesignSystemPage')) },
      {
        path: '/console',
        element: (
          <RequireAuth roles={['ADMIN_CONCESSIONNAIRE']}>
            <ConsoleLayout />
          </RequireAuth>
        ),
        children: [
          { index: true, element: page(() => named(import('@/features/console/dashboard/ConsoleDashboardPage'), 'ConsoleDashboardPage')) },
          { path: 'licencies', element: page(() => named(import('@/features/console/licencies/LicenciesPage'), 'LicenciesPage')) },
          { path: 'licencies/:id', element: page(() => named(import('@/features/console/licencies/LicencieDetailPage'), 'LicencieDetailPage')) },
          { path: 'entreprises', element: page(() => named(import('@/features/console/entreprises/EntreprisesPage'), 'EntreprisesPage')) },
          { path: 'entreprises/:id', element: page(() => named(import('@/features/console/entreprises/EntrepriseDetailPage'), 'EntrepriseDetailPage')) },
          { path: 'redevances/grille', element: page(() => named(import('@/features/console/redevances/GridPage'), 'GridPage')) },
          { path: 'redevances/journal', element: page(() => named(import('@/features/console/redevances/JournalPage'), 'JournalPage')) },
          { path: 'habilitations', element: page(() => named(import('@/features/console/habilitations/HabilitationsPage'), 'HabilitationsPage')) },
          { path: 'kit', element: page(() => named(import('@/features/console/kit-versions/KitVersionsPage'), 'KitVersionsPage')) },
          { path: 'kit/:versionId', element: page(() => named(import('@/features/console/kit-versions/KitEditorPage'), 'KitEditorPage')) },
          { path: 'import', element: page(() => named(import('@/features/console/import/ImportPage'), 'ImportPage')) },
          { path: 'parametres', element: page(() => named(import('@/features/console/settings/SettingsPage'), 'SettingsPage')) },
          { path: 'journal-acces', element: page(() => named(import('@/features/console/settings/AccessLogPage'), 'AccessLogPage')) },
          ...common,
        ],
      },
      {
        path: '/app',
        element: (
          <RequireAuth roles={['LICENCIE_ADMIN', 'LICENCIE_USER']}>
            <TenantLayout />
          </RequireAuth>
        ),
        children: [
          { index: true, element: page(() => named(import('@/features/tenant/dashboard/TenantHomePage'), 'TenantHomePage')) },
          { path: 'bienvenue', element: page(() => named(import('@/features/tenant/onboarding/OnboardingPage'), 'OnboardingPage')) },
          { path: 'dossiers', element: page(() => named(import('@/features/tenant/dossiers/DossiersPage'), 'DossiersPage')) },
          { path: 'dossiers/:dossierId', element: <DossierLayout mode="tenant" />, children: kitRoutes },
          { path: 'mes-taches', element: page(() => named(import('@/features/consultant/MyTasksPage'), 'MyTasksPage')) },
          { path: 'utilisateurs', element: page(() => named(import('@/features/tenant/users/UsersPage'), 'UsersPage')) },
          { path: 'marque', element: page(() => named(import('@/features/tenant/branding/BrandingPage'), 'BrandingPage')) },
          { path: 'redevances', element: page(() => named(import('@/features/tenant/redevances/TenantRoyaltiesPage'), 'TenantRoyaltiesPage')) },
          { path: 'declarations', element: page(() => named(import('@/features/tenant/declarations/DeclarationsPage'), 'DeclarationsPage')) },
          { path: 'support', element: page(() => named(import('@/features/enterprise/support/SupportPage'), 'SupportPage')) },
          ...common,
        ],
      },
      {
        path: '/espace',
        element: (
          <RequireAuth roles={['ENTREPRISE']}>
            <EnterpriseLayout />
          </RequireAuth>
        ),
        children: [
          { index: true, element: page(() => named(import('@/features/enterprise/dashboard/EnterpriseDashboardPage'), 'EnterpriseDashboardPage')) },
          { path: 'dossier', element: <DossierLayout mode="enterprise" />, children: kitRoutes },
          { path: 'abonnement', element: page(() => named(import('@/features/enterprise/billing/BillingPage'), 'BillingPage')) },
          { path: 'support', element: page(() => named(import('@/features/enterprise/support/SupportPage'), 'SupportPage')) },
          ...common,
        ],
      },
      { path: '*', element: page(() => named(import('@/features/auth/pages/StatusPages'), 'NotFoundPage')) },
    ],
  },
])
