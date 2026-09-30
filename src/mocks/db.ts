import type {
  AccessLog,
  ActivityEvent,
  AppNotification,
  Audit,
  ClauseAssessment,
  Declaration,
  Dossier,
  DossierDocument,
  Enterprise,
  Habilitation,
  ImportRecord,
  Invoice,
  KitVersion,
  Licencie,
  Payment,
  Reminder,
  RoyaltyGrid,
  RoyaltyLine,
  Task,
  TrainingSession,
  User,
} from '@/types/domain'
import { buildActivity, buildImports, buildNotifications } from './data/activity.seed'
import { buildDeclarations, buildDossiers } from './data/dossiers.seed'
import { buildAccessLogs, buildEnterprises, buildNetwork, GRID_HISTORY, ROYALTY_GRID } from './data/network.seed'
import { buildKitVersions } from './data/socle.seed'

export interface Database {
  users: User[]
  licencies: Licencie[]
  enterprises: Enterprise[]
  invoices: Invoice[]
  grid: RoyaltyGrid
  gridHistory: typeof GRID_HISTORY
  royaltyLines: RoyaltyLine[]
  payments: Payment[]
  reminders: Reminder[]
  habilitations: Habilitation[]
  audits: Audit[]
  kitVersions: KitVersion[]
  dossiers: Dossier[]
  assessments: ClauseAssessment[]
  tasks: Task[]
  documents: DossierDocument[]
  sessions: TrainingSession[]
  declarations: Declaration[]
  notifications: AppNotification[]
  accessLogs: AccessLog[]
  activity: ActivityEvent[]
  imports: ImportRecord[]
  settings: {
    autoReminders: boolean
    enforce2faAdmins: boolean
    sessionMinutes: number
    lockAfterFailures: number
    lastBackupAt: string
  }
}

const STORAGE_KEY = 'standset-demo-v1'

function seed(): Database {
  const network = buildNetwork()
  const { enterprises, invoices } = buildEnterprises()
  const kitVersions = buildKitVersions()
  const dossiers = buildDossiers(kitVersions, network.users)
  return {
    ...network,
    enterprises,
    invoices,
    grid: structuredClone(ROYALTY_GRID),
    gridHistory: structuredClone(GRID_HISTORY),
    kitVersions,
    ...dossiers,
    declarations: buildDeclarations(),
    notifications: buildNotifications(),
    accessLogs: buildAccessLogs(),
    activity: buildActivity(),
    imports: buildImports(),
    settings: {
      autoReminders: true,
      enforce2faAdmins: true,
      sessionMinutes: 60,
      lockAfterFailures: 5,
      lastBackupAt: new Date(Date.now() - 5 * 3_600_000).toISOString(),
    },
  }
}

function load(): Database {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) return JSON.parse(raw) as Database
  } catch {
    /* corrupted storage: fall back to a fresh seed */
  }
  return seed()
}

export const db: Database = load()

let persistTimer: number | undefined
export function persist() {
  window.clearTimeout(persistTimer)
  persistTimer = window.setTimeout(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(db))
    } catch {
      /* quota exceeded: the demo keeps working in memory */
    }
  }, 150)
}

export function resetDemo() {
  localStorage.removeItem(STORAGE_KEY)
  localStorage.removeItem('standset-session')
  window.location.assign('/connexion')
}

const chaos = new URLSearchParams(window.location.search).has('chaos')

export class ApiError extends Error {
  status: number
  constructor(status: number, message: string) {
    super(message)
    this.status = status
  }
}

export async function delay<T>(value: T, min = 180, max = 520): Promise<T> {
  await new Promise((r) => setTimeout(r, min + Math.random() * (max - min)))
  if (chaos && Math.random() < 0.05) throw new ApiError(500, 'Erreur réseau simulée')
  return structuredClone(value)
}
