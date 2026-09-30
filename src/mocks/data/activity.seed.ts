import type { ActivityEvent, AppNotification, ImportRecord } from '@/types/domain'
import { timestamp } from './dates'

export function buildNotifications(): AppNotification[] {
  const n = (id: string, userId: string, type: AppNotification['type'], title: string, body: string, daysAgo: number, link?: string, read = false): AppNotification => ({
    id,
    userId,
    type,
    title,
    body,
    link,
    createdAt: timestamp(daysAgo, 9 + (daysAgo % 8), (daysAgo * 7) % 60),
    readAt: read ? timestamp(daysAgo) : undefined,
  })
  return [
    n('n1', 'usr_admin', 'HABILITATION', 'Habilitation à renouveler', 'BQS — l’habilitation réseau expire dans moins de 3 mois.', 0, '/console/habilitations'),
    n('n2', 'usr_admin', 'RELANCE', 'Échéance dépassée', 'Norme+ Consulting cumule 3 échéances impayées.', 1, '/console/redevances/journal'),
    n('n3', 'usr_admin', 'AUDIT', 'Écart majeur consigné', "Delta Audit & Conseil — suspension proposée à l'issue de l'audit.", 3, '/console/licencies/lic_delta'),
    n('n4', 'usr_admin', 'PAIEMENT', 'Encaissement reçu', 'Qualis Conseil — virement de 150 000 FCFA.', 3, '/console/redevances/journal', true),
    n('n5', 'usr_admin', 'KIT_VERSION', 'Version 2026.3 diffusée', '12 tenants et 48 entreprises notifiés.', 22, '/console/kit', true),
    n('n6', 'usr_licadmin', 'KIT_VERSION', 'Nouvelle version du socle : 2026.3', 'Transit Atlantique utilise encore la version 2026.2.', 22, '/app/dossiers/dos_transit/vue-ensemble'),
    n('n7', 'usr_licadmin', 'DOCUMENT', 'Document validé', 'Ivoire Agro SA — Politique qualité validée par Christian Aka.', 0, '/app/dossiers/dos_ivoireagro/documents'),
    n('n8', 'usr_licadmin', 'RELANCE', 'Prochaine échéance de redevance', 'Variable sur CA — échéance dans 18 jours.', 2, '/app/redevances'),
    n('n9', 'usr_licadmin', 'TACHE', 'Tâche bloquée', 'Sahel BTP — « Réviser les procédures impactées » est bloquée.', 4, '/app/dossiers/dos_sahelbtp/plan', true),
    n('n10', 'usr_consultant', 'TACHE', 'Nouvelle tâche assignée', 'Lagune Pharma — Mettre en conformité § 6.1.', 0, '/app/dossiers/dos_lagunepharma/plan'),
    n('n11', 'usr_consultant', 'TACHE', 'Échéance demain', 'Ivoire Agro SA — Tenir la revue de direction.', 1, '/app/dossiers/dos_ivoireagro/plan'),
    n('n12', 'usr_consultant', 'KIT_VERSION', 'Nouvelle version du socle : 2026.3', 'Découvrez les changements du socle.', 22, undefined, true),
    n('n13', 'usr_formateur', 'TACHE', 'Session à enregistrer', 'Batik Logistique — session du parcours 2 réalisée hier.', 1, '/app/dossiers/dos_batik/formations'),
    n('n14', 'usr_entreprise', 'KIT_VERSION', 'Le socle a été mis à jour', 'La version 2026.3 ajoute la clause 6.3 à évaluer.', 22, '/espace/dossier/analyse-ecart', true),
    n('n15', 'usr_entreprise', 'PAIEMENT', 'Paiement confirmé', 'Votre abonnement Pro a été renouvelé.', 18, '/espace/abonnement'),
    n('n16', 'usr_entreprise', 'TACHE', 'Prochaine étape recommandée', 'Il vous reste 9 clauses à évaluer au chapitre 8.', 0, '/espace/dossier/analyse-ecart'),
  ]
}

export function buildActivity(): ActivityEvent[] {
  const e = (id: string, scope: string, kind: ActivityEvent['kind'], label: string, actor: string, daysAgo: number, hour = 10): ActivityEvent => ({
    id,
    scope,
    kind,
    label,
    actor,
    at: timestamp(daysAgo, hour, (daysAgo * 13) % 60),
  })
  return [
    e('a1', 'lic_qualis', 'document', 'Politique qualité validée — Ivoire Agro SA', 'Mariam Diallo', 0, 11),
    e('a2', 'lic_qualis', 'assessment', '6 clauses évaluées — Lagune Pharma', 'Mariam Diallo', 1, 15),
    e('a3', 'lic_qualis', 'training', 'Session « Approche processus » — Batik Logistique', 'Serge Kouassi', 2, 9),
    e('a4', 'lic_qualis', 'task', 'Phase 3 terminée — Cacao Premium Export', 'Serge Kouassi', 3, 17),
    e('a5', 'lic_qualis', 'create', 'Dossier créé — Eburnie Emballages', 'Aïcha Traoré', 26, 10),
    e('a6', 'lic_qualis', 'kit', 'Version 2026.3 reçue', 'StandSet', 22, 11),
    e('a7', 'network', 'payment', 'Encaissement Qualis Conseil — 150 000 FCFA', 'Koffi Mensah', 3, 10),
    e('a8', 'network', 'status', 'Delta Audit & Conseil suspendu', 'Koffi Mensah', 12, 16),
    e('a9', 'network', 'create', 'Cap Qualité Guinée enregistré', 'Koffi Mensah', 5, 14),
    e('a10', 'network', 'reminder', 'Relance niveau 3 — Norme+ Consulting', 'Système', 8, 9),
  ]
}

export function buildImports(): ImportRecord[] {
  return [
    { id: 'imp1', fileName: 'Console-Licencies-export-2026-05.json', kind: 'CONSOLE', result: '12 licenciés, 214 échéances importés', at: timestamp(140), by: 'Koffi Mensah' },
    { id: 'imp2', fileName: 'Kit-IvoireAgro-2026-03.json', kind: 'KIT', result: '1 dossier, 34 évaluations, 28 tâches importés', at: timestamp(300), by: 'Koffi Mensah' },
  ]
}
