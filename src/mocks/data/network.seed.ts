import { addDays, addMonths, addYears, endOfQuarter, formatISO, parseISO } from 'date-fns'
import type {
  AccessLog,
  Audit,
  Enterprise,
  Habilitation,
  Invoice,
  LicenceStatus,
  Licencie,
  Payment,
  Reminder,
  RoyaltyGrid,
  RoyaltyLine,
  Segment,
  User,
} from '@/types/domain'
import { createRng } from '../rng'
import { daysFromNow, monthsFromNow, timestamp } from './dates'

export const DEMO_PASSWORD = 'demo1234'
export const DEMO_2FA_CODE = '123456'

export const ROYALTY_GRID: RoyaltyGrid = {
  version: 3,
  T: 1_000_000,
  currency: 'XOF',
  entryFeeCoef: { CABINET: 1, FORMATION: 0.8, INSTITUTION: 1.5, PME: 0.5, ETI: 0.75 },
  annualFixedCoef: 0.4,
  exclusivityMarkupPct: 25,
  caFormationPct: 8,
  programmeForfaitCoef: 0.3,
  annualDiscountPct: 15,
  plans: [
    {
      id: 'ESSENTIEL',
      name: 'Essentiel',
      monthly: 25_000,
      features: ["Analyse d'écart complète", 'Plan de transition en 6 phases', 'Registre documentaire', 'Rapport PDF'],
    },
    {
      id: 'PRO',
      name: 'Pro',
      monthly: 45_000,
      features: [
        'Tout Essentiel',
        'Suivi des 3 parcours de formation',
        'Modèles de documents socle',
        'Intervenants internes illimités',
        'Support prioritaire',
      ],
    },
  ],
  updatedAt: timestamp(62),
  updatedBy: 'Koffi Mensah',
}

export const GRID_HISTORY = [
  { version: 1, T: 800_000, at: timestamp(420), by: 'Koffi Mensah' },
  { version: 2, T: 900_000, at: timestamp(240), by: 'Koffi Mensah' },
  { version: 3, T: 1_000_000, at: timestamp(62), by: 'Koffi Mensah' },
]

interface LicRow {
  id: string
  raisonSociale: string
  nomCommercial: string
  segment: Segment
  ville: string
  pays: string
  exclusivite: boolean
  status: LicenceStatus
  monthsAgo: number
  accent: string
  admin: [string, string]
  domain: string
  kit: string
  dossiers: number
  ca: number
}

