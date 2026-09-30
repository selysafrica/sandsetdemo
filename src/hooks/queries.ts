import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { dossiersService } from '@/services/dossiers.service'
import { enterprisesService } from '@/services/enterprises.service'
import { habilitationsService } from '@/services/habilitations.service'
import { kitService } from '@/services/kit.service'
import { licenciesService } from '@/services/licencies.service'
import { notificationsService } from '@/services/notifications.service'
import { royaltiesService } from '@/services/royalties.service'
import { systemService } from '@/services/system.service'
import { tenantService } from '@/services/tenant.service'
import { assessmentsService, documentsService, tasksService, trainingsService } from '@/services/workspace.service'

export const qk = {
  network: ['network'] as const,
  licencies: ['licencies'] as const,
  licencie: (id: string) => ['licencies', id] as const,
  licencieHistory: (id: string) => ['licencies', id, 'history'] as const,
  grid: ['grid'] as const,
  gridHistory: ['grid', 'history'] as const,
  ledger: (id?: string) => ['ledger', id ?? 'all'] as const,
  payments: (id?: string) => ['payments', id ?? 'all'] as const,
  reminders: (id?: string) => ['reminders', id ?? 'all'] as const,
  habilitations: (id?: string) => ['habilitations', id ?? 'all'] as const,
  kitVersions: ['kit'] as const,
  kitVersion: (id: string) => ['kit', id] as const,
  adoption: ['kit', 'adoption'] as const,
  enterprises: ['enterprises'] as const,
  enterprise: (id: string) => ['enterprises', id] as const,
  myEnterprise: ['enterprises', 'mine'] as const,
  settings: ['settings'] as const,
  accessLogs: ['accessLogs'] as const,
  imports: ['imports'] as const,
  dossiers: ['dossiers'] as const,
  dossier: (id: string) => ['dossiers', id] as const,
  myDossier: ['dossiers', 'mine'] as const,
  assessments: (id: string) => ['assessments', id] as const,
  tasks: (id: string) => ['tasks', id] as const,
  myTasks: ['tasks', 'mine'] as const,
  documents: (id: string) => ['documents', id] as const,
  sessions: (id: string) => ['sessions', id] as const,
  tenantUsers: ['tenant', 'users'] as const,
  team: ['tenant', 'team'] as const,
  ownLedger: ['tenant', 'ledger'] as const,
  declarations: ['tenant', 'declarations'] as const,
  tenantActivity: ['tenant', 'activity'] as const,
  notifications: ['notifications'] as const,
}

export function useNetworkOverview() {
  return useQuery({ queryKey: qk.network, queryFn: systemService.networkOverview })
}
export function useLicencies() {
  return useQuery({ queryKey: qk.licencies, queryFn: licenciesService.list })
}
export function useLicencie(id: string) {
  return useQuery({ queryKey: qk.licencie(id), queryFn: () => licenciesService.get(id) })
}
export function useLicencieHistory(id: string) {
  return useQuery({ queryKey: qk.licencieHistory(id), queryFn: () => licenciesService.history(id) })
}
export function useGrid() {
  return useQuery({ queryKey: qk.grid, queryFn: royaltiesService.grid })
}
export function useGridHistory() {
  return useQuery({ queryKey: qk.gridHistory, queryFn: royaltiesService.gridHistory })
}
export function useLedger(licencieId?: string) {
  return useQuery({ queryKey: qk.ledger(licencieId), queryFn: () => royaltiesService.ledger(licencieId) })
}
export function usePayments(licencieId?: string) {
  return useQuery({ queryKey: qk.payments(licencieId), queryFn: () => royaltiesService.payments(licencieId) })
}
export function useReminders(licencieId?: string) {
  return useQuery({ queryKey: qk.reminders(licencieId), queryFn: () => royaltiesService.reminders(licencieId) })
}
export function useHabilitations(licencieId?: string) {
  return useQuery({ queryKey: qk.habilitations(licencieId), queryFn: () => habilitationsService.list(licencieId) })
}
export function useKitVersions() {
  return useQuery({ queryKey: qk.kitVersions, queryFn: kitService.list })
}
export function useKitVersion(id: string) {
  return useQuery({ queryKey: qk.kitVersion(id), queryFn: () => kitService.get(id) })
}
export function useAdoption() {
  return useQuery({ queryKey: qk.adoption, queryFn: kitService.adoption })
}
export function useEnterprises() {
  return useQuery({ queryKey: qk.enterprises, queryFn: enterprisesService.list })
}
export function useEnterprise(id: string) {
  return useQuery({ queryKey: qk.enterprise(id), queryFn: () => enterprisesService.get(id) })
}
export function useMyEnterprise() {
  return useQuery({ queryKey: qk.myEnterprise, queryFn: enterprisesService.mine })
}
export function useSettings() {
  return useQuery({ queryKey: qk.settings, queryFn: systemService.settings })
}
export function useAccessLogs() {
  return useQuery({ queryKey: qk.accessLogs, queryFn: systemService.accessLogs })
}
export function useImports() {
  return useQuery({ queryKey: qk.imports, queryFn: systemService.imports })
}

