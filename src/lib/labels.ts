import type {
  AuditResult,
  DocStatus,
  DocumentType,
  DossierStatus,
  KitVersionStatus,
  LicenceStatus,
  Priority,
  Role,
  Segment,
  SubscriptionStatus,
  TaskStatus,
  UserProfile,
  UserStatus,
} from '@/types/domain'
import type { AlertLevel } from './calculations/alerts'
import type { LineStatus } from './calculations/royalties'

export type Tone = 'neutral' | 'brand' | 'success' | 'warning' | 'danger' | 'violet'

export type AnyStatus =
  | LicenceStatus
  | DocStatus
  | TaskStatus
  | DossierStatus
  | KitVersionStatus
  | SubscriptionStatus
  | UserStatus
  | LineStatus
  | AlertLevel
  | AuditResult
  | 'PAYEE'
  | 'ECHOUEE'
  | 'EN_ATTENTE_PAIEMENT'

export const STATUS_META: Record<AnyStatus, { label: string; tone: Tone }> = {
  EN_ATTENTE: { label: 'En attente', tone: 'warning' },
  HABILITE: { label: 'Habilité', tone: 'success' },
  SUSPENDU: { label: 'Suspendu', tone: 'danger' },
  A_CREER: { label: 'À créer', tone: 'neutral' },
  EN_COURS: { label: 'En cours', tone: 'brand' },
  VALIDE: { label: 'Validé', tone: 'success' },
  A_FAIRE: { label: 'À faire', tone: 'neutral' },
  BLOQUEE: { label: 'Bloquée', tone: 'danger' },
  TERMINEE: { label: 'Terminée', tone: 'success' },
  ACTIF: { label: 'Actif', tone: 'success' },
  EN_PAUSE: { label: 'En pause', tone: 'warning' },
  CLOTURE: { label: 'Clôturé', tone: 'neutral' },
  BROUILLON: { label: 'Brouillon', tone: 'warning' },
  PUBLIEE: { label: 'Publiée', tone: 'success' },
  ARCHIVEE: { label: 'Archivée', tone: 'neutral' },
  IMPAYE: { label: 'Impayé', tone: 'danger' },
  RESILIE: { label: 'Résilié', tone: 'neutral' },
  INVITE: { label: 'Invitation envoyée', tone: 'brand' },
  DESACTIVE: { label: 'Désactivé', tone: 'neutral' },
  A_VENIR: { label: 'À venir', tone: 'neutral' },
  PARTIEL: { label: 'Partiel', tone: 'warning' },
  SOLDE: { label: 'Soldé', tone: 'success' },
  EN_RETARD: { label: 'En retard', tone: 'danger' },
  OK: { label: 'Valide', tone: 'success' },
  A_PLANIFIER: { label: 'À planifier', tone: 'warning' },
  URGENT: { label: 'Urgent', tone: 'danger' },
  EXPIREE: { label: 'Expirée', tone: 'danger' },
  CONFORME: { label: 'Conforme', tone: 'success' },
  ECART_MINEUR: { label: 'Écart mineur', tone: 'warning' },
  ECART_MAJEUR: { label: 'Écart majeur', tone: 'danger' },
  PAYEE: { label: 'Payée', tone: 'success' },
  ECHOUEE: { label: 'Échouée', tone: 'danger' },
  EN_ATTENTE_PAIEMENT: { label: 'En attente', tone: 'warning' },
}

export const ROLE_META: Record<Role, { label: string; short: string; color: string }> = {
  ADMIN_CONCESSIONNAIRE: { label: 'Administrateur concessionnaire', short: 'Concessionnaire', color: 'var(--color-role-admin)' },
  LICENCIE_ADMIN: { label: 'Licencié (admin tenant)', short: 'Licencié', color: 'var(--color-role-licencie)' },
  LICENCIE_USER: { label: 'Utilisateur licencié', short: 'Consultant', color: 'var(--color-role-consultant)' },
  ENTREPRISE: { label: 'Entreprise abonnée', short: 'Entreprise', color: 'var(--color-role-entreprise)' },
}

export const SEGMENT_LABELS: Record<Segment, string> = {
  CABINET: 'Cabinet de conseil',
  FORMATION: 'Organisme de formation',
  INSTITUTION: 'Institution',
  PME: 'PME',
  ETI: 'ETI',
}

export const PROFILE_LABELS: Record<UserProfile, string> = {
  ADMIN: 'Administrateur',
  CONSULTANT: 'Consultant',
  FORMATEUR: 'Formateur',
}

export const DOC_TYPE_LABELS: Record<DocumentType, string> = {
  POLITIQUE: 'Politique',
  PROCEDURE: 'Procédure',
  PROCESSUS: 'Processus',
  ENREGISTREMENT: 'Enregistrement',
  FORMULAIRE: 'Formulaire',
  PLAN: 'Plan',
}

export const PRIORITY_LABELS: Record<Priority, string> = {
  BASSE: 'Basse',
  NORMALE: 'Normale',
  HAUTE: 'Haute',
}

export const CHAPTER_TITLES: Record<number, string> = {
  4: "Contexte de l'organisme",
  5: 'Leadership',
  6: 'Planification',
  7: 'Support',
  8: 'Réalisation des activités opérationnelles',
  9: 'Évaluation des performances',
  10: 'Amélioration',
}