const LIC_ROWS: LicRow[] = [
  { id: 'lic_qualis', raisonSociale: 'Qualis Conseil SARL', nomCommercial: 'Qualis Conseil', segment: 'CABINET', ville: 'Abidjan', pays: "Côte d'Ivoire", exclusivite: true, status: 'HABILITE', monthsAgo: 20, accent: '#0e7490', admin: ['Aïcha', 'Traoré'], domain: 'qualis-conseil.ci', kit: 'kv_2026_3', dossiers: 9, ca: 18_400_000 },
  { id: 'lic_formapro', raisonSociale: 'FormaPro Sahel SA', nomCommercial: 'FormaPro Sahel', segment: 'FORMATION', ville: 'Dakar', pays: 'Sénégal', exclusivite: false, status: 'HABILITE', monthsAgo: 16, accent: '#1f4fe0', admin: ['Ibrahima', 'Sow'], domain: 'formapro-sahel.sn', kit: 'kv_2026_3', dossiers: 3, ca: 24_900_000 },
  { id: 'lic_iqoa', raisonSociale: 'Institut Qualité Ouest-Afrique', nomCommercial: 'IQOA', segment: 'INSTITUTION', ville: 'Ouagadougou', pays: 'Burkina Faso', exclusivite: true, status: 'HABILITE', monthsAgo: 30, accent: '#9a3412', admin: ['Salif', 'Ouédraogo'], domain: 'iqoa.bf', kit: 'kv_2026_2', dossiers: 14, ca: 31_200_000 },
  { id: 'lic_normeplus', raisonSociale: 'Norme+ Consulting', nomCommercial: 'Norme+', segment: 'CABINET', ville: 'Cotonou', pays: 'Bénin', exclusivite: false, status: 'SUSPENDU', monthsAgo: 18, accent: '#7c3aed', admin: ['Rodrigue', 'Agbo'], domain: 'normeplus.bj', kit: 'kv_2026_2', dossiers: 4, ca: 6_100_000 },
  { id: 'lic_excellence', raisonSociale: 'Excellence Lomé Partners', nomCommercial: 'Excellence Partners', segment: 'CABINET', ville: 'Lomé', pays: 'Togo', exclusivite: false, status: 'HABILITE', monthsAgo: 14, accent: '#047857', admin: ['Kossi', 'Amegah'], domain: 'excellence-partners.tg', kit: 'kv_2026_3', dossiers: 7, ca: 9_800_000 },
  { id: 'lic_bamako', raisonSociale: 'Bamako Qualité Services', nomCommercial: 'BQS', segment: 'PME', ville: 'Bamako', pays: 'Mali', exclusivite: false, status: 'HABILITE', monthsAgo: 34, accent: '#b45309', admin: ['Mamadou', 'Keïta'], domain: 'bqs.ml', kit: 'kv_2026_2', dossiers: 5, ca: 4_300_000 },
  { id: 'lic_akwaba', raisonSociale: 'Akwaba Formation', nomCommercial: 'Akwaba Formation', segment: 'FORMATION', ville: 'Yamoussoukro', pays: "Côte d'Ivoire", exclusivite: false, status: 'HABILITE', monthsAgo: 27, accent: '#be123c', admin: ['Estelle', "N'Guessan"], domain: 'akwaba-formation.ci', kit: 'kv_2026_3', dossiers: 6, ca: 15_600_000 },
  { id: 'lic_teranga', raisonSociale: 'Teranga Management', nomCommercial: 'Teranga', segment: 'CABINET', ville: 'Saint-Louis', pays: 'Sénégal', exclusivite: false, status: 'EN_ATTENTE', monthsAgo: 1, accent: '#0369a1', admin: ['Ousmane', 'Faye'], domain: 'teranga-management.sn', kit: 'kv_2026_3', dossiers: 0, ca: 0 },
  { id: 'lic_sahelind', raisonSociale: 'Groupe Sahel Industrie', nomCommercial: 'GSI Qualité', segment: 'ETI', ville: 'Niamey', pays: 'Niger', exclusivite: false, status: 'HABILITE', monthsAgo: 11, accent: '#334155', admin: ['Hadiza', 'Issoufou'], domain: 'gsi.ne', kit: 'kv_2026_3', dossiers: 3, ca: 2_000_000 },
  { id: 'lic_capqualite', raisonSociale: 'Cap Qualité Guinée', nomCommercial: 'Cap Qualité', segment: 'CABINET', ville: 'Conakry', pays: 'Guinée', exclusivite: false, status: 'EN_ATTENTE', monthsAgo: 0, accent: '#15803d', admin: ['Mariama', 'Bah'], domain: 'capqualite.gn', kit: 'kv_2026_3', dossiers: 0, ca: 0 },
  { id: 'lic_delta', raisonSociale: 'Delta Audit & Conseil', nomCommercial: 'Delta Audit', segment: 'CABINET', ville: 'Douala', pays: 'Cameroun', exclusivite: true, status: 'SUSPENDU', monthsAgo: 22, accent: '#a21caf', admin: ['Paul', 'Ekambi'], domain: 'delta-audit.cm', kit: 'kv_2026_2', dossiers: 6, ca: 7_700_000 },
  { id: 'lic_lagune', raisonSociale: 'Lagune Académie', nomCommercial: 'Lagune Académie', segment: 'FORMATION', ville: 'Abidjan', pays: "Côte d'Ivoire", exclusivite: false, status: 'HABILITE', monthsAgo: 8, accent: '#1d4ed8', admin: ['Yannick', 'Koné'], domain: 'lagune-academie.ci', kit: 'kv_2026_3', dossiers: 4, ca: 12_300_000 },
]