export function useDossiers() {
  return useQuery({ queryKey: qk.dossiers, queryFn: dossiersService.list })
}
export function useDossier(id: string) {
  return useQuery({ queryKey: qk.dossier(id), queryFn: () => dossiersService.get(id), retry: false })
}
export function useMyDossier() {
  return useQuery({ queryKey: qk.myDossier, queryFn: dossiersService.mine })
}
export function useAssessments(dossierId: string) {
  return useQuery({ queryKey: qk.assessments(dossierId), queryFn: () => assessmentsService.list(dossierId), enabled: !!dossierId })
}
export function useTasks(dossierId: string) {
  return useQuery({ queryKey: qk.tasks(dossierId), queryFn: () => tasksService.list(dossierId) })
}
export function useMyTasks() {
  return useQuery({ queryKey: qk.myTasks, queryFn: tasksService.mine })
}
export function useDocuments(dossierId: string) {
  return useQuery({ queryKey: qk.documents(dossierId), queryFn: () => documentsService.list(dossierId) })
}
export function useSessions(dossierId: string) {
  return useQuery({ queryKey: qk.sessions(dossierId), queryFn: () => trainingsService.list(dossierId) })
}
export function useTenantUsers() {
  return useQuery({ queryKey: qk.tenantUsers, queryFn: tenantService.users })
}
export function useTeam() {
  return useQuery({ queryKey: qk.team, queryFn: tenantService.team })
}
export function useOwnLedger() {
  return useQuery({ queryKey: qk.ownLedger, queryFn: royaltiesService.ownLedger })
}
export function useDeclarations() {
  return useQuery({ queryKey: qk.declarations, queryFn: tenantService.declarations })
}
export function useTenantActivity() {
  return useQuery({ queryKey: qk.tenantActivity, queryFn: tenantService.activity })
}
export function useNotifications() {
  return useQuery({ queryKey: qk.notifications, queryFn: notificationsService.list, refetchInterval: 60_000 })
}

/** Mutation helper: toast on error, invalidates the given keys on success. */
export function useAppMutation<TVars, TResult>(
  fn: (vars: TVars) => Promise<TResult>,
  opts: { invalidate?: readonly (readonly unknown[])[]; success?: string | ((r: TResult) => string); onSuccess?: (r: TResult) => void } = {},
) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: fn,
    onSuccess: (r) => {
      for (const key of opts.invalidate ?? []) qc.invalidateQueries({ queryKey: key })
      if (opts.success) toast.success(typeof opts.success === 'function' ? opts.success(r) : opts.success)
      opts.onSuccess?.(r)
    },
    onError: (e: Error) => toast.error(e.message),
  })
}

/** Keys touched by any change inside a dossier workspace. */
export const workspaceKeys = (dossierId: string) => [qk.dossier(dossierId), qk.dossiers, qk.myDossier, qk.myTasks]
