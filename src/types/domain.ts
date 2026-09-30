export type Role = 'ADMIN_CONCESSIONNAIRE' | 'LICENCIE_ADMIN' | 'LICENCIE_USER' | 'ENTREPRISE'
export type UserProfile = 'ADMIN' | 'CONSULTANT' | 'FORMATEUR'
export type UserStatus = 'ACTIF' | 'INVITE' | 'DESACTIVE'

export interface User {
  id: string
  firstName: string
  lastName: string
  email: string
  role: Role
  profile?: UserProfile
  tenantId: string | null
  title?: string
  phone?: string
  twoFactorEnabled: boolean
  lastLoginAt?: string
  status: UserStatus
}

export type Segment = 'CABINET' | 'FORMATION' | 'INSTITUTION' | 'PME' | 'ETI'
export type LicenceStatus = 'EN_ATTENTE' | 'HABILITE' | 'SUSPENDU'
export type DomainStatus = 'NON_CONFIGURE' | 'EN_ATTENTE_DNS' | 'ACTIF'

export interface Branding {
  nomCommercial: string
  accentColor: string
  logoText: string
  logoUrl?: string
  subdomain?: string
  customDomain?: string
  domainStatus: DomainStatus
  email: string
  phone: string
  address: string
  website?: string
}

export interface AggregatedIndicators {
  dossiersActifs: number
  sessionsFormation: number
  caSessionsDeclare: number
  usersCount: number
  pctDerniereVersion: number
}

export interface StatusChange {
  status: LicenceStatus
  at: string
  motif?: string
  by: string
}

export interface Licencie {
  id: string
  ref: string
  raisonSociale: string
  segment: Segment
  territoire: string
  pays: string
  exclusivite: boolean
  status: LicenceStatus
  statusHistory: StatusChange[]
  dateEntree: string
  contactName: string
  contactEmail: string
  contactPhone: string
  branding: Branding
  kitVersionId: string
  indicators: AggregatedIndicators
  onboarded: boolean
  lastActivityAt: string
}

export type Plan = 'ESSENTIEL' | 'PRO'
export type Periodicity = 'MENSUEL' | 'ANNUEL'
export type SubscriptionStatus = 'ACTIF' | 'IMPAYE' | 'RESILIE'

export interface Enterprise {
  id: string
  ref: string
  raisonSociale: string
  secteur: string
  effectif: string
  pays: string
  ville: string
  plan: Plan
  periodicity: Periodicity
  subscriptionStatus: SubscriptionStatus
  subscribedAt: string
  nextBillingAt: string
  dossierId: string
  paymentMethod: { kind: 'CARTE' | 'MOBILE_MONEY'; label: string }
  certificateExpiry?: string
  progress: number
}

export interface Invoice {
  id: string
  number: string
  enterpriseId: string
  date: string
  amount: number
  status: 'PAYEE' | 'ECHOUEE' | 'EN_ATTENTE'
}

export interface SubscriptionPlan {
  id: Plan
  name: string
  monthly: number
  features: string[]
}

export interface RoyaltyGrid {
  version: number
  T: number
  currency: 'XOF'
  entryFeeCoef: Record<Segment, number>
  annualFixedCoef: number
  exclusivityMarkupPct: number
  caFormationPct: number
  programmeForfaitCoef: number
  annualDiscountPct: number
  plans: SubscriptionPlan[]
  updatedAt: string
  updatedBy: string
}

export type RoyaltyType =
  | 'DROIT_ENTREE'
  | 'REDEVANCE_ANNUELLE'
  | 'MAJORATION_EXCLUSIVITE'
  | 'VARIABLE_CA'
  | 'FORFAIT_PROGRAMME'

export interface RoyaltyLine {
  id: string
  licencieId: string
  type: RoyaltyType
  periode: string
  montantDu: number
  dueDate: string
}

export type PaymentMode = 'VIREMENT' | 'MOBILE_MONEY' | 'CHEQUE' | 'CARTE'

export interface Payment {
  id: string
  licencieId: string
  royaltyLineId: string
  montant: number
  date: string
  mode: PaymentMode
  reference: string
}

export interface Reminder {
  id: string
  licencieId: string
  sentAt: string
  niveau: 1 | 2 | 3
  montant: number
  opened: boolean
}

export interface Habilitation {
  id: string
  licencieId: string
  intitule: string
  delivreeLe: string
  expireLe: string
  auditeur: string
}

export type AuditResult = 'CONFORME' | 'ECART_MINEUR' | 'ECART_MAJEUR'