const slug = (s: string) =>
  s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z]+/g, '.')
    .replace(/^\.|\.$/g, '')

export function buildNetwork() {
  const rng = createRng(2026)

  const licencies: Licencie[] = LIC_ROWS.map((r, i) => {
    const dateEntree = monthsFromNow(-r.monthsAgo, -rng.int(0, 20))
    const history: Licencie['statusHistory'] = [{ status: 'EN_ATTENTE', at: dateEntree, by: 'Koffi Mensah' }]
    if (r.status !== 'EN_ATTENTE') history.push({ status: 'HABILITE', at: formatISO(addDays(parseISO(dateEntree), 21), { representation: 'date' }), by: 'Koffi Mensah' })
    if (r.status === 'SUSPENDU')
      history.push({
        status: 'SUSPENDU',
        at: daysFromNow(-rng.int(10, 40)),
        by: 'Koffi Mensah',
        motif: r.id === 'lic_delta' ? "Écart majeur d'audit" : 'Impayés',
      })
    return {
      id: r.id,
      ref: `LIC-${String(i + 1).padStart(4, '0')}`,
      raisonSociale: r.raisonSociale,
      segment: r.segment,
      territoire: r.ville,
      pays: r.pays,
      exclusivite: r.exclusivite,
      status: r.status,
      statusHistory: history,
      dateEntree,
      contactName: `${r.admin[0]} ${r.admin[1]}`,
      contactEmail: `${slug(r.admin[0])}.${slug(r.admin[1])}@${r.domain}`,
      contactPhone: `+${rng.int(221, 237)} ${rng.int(10, 99)} ${rng.int(10, 99)} ${rng.int(10, 99)} ${rng.int(10, 99)}`,
      branding: {
        nomCommercial: r.nomCommercial,
        accentColor: r.accent,
        logoText: r.nomCommercial
          .split(/\s+/)
          .map((w) => w[0])
          .join('')
          .slice(0, 2)
          .toUpperCase(),
        subdomain: r.status === 'EN_ATTENTE' ? undefined : slug(r.nomCommercial).split('.')[0],
        domainStatus: r.status === 'EN_ATTENTE' ? 'NON_CONFIGURE' : 'ACTIF',
        email: `contact@${r.domain}`,
        phone: `+${rng.int(221, 237)} ${rng.int(20, 29)} ${rng.int(10, 99)} ${rng.int(10, 99)} ${rng.int(10, 99)}`,
        address: `${rng.int(1, 120)}, boulevard ${rng.pick(['de la République', 'Latrille', 'de Marseille', "de l'Indépendance", 'du Commerce'])}, ${r.ville}`,
        website: `www.${r.domain}`,
      },
      kitVersionId: r.kit,
      indicators: {
        dossiersActifs: r.dossiers,
        sessionsFormation: Math.round(r.ca / 900_000),
        caSessionsDeclare: r.ca,
        usersCount: r.dossiers ? rng.int(2, 8) : 1,
        pctDerniereVersion: r.kit === 'kv_2026_3' ? rng.int(70, 100) : rng.int(0, 30),
      },
      onboarded: r.status !== 'EN_ATTENTE',
      lastActivityAt: timestamp(rng.int(0, r.status === 'SUSPENDU' ? 40 : 6), rng.int(8, 18)),
    }
  })

  const users: User[] = [
    {
      id: 'usr_admin',
      firstName: 'Koffi',
      lastName: 'Mensah',
      email: 'koffi.mensah@standset.com',
      role: 'ADMIN_CONCESSIONNAIRE',
      tenantId: null,
      title: 'Directeur du réseau',
      phone: '+225 07 48 21 90 11',
      twoFactorEnabled: true,
      lastLoginAt: timestamp(1, 8, 12),
      status: 'ACTIF',
    },
  ]
  LIC_ROWS.forEach((r) => {
    const l = licencies.find((x) => x.id === r.id)!
    users.push({
      id: r.id === 'lic_qualis' ? 'usr_licadmin' : `usr_${r.id}_admin`,
      firstName: r.admin[0],
      lastName: r.admin[1],
      email: l.contactEmail,
      role: 'LICENCIE_ADMIN',
      profile: 'ADMIN',
      tenantId: r.id,
      title: 'Associée gérante',
      phone: l.contactPhone,
      twoFactorEnabled: false,
      lastLoginAt: timestamp(rng.int(0, 5), rng.int(8, 18)),
      status: 'ACTIF',
    })
  })
  users.push(
    { id: 'usr_consultant', firstName: 'Mariam', lastName: 'Diallo', email: 'mariam.diallo@qualis-conseil.ci', role: 'LICENCIE_USER', profile: 'CONSULTANT', tenantId: 'lic_qualis', title: 'Consultante qualité senior', phone: '+225 05 66 12 40 88', twoFactorEnabled: false, lastLoginAt: timestamp(0, 7, 58), status: 'ACTIF' },
    { id: 'usr_formateur', firstName: 'Serge', lastName: 'Kouassi', email: 'serge.kouassi@qualis-conseil.ci', role: 'LICENCIE_USER', profile: 'FORMATEUR', tenantId: 'lic_qualis', title: 'Formateur certifié', phone: '+225 01 22 76 54 10', twoFactorEnabled: true, lastLoginAt: timestamp(2, 14, 3), status: 'ACTIF' },
    { id: 'usr_consultant2', firstName: 'Jean-Marc', lastName: 'Yao', email: 'jeanmarc.yao@qualis-conseil.ci', role: 'LICENCIE_USER', profile: 'CONSULTANT', tenantId: 'lic_qualis', title: 'Consultant junior', twoFactorEnabled: false, status: 'INVITE' },
    { id: 'usr_formapro_c1', firstName: 'Awa', lastName: 'Sarr', email: 'awa.sarr@formapro-sahel.sn', role: 'LICENCIE_USER', profile: 'FORMATEUR', tenantId: 'lic_formapro', title: 'Formatrice', twoFactorEnabled: false, lastLoginAt: timestamp(3), status: 'ACTIF' },
    { id: 'usr_entreprise', firstName: 'Fatou', lastName: 'Ndiaye', email: 'fatou.ndiaye@kora-plastiques.ci', role: 'ENTREPRISE', tenantId: 'ent_kora', title: 'Responsable qualité', phone: '+225 07 11 45 32 19', twoFactorEnabled: false, lastLoginAt: timestamp(1, 16, 40), status: 'ACTIF' },
  )

  const royaltyLines: RoyaltyLine[] = []
  const payments: Payment[] = []
  const reminders: Reminder[] = []
  const latePayers = new Set(['lic_normeplus', 'lic_excellence', 'lic_delta'])
  const today = new Date()
  const horizon = addMonths(today, 6)
  let n = 0

  const push = (l: Licencie, type: RoyaltyLine['type'], periode: string, montantDu: number, due: Date) => {
    const line: RoyaltyLine = { id: `rl_${++n}`, licencieId: l.id, type, periode, montantDu: Math.round(montantDu), dueDate: formatISO(due, { representation: 'date' }) }
    royaltyLines.push(line)
    const overdueDays = (today.getTime() - due.getTime()) / 86_400_000
    if (overdueDays < 0) {
      if (l.id === 'lic_qualis' && type === 'VARIABLE_CA' && rng.chance(0.5))
        payments.push({ id: `pay_${n}`, licencieId: l.id, royaltyLineId: line.id, montant: Math.round(line.montantDu * 0.5), date: daysFromNow(-3), mode: 'VIREMENT', reference: `VIR-${rng.int(100000, 999999)}` })
      return
    }
    const late = latePayers.has(l.id) && overdueDays < 200
    if (late && rng.chance(0.75)) {
      if (rng.chance(0.3))
        payments.push({ id: `pay_${n}`, licencieId: l.id, royaltyLineId: line.id, montant: Math.round(line.montantDu * 0.4), date: formatISO(addDays(due, rng.int(5, 20)), { representation: 'date' }), mode: 'MOBILE_MONEY', reference: `OM-${rng.int(100000, 999999)}` })
      return
    }
    if (overdueDays < 12 && rng.chance(0.4)) return
    payments.push({
      id: `pay_${n}`,
      licencieId: l.id,
      royaltyLineId: line.id,
      montant: line.montantDu,
      date: formatISO(addDays(due, rng.int(-10, 6)), { representation: 'date' }),
      mode: rng.pick(['VIREMENT', 'VIREMENT', 'MOBILE_MONEY', 'CHEQUE'] as const),
      reference: `${rng.pick(['VIR', 'OM', 'CHQ'])}-${rng.int(100000, 999999)}`,
    })
  }

  for (const l of licencies) {
    if (l.status === 'EN_ATTENTE') {
      push(l, 'DROIT_ENTREE', 'Entrée', ROYALTY_GRID.T * ROYALTY_GRID.entryFeeCoef[l.segment], addDays(parseISO(l.dateEntree), 30))
      continue
    }
    const entree = parseISO(l.dateEntree)
    push(l, 'DROIT_ENTREE', 'Entrée', ROYALTY_GRID.T * ROYALTY_GRID.entryFeeCoef[l.segment], addDays(entree, 30))
    for (let y = 0; addYears(entree, y) < horizon; y++) {
      const due = addDays(addYears(entree, y), 30)
      const label = `Année ${y + 1}`
      push(l, 'REDEVANCE_ANNUELLE', label, ROYALTY_GRID.T * ROYALTY_GRID.annualFixedCoef, due)
      push(l, 'FORFAIT_PROGRAMME', label, ROYALTY_GRID.T * ROYALTY_GRID.programmeForfaitCoef, due)
      if (l.exclusivite) push(l, 'MAJORATION_EXCLUSIVITE', label, ROYALTY_GRID.T * ROYALTY_GRID.annualFixedCoef * (ROYALTY_GRID.exclusivityMarkupPct / 100), due)
    }
    for (let q = endOfQuarter(addMonths(entree, 3)); q < today; q = endOfQuarter(addMonths(q, 3))) {
      const ca = (l.indicators.caSessionsDeclare / 4) * (0.6 + rng.next() * 0.8)
      const quarter = Math.floor(q.getMonth() / 3) + 1
      push(l, 'VARIABLE_CA', `T${quarter} ${q.getFullYear()}`, ca * (ROYALTY_GRID.caFormationPct / 100), addDays(q, 30))
    }
  }

  let r = 0
  for (const id of latePayers) {
    const levels: (1 | 2 | 3)[] = id === 'lic_excellence' ? [1] : id === 'lic_delta' ? [1, 2] : [1, 2, 3]
    levels.forEach((niveau, k) => {
      reminders.push({ id: `rem_${++r}`, licencieId: id, sentAt: timestamp(60 - k * 20 - rng.int(0, 5), 9), niveau, montant: rng.int(4, 12) * 100_000, opened: rng.chance(0.7) })
    })
  }

  const habilitations: Habilitation[] = []
  const audits: Audit[] = []
  licencies
    .filter((l) => l.status !== 'EN_ATTENTE')
    .forEach((l, i) => {
      const delivree = addMonths(parseISO(l.dateEntree), 1)
      habilitations.push({
        id: `hab_${i}_1`,
        licencieId: l.id,
        intitule: 'Habilitation réseau StandSet',
        delivreeLe: formatISO(delivree, { representation: 'date' }),
        expireLe: formatISO(addYears(delivree, 3), { representation: 'date' }),
        auditeur: 'Koffi Mensah',
      })
      if (l.segment === 'FORMATION' || l.id === 'lic_qualis') {
        const d2 = addMonths(parseISO(l.dateEntree), 2)
        habilitations.push({
          id: `hab_${i}_2`,
          licencieId: l.id,
          intitule: 'Formateur certifié ISO 9001:2026',
          delivreeLe: formatISO(d2, { representation: 'date' }),
          expireLe: formatISO(addYears(d2, 2), { representation: 'date' }),
          auditeur: 'Bureau Qualité Afrique',
        })
      }
      audits.push({
        id: `aud_${i}`,
        licencieId: l.id,
        date: formatISO(addMonths(parseISO(l.dateEntree), Math.min(10, Math.max(2, Math.floor(rng.int(4, 10))))), { representation: 'date' }),
        auditeur: rng.pick(['Koffi Mensah', 'Nadia Coulibaly']),
        resultat: l.id === 'lic_delta' ? 'ECART_MAJEUR' : l.id === 'lic_normeplus' || l.id === 'lic_bamako' ? 'ECART_MINEUR' : 'CONFORME',
        constats:
          l.id === 'lic_delta'
            ? ['Utilisation d’une version non publiée du socle', 'Rapports clients diffusés sans la marque du réseau', 'Déclarations d’activité incomplètes sur 2 trimestres']
            : l.id === 'lic_normeplus' || l.id === 'lic_bamako'
              ? ['Preuves de formation des consultants incomplètes']
              : ['Méthodologie appliquée conformément au socle'],
        suspensionProposee: l.id === 'lic_delta',
      })
    })

  return { licencies, users, royaltyLines, payments, reminders, habilitations, audits }
}

const ENT_PREFIX = ['Ivoire', 'Sahel', 'Atlantique', 'Savane', 'Baobab', 'Niger', 'Teranga', 'Lagune', 'Kora', 'Djoliba', 'Bandama', 'Comoé', 'Mono', 'Oti', 'Faso', 'Sénégal']
const ENT_SUFFIX = ['Plastiques', 'Agro-Industries', 'Logistique', 'BTP', 'Pharma', 'Textiles', 'Énergie', 'Télécom Services', 'Métal', 'Emballages', 'Boissons', 'Imprimerie']
const SECTEURS = ['Industrie', 'Agroalimentaire', 'Logistique', 'BTP', 'Santé', 'Services', 'Énergie', 'Distribution']
const VILLES: [string, string][] = [
  ['Abidjan', "Côte d'Ivoire"],
  ['Dakar', 'Sénégal'],
  ['Cotonou', 'Bénin'],
  ['Lomé', 'Togo'],
  ['Ouagadougou', 'Burkina Faso'],
  ['Bamako', 'Mali'],
  ['Douala', 'Cameroun'],
  ['San-Pédro', "Côte d'Ivoire"],
]

export function buildEnterprises() {
  const rng = createRng(48)
  const enterprises: Enterprise[] = []
  const invoices: Invoice[] = []
  const used = new Set<string>(['Kora Plastiques'])
  enterprises.push({
    id: 'ent_kora',
    ref: 'ENT-0001',
    raisonSociale: 'Kora Plastiques SA',
    secteur: 'Industrie',
    effectif: '50 à 249',
    pays: "Côte d'Ivoire",
    ville: 'Abidjan',
    plan: 'PRO',
    periodicity: 'MENSUEL',
    subscriptionStatus: 'ACTIF',
    subscribedAt: monthsFromNow(-7),
    nextBillingAt: daysFromNow(12),
    dossierId: 'dos_kora',
    paymentMethod: { kind: 'MOBILE_MONEY', label: 'Orange Money •• 32 19' },
    certificateExpiry: monthsFromNow(20),
    progress: 0,
  })
  for (let i = 2; i <= 48; i++) {
    let name = ''
    do name = `${rng.pick(ENT_PREFIX)} ${rng.pick(ENT_SUFFIX)}`
    while (used.has(name))
    used.add(name)
    const [ville, pays] = rng.pick(VILLES)
    const status = rng.chance(0.08) ? 'IMPAYE' : rng.chance(0.06) ? 'RESILIE' : 'ACTIF'
    enterprises.push({
      id: `ent_${i}`,
      ref: `ENT-${String(i).padStart(4, '0')}`,
      raisonSociale: `${name} ${rng.pick(['SA', 'SARL', 'SAS'])}`,
      secteur: rng.pick(SECTEURS),
      effectif: rng.pick(['10 à 49', '50 à 249', '250 à 999', '1 000 et plus']),
      pays,
      ville,
      plan: rng.chance(0.55) ? 'PRO' : 'ESSENTIEL',
      periodicity: rng.chance(0.3) ? 'ANNUEL' : 'MENSUEL',
      subscriptionStatus: status,
      subscribedAt: daysFromNow(-rng.int(10, 330)),
      nextBillingAt: daysFromNow(rng.int(1, 30)),
      dossierId: `dos_ent_${i}`,
      paymentMethod: rng.chance(0.6) ? { kind: 'MOBILE_MONEY', label: `${rng.pick(['Orange Money', 'MTN MoMo', 'Wave', 'Moov Money'])} •• ${rng.int(10, 99)} ${rng.int(10, 99)}` } : { kind: 'CARTE', label: `Visa •• ${rng.int(1000, 9999)}` },
      progress: rng.int(4, 88),
    })
  }
  for (let m = 6; m >= 0; m--) {
    invoices.push({
      id: `inv_kora_${m}`,
      number: `FAC-2026-${String(1200 + (6 - m) * 37).padStart(5, '0')}`,
      enterpriseId: 'ent_kora',
      date: monthsFromNow(-m, -18),
      amount: 45_000,
      status: m === 3 ? 'ECHOUEE' : 'PAYEE',
    })
  }
  invoices.push({ id: 'inv_kora_retry', number: 'FAC-2026-01310', enterpriseId: 'ent_kora', date: monthsFromNow(-3, -15), amount: 45_000, status: 'PAYEE' })
  return { enterprises, invoices }
}