export interface Audit {
  id: string
  licencieId: string
  date: string
  auditeur: string
  resultat: AuditResult
  constats: string[]
  suspensionProposee: boolean
}

export type KitVersionStatus = 'BROUILLON' | 'PUBLIEE' | 'ARCHIVEE'

export interface Clause {
  id: string
  code: string
  chapitre: number
  titre: string
  exigence: string
  guide: string[]
  poids: 1 | 2 | 3
  nouveaute2026: boolean
}

export interface TaskTemplate {
  id: string
  phase: number
  titre: string
  description: string
  dureeJours: number
}

export interface PhaseTemplate {
  ordre: number
  titre: string
  description: string
}

export type DocumentType = 'POLITIQUE' | 'PROCEDURE' | 'PROCESSUS' | 'ENREGISTREMENT' | 'FORMULAIRE' | 'PLAN'

export interface DocumentTemplate {
  id: string
  code: string
  titre: string
  type: DocumentType
  clauseCode: string
  obligatoire: boolean
}

export interface TrainingModule {
  id: string
  titre: string
  dureeHeures: number
}

export interface TrainingPath {
  id: string
  nom: string
  publicCible: string
  modules: TrainingModule[]
}

export interface SocleContent {
  clauses: Clause[]
  phases: PhaseTemplate[]
  tasks: TaskTemplate[]
  documents: DocumentTemplate[]
  trainings: TrainingPath[]
}

export interface KitVersion {
  id: string
  number: string
  status: KitVersionStatus
  publishedAt?: string
  publishedBy?: string
  createdAt: string
  changelog: string
  content: SocleContent
}

export type DossierStatus = 'ACTIF' | 'EN_PAUSE' | 'CLOTURE'

export interface Dossier {
  id: string
  ref: string
  tenantId: string
  clientName: string
  secteur: string
  effectif: string
  siteCount: number
  ville: string
  responsableQualite: string
  responsableEmail: string
  certifie2015: boolean
  certificateExpiry?: string
  assignedUserIds: string[]
  kitVersionId: string
  createdAt: string
  targetAuditDate: string
  status: DossierStatus
}

export type Score = 0 | 1 | 2 | 3 | 4

export interface ClauseAssessment {
  id: string
  dossierId: string
  clauseId: string
  score: Score | null
  applicable: boolean
  constat: string
  preuves: string
  evaluatedBy?: string
  evaluatedAt?: string
}

export type TaskStatus = 'A_FAIRE' | 'EN_COURS' | 'BLOQUEE' | 'TERMINEE'
export type Priority = 'BASSE' | 'NORMALE' | 'HAUTE'

export interface Task {
  id: string
  dossierId: string
  phase: number
  templateId: string | null
  titre: string
  description: string
  responsable: string
  dueDate: string
  status: TaskStatus
  priority: Priority
  sourceClauseId?: string
}

export type DocStatus = 'A_CREER' | 'EN_COURS' | 'VALIDE'

export interface DossierDocument {
  id: string
  dossierId: string
  templateId: string | null
  code: string
  titre: string
  type: DocumentType
  clauseCode: string
  status: DocStatus
  owner: string
  updatedAt: string
  fileName?: string
  validatedBy?: string
}

export interface Participant {
  name: string
  fonction: string
  present: boolean
}

export interface TrainingSession {
  id: string
  dossierId: string
  pathId: string
  moduleIds: string[]
  date: string
  dureeHeures: number
  lieu: string
  formateur: string
  participants: Participant[]
  caFacture?: number
}

export interface Declaration {
  id: string
  licencieId: string
  periode: string
  dossiersActifs: number
  sessions: number
  caSessions: number
  sentAt: string
}

export type NotificationType =
  | 'KIT_VERSION'
  | 'RELANCE'
  | 'HABILITATION'
  | 'TACHE'
  | 'DOCUMENT'
  | 'PAIEMENT'
  | 'AUDIT'

export interface AppNotification {
  id: string
  userId: string
  type: NotificationType
  title: string
  body: string
  link?: string
  createdAt: string
  readAt?: string
}

export interface AccessLog {
  id: string
  userName: string
  role: Role
  action: string
  sensitive: boolean
  ip: string
  device: string
  at: string
}

export interface ActivityEvent {
  id: string
  scope: string
  label: string
  actor: string
  at: string
  kind: 'status' | 'payment' | 'reminder' | 'kit' | 'assessment' | 'document' | 'training' | 'task' | 'create'
}

export interface ImportRecord {
  id: string
  fileName: string
  kind: 'CONSOLE' | 'KIT'
  result: string
  at: string
  by: string
}