export function buildAccessLogs(): AccessLog[] {
  const rng = createRng(7)
  const actions: [string, boolean][] = [
    ['Connexion réussie', false],
    ['Connexion réussie', false],
    ['Validation 2FA', false],
    ['Modification de la grille de redevances', true],
    ['Publication de la version 2026.3', true],
    ['Connexion en tant que Qualis Conseil (impersonation)', true],
    ['Échec de connexion (mot de passe)', true],
    ['Export CSV du journal des redevances', false],
    ['Suspension de Delta Audit & Conseil', true],
  ]
  return Array.from({ length: 40 }, (_, i) => {
    const [action, sensitive] = rng.pick(actions)
    return {
      id: `log_${i}`,
      userName: rng.chance(0.85) ? 'Koffi Mensah' : 'Nadia Coulibaly',
      role: 'ADMIN_CONCESSIONNAIRE' as const,
      action,
      sensitive,
      ip: `41.${rng.int(66, 207)}.${rng.int(0, 255)}.${rng.int(1, 254)}`,
      device: rng.pick(['Chrome · Windows', 'Safari · macOS', 'Chrome · Android', 'Firefox · Windows']),
      at: timestamp(Math.floor(i / 2), rng.int(7, 20), rng.int(0, 59)),
    }
  })
}
