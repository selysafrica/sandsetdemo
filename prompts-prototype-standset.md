# StandSet — Bibliothèque de prompts pour le prototype React

> Plateforme multi-tenant de transition ISO 9001:2026 — prototype front-end React + données mockées.
> Thème : **bleu & blanc**, style « registre ». Sources : `cahier-des-charges-standset.md`, `StandSet-Parcours-utlisateurs.png`.

---

## Sommaire

- [0. Mode d'emploi](#0-mode-demploi)
- [1. Prompts fondations](#1-prompts-fondations)
  - F-00 Contexte maître (à coller en tête de chaque session)
  - F-01 Initialisation du projet & architecture
  - F-02 Design system « Registre bleu »
  - F-03 Modèle de domaine, mocks & services
  - F-04 Routing, layouts, authentification mockée & garde-fous
  - F-05 Composants métier transverses
- [2. Pages publiques & authentification](#2-pages-publiques--authentification)
- [3. Console — Administrateur concessionnaire](#3-console--administrateur-concessionnaire)
- [4. Instance licencié — Administrateur de tenant](#4-instance-licencié--administrateur-de-tenant)
- [5. Kit — Espace dossier (partagé par 3 rôles)](#5-kit--espace-dossier-partagé-par-3-rôles)
- [6. Utilisateur licencié (consultant / formateur)](#6-utilisateur-licencié-consultant--formateur)
- [7. Entreprise abonnée (self-service)](#7-entreprise-abonnée-self-service)
- [8. Écrans communs](#8-écrans-communs)
- [9. Catalogue des dialogs, drawers & modales](#9-catalogue-des-dialogs-drawers--modales)
- [10. États transverses, responsive & finitions](#10-états-transverses-responsive--finitions)
- [11. Checklist de recette du prototype](#11-checklist-de-recette-du-prototype)
- [Annexe — Inventaire des écrans](#annexe--inventaire-des-écrans)

---

## 0. Mode d'emploi

1. **Toujours commencer une session** par le prompt **F-00** (contexte maître), puis enchaîner le prompt de l'écran voulu.
2. Exécuter les fondations **dans l'ordre** : F-01 → F-02 → F-03 → F-04 → F-05. Ne pas générer de page avant que le design system et les mocks existent.
3. Ensuite, générer les écrans **par rôle** (Console → Licencié → Kit → Consultant → Entreprise). Les modules du **Kit** (section 5) sont partagés : les générer une seule fois.
4. Les dialogs (section 9) peuvent être générés en même temps que la page qui les ouvre — chaque page indique ses dialogs par leur code (`D-xx`).
5. Chaque prompt est autonome, mais s'appuie sur les conventions définies dans F-00 à F-05. En cas de dérive (couleurs, structure), recoller F-00.

**Conventions de codes**

| Préfixe | Périmètre |
|---------|-----------|
| `F-` | Fondations (setup, design system, mocks, routing) |
| `P-` | Pages publiques / auth |
| `C-` | Console concessionnaire |
| `L-` | Instance licencié (admin tenant) |
| `K-` | Modules Kit (espace dossier partagé) |
| `U-` | Utilisateur licencié (consultant / formateur) |
| `E-` | Entreprise abonnée (self-service) |
| `X-` | Écrans communs à tous les rôles |
| `D-` | Dialogs, drawers, modales |

---

## 1. Prompts fondations

### F-00 — Contexte maître

> À coller en tête de **chaque** session de génération.

```text
Tu es un développeur front-end senior et un designer UI/UX expert. Tu construis le PROTOTYPE React de
« StandSet », une plateforme web multi-tenant qui accompagne les organisations dans leur transition vers
la norme ISO 9001:2026 (échéance de transition : septembre 2029). Le prototype fonctionne uniquement
avec des données mockées (aucun backend), mais doit être structuré pour brancher une vraie API plus tard.

MODÈLE MÉTIER (franchise en marque blanche, 3 niveaux de tenants) :
1. Concessionnaire (unique) — pilote le réseau via la « Console » : registre des licenciés, grille de
   redevances ancrée sur un montant T, journal des encaissements et relances, habilitations et audits
   (alerte à 12 mois avant expiration), publication versionnée du « contenu socle » du Kit.
2. Licenciés (cabinets de conseil, organismes de formation, institutions) — chacun dispose d'une instance
   brandée (logo, nom, couleur d'accent, sous-domaine), gère des utilisateurs et plusieurs dossiers
   clients, consulte ses redevances, déclare son activité.
3. Entreprises abonnées (self-service) — s'inscrivent et paient en ligne (carte / mobile money),
   disposent d'un dossier unique, marque StandSet par défaut.

4 RÔLES :
- ADMIN_CONCESSIONNAIRE : toute la plateforme (Console).
- LICENCIE_ADMIN : son tenant uniquement (dossiers, utilisateurs, marque, redevances).
- LICENCIE_USER (consultant / formateur) : uniquement les dossiers qui lui sont affectés.
- ENTREPRISE : son dossier unique.

LE KIT (espace de travail d'un dossier, identique pour les 3 derniers rôles) :
analyse d'écart clause par clause avec score de couverture, plan de transition en 6 phases (tâches
types du socle en lecture seule + tâches personnalisées), registre documentaire (socle + ajouts, statuts
À créer / En cours / Validé), suivi de 3 parcours de formation, rapport de synthèse PDF brandé.

RÈGLES DE DONNÉES :
- Cloisonnement strict entre tenants : un utilisateur ne voit JAMAIS les données d'un autre tenant.
- Flux descendant : la Console publie une version du socle → tous les tenants sont notifiés ; un dossier
  en cours affiche « nouvelle version disponible » sans écraser les évaluations existantes.
- Flux ascendant : seuls des agrégats anonymisés remontent à la Console (dossiers actifs, sessions de
  formation, CA sessions déclaré). Aucun contenu client (écarts, documents) ne remonte.

STACK IMPOSÉE :
Vite + React 18 + TypeScript strict, React Router v6 (createBrowserRouter, routes lazy), Tailwind CSS,
shadcn/ui (Radix) pour les primitives, lucide-react pour les icônes, @tanstack/react-query au-dessus
de services mockés, zustand pour l'état de session/UI, react-hook-form + zod pour les formulaires,
recharts pour les graphiques, date-fns (locale fr), sonner pour les toasts, framer-motion pour les
micro-animations, react-i18next (fr par défaut, en prêt), @tanstack/react-table pour les tableaux.

DESIGN : thème BLEU & BLANC, style « registre » (lignes fines, références codées, chiffres en
police mono tabulaire, cartes blanches sur fond bleu très pâle). Interface en français. Sobre,
professionnel, lisible, rassurant, avec quelques éléments signature (horloge de transition, anneau de
couverture, rail des 6 phases, carte thermique des clauses).

QUALITÉ DE CODE :
- Architecture par feature (src/features/<domaine>/{pages,components,dialogs,hooks}).
- Composants petits et typés, aucune logique métier dans le JSX : calculs dans src/lib/calculations.
- Toute donnée passe par src/services/*.service.ts (jamais d'import direct des mocks dans une page).
- Accessibilité AA : labels, focus visibles, navigation clavier, aria sur les dialogs, contrastes.
- Responsive mobile-first (usage sur connexions mobiles ouest-africaines : pages légères, lazy loading,
  skeletons, bannière hors-ligne).
- Toutes les chaînes UI via i18n (clés dans src/i18n/fr.json).
- Pas de code mort, pas de commentaires superflus.

Respecte strictement les conventions déjà présentes dans le projet (design tokens, composants
communs, services). Réutilise avant de créer.
```

---

### F-01 — Initialisation du projet & architecture

```text
Initialise le projet StandSet (voir contexte maître).

1. Crée un projet Vite React TypeScript nommé « standset-prototype ». Configure :
   - alias « @/ » → src/
   - Tailwind CSS + tailwindcss-animate, shadcn/ui (style « new-york », base color slate, CSS variables)
   - ESLint + Prettier (import order, pas de any), tsconfig strict
   - scripts : dev, build, preview, lint, typecheck

2. Installe : react-router-dom, @tanstack/react-query, @tanstack/react-table, zustand, react-hook-form,
   zod, @hookform/resolvers, recharts, date-fns, sonner, framer-motion, lucide-react, clsx,
   tailwind-merge, class-variance-authority, react-i18next, i18next, cmdk, react-dropzone,
   @fontsource-variable/plus-jakarta-sans, @fontsource/jetbrains-mono.

3. Crée cette arborescence (fichiers index.ts vides si nécessaire) :

src/
├── app/
│   ├── App.tsx
│   ├── providers.tsx          # QueryClient, i18n, Theme, Toaster, TooltipProvider
│   └── router.tsx             # toutes les routes, lazy
├── assets/                    # logo StandSet (SVG), illustrations
├── components/
│   ├── ui/                    # primitives shadcn (button, input, dialog, sheet, table, tabs…)
│   └── common/                # composants transverses maison (PageHeader, KpiCard, StatusBadge…)
├── layouts/
│   ├── PublicLayout.tsx
│   ├── AuthLayout.tsx
│   ├── ConsoleLayout.tsx
│   ├── TenantLayout.tsx
│   ├── EnterpriseLayout.tsx
│   └── DossierLayout.tsx
├── features/
│   ├── auth/
│   ├── public/
│   ├── console/
│   │   ├── dashboard/  licencies/  entreprises/  redevances/
│   │   ├── habilitations/  kit-versions/  import/  settings/
│   ├── tenant/
│   │   ├── dashboard/  dossiers/  users/  branding/  redevances/  declarations/  onboarding/
│   ├── consultant/
│   ├── enterprise/
│   │   ├── dashboard/  signup/  billing/  support/
│   ├── kit/                   # modules partagés du dossier
│   │   ├── overview/  gap-analysis/  transition-plan/  documents/  trainings/  report/
│   ├── notifications/
│   └── profile/
│   (chaque feature : pages/, components/, dialogs/, hooks/, index.ts)
├── mocks/
│   ├── data/                  # jeux de données seed (*.seed.ts)
│   ├── db.ts                  # base en mémoire + persistance localStorage
│   └── delay.ts               # latence simulée + erreurs aléatoires optionnelles
├── services/                  # API mockée : *.service.ts (signature async identique à une vraie API)
├── hooks/                     # hooks transverses (useCurrentUser, useTenant, useOnline, useDebounce…)
├── stores/                    # zustand : session.store.ts, ui.store.ts
├── lib/
│   ├── calculations/          # coverage.ts, royalties.ts, alerts.ts, progress.ts
│   ├── format.ts              # money (FCFA), dates, pourcentages, références
│   ├── permissions.ts         # matrice rôle → capacités
│   └── utils.ts               # cn()
├── types/                     # modèles de domaine (domain.ts, enums.ts)
├── i18n/
│   ├── index.ts
│   ├── fr.json
│   └── en.json
└── styles/
    └── globals.css            # tokens CSS + styles print

4. Ajoute un README.md court : lancement, comptes de démo, structure, comment remplacer les mocks
   par une API réelle (seul src/services change).

Ne crée encore aucune page métier. Termine par un App qui affiche « StandSet — prototype » avec le
design system une fois F-02 appliqué.
```

---

### F-02 — Design system « Registre bleu »

```text
Crée le design system de StandSet. Thème BLEU & BLANC, style « registre » : l'esthétique d'un registre
officiel modernisé — papier blanc, filets fins, références codées, chiffres alignés — au service d'une
démarche qualité rassurante et structurée.

1. TOKENS (src/styles/globals.css, variables CSS HSL mappées dans tailwind.config) :
   Bleu marque (proche du logo StandSet) :
   --brand-50  #EEF4FF   --brand-100 #DCE7FF   --brand-200 #BCD2FF   --brand-300 #8EB3FF
   --brand-400 #5B8CFA   --brand-500 #3366F0   --brand-600 #1F4FE0   --brand-700 #1A3FC4
   --brand-800 #1B359C   --brand-900 #1B2F7A   --brand-950 #0B1640 (« encre » : titres, sidebar Console)
   Neutres froids : --ink #0F172A, --muted #64748B, --line #E3E9F4, --paper #FFFFFF, --canvas #F5F8FD
   Sémantiques : success #0E9F6E, warning #E3A008, danger #E02424, info = brand-600
   Accents de rôle (UNIQUEMENT pour badges, avatars et puces — reprennent l'infographie) :
   concessionnaire = brand-700, licencié = #16A34A, consultant = #EA580C, entreprise = #7C3AED.
   Accent tenant : --tenant-accent (défaut brand-600), surchargé à l'exécution par la couleur
   choisie par le licencié. Tous les boutons primaires et liens actifs du TenantLayout utilisent
   --tenant-accent ; la Console et l'espace Entreprise restent en brand-600.
   Génère automatiquement --tenant-accent-foreground (blanc ou encre selon contraste WCAG).

   Rayons : 6px (inputs), 10px (cartes), 14px (dialogs). Ombres très douces teintées bleu
   (0 1px 2px rgb(27 47 122 / .06), 0 8px 24px rgb(27 47 122 / .08)).
   Espacement base 4px. Largeur de contenu max 1440px.

2. TYPOGRAPHIE :
   - UI : Plus Jakarta Sans Variable (400/500/600/700).
   - Chiffres, références, montants, codes de clause : JetBrains Mono, font-variant-numeric: tabular-nums.
   - Échelle : display 32/40, h1 24/32, h2 20/28, h3 16/24, body 14/22, small 13/20, caption 12/16.
   - Titres de section en petites capitales espacées (tracking 0.08em, 11px, brand-700) avec un filet
     fin en dessous — signature « registre ».

3. PRIMITIVES shadcn à générer et thémer : button (variants primary, secondary, outline, ghost,
   danger, link ; tailles sm/md/lg/icon), input, textarea, select, combobox, checkbox, radio-group,
   switch, slider, label, form, dialog, alert-dialog, sheet (drawer latéral), popover, tooltip,
   dropdown-menu, tabs, badge, avatar, card, table, skeleton, progress, separator, scroll-area,
   calendar, date-picker, breadcrumb, command, toast (sonner), stepper (maison), segmented-control
   (maison), file-dropzone (maison, react-dropzone).

4. MOTIFS « REGISTRE » à exposer comme utilitaires / composants :
   - .ledger-row : lignes de tableau séparées par filet 1px --line, hover brand-50, zébrage désactivé.
   - <RefCode value="LIC-0012" /> : référence en mono, fond brand-50, texte brand-800, radius 4.
   - <SectionTitle> : petites capitales + filet.
   - <DottedLeader label value /> : libellé …………… valeur (pour fiches et récapitulatifs).
   - Fond canvas avec très léger motif de lignes horizontales (opacité 3 %) sur les pages d'auth.
   - Tampon « VALIDÉ / HABILITÉ / SUSPENDU » : badge légèrement incliné (-4°), bordure double, utilisé
     sur les fiches (effet cachet officiel, sobre).

5. MOTION : transitions 150–220 ms ease-out ; entrée des pages fade + translateY 4px ; compteurs KPI
   animés ; respecter prefers-reduced-motion.

6. Crée une page /design-system (accessible en dev uniquement) qui présente : palette, typographie,
   boutons, champs, badges de statut, cartes, tableau, motifs registre, états vides, skeletons.

Contraintes : contraste AA partout, focus ring 2px brand-400 offset 2px, pas de dégradés criards
(autorisé : dégradé très subtil brand-950 → brand-800 dans la sidebar Console et les héros).
```

---

### F-03 — Modèle de domaine, mocks & services

```text
Crée le modèle de domaine, les données mockées et la couche de services de StandSet.

1. TYPES (src/types/domain.ts) — au minimum :
   Role = 'ADMIN_CONCESSIONNAIRE' | 'LICENCIE_ADMIN' | 'LICENCIE_USER' | 'ENTREPRISE'
   User { id, firstName, lastName, email, role, tenantId|null, avatarUrl?, title?, twoFactorEnabled,
          lastLoginAt, status: 'ACTIF'|'INVITE'|'DESACTIVE' }
   Segment = 'CABINET'|'FORMATION'|'INSTITUTION'|'PME'|'ETI'
   LicenceStatus = 'EN_ATTENTE'|'HABILITE'|'SUSPENDU'
   Licencie { id, ref (LIC-0001), raisonSociale, segment, territoire, pays, exclusivite: boolean,
              status, dateEntree, contact, branding: Branding, kitVersionId, indicators: AggregatedIndicators }
   Branding { logoUrl?, nomCommercial, accentColor, subdomain?, customDomain?, domainStatus, email, phone, address }
   AggregatedIndicators { dossiersActifs, sessionsFormation, caSessionsDeclare, periode }
   Enterprise { id, ref (ENT-0001), raisonSociale, secteur, effectif, pays, plan, subscriptionStatus,
                nextBillingAt, dossierId }
   RoyaltyGrid { T, currency: 'XOF', entryFeeCoefBySegment: Record<Segment, number>, annualFixedCoef,
                 exclusivityMarkupPct, caFormationPct, programmeForfaitCoef, subscriptionPlans[] , version, updatedAt }
   RoyaltyLine { id, licencieId, type: 'DROIT_ENTREE'|'REDEVANCE_ANNUELLE'|'MAJORATION_EXCLUSIVITE'
                 |'VARIABLE_CA'|'FORFAIT_PROGRAMME', periode, montantDu, dueDate }
   Payment { id, licencieId, royaltyLineId?, montant, date, mode: 'VIREMENT'|'MOBILE_MONEY'|'CHEQUE'|'CARTE', reference }
   Reminder { id, licencieId, sentAt, channel: 'EMAIL', niveau: 1|2|3, montant }
   Habilitation { id, licencieId, intitule, delivreeLe, expireLe, auditeur }
   Audit { id, licencieId, date, resultat: 'CONFORME'|'ECART_MINEUR'|'ECART_MAJEUR', notes, suspensionProposee }
   KitVersion { id, number ('2026.3'), publishedAt, publishedBy, changelog, status: 'BROUILLON'|'PUBLIEE'|'ARCHIVEE',
                content: SocleContent }
   SocleContent { clauses: Clause[], phases: PhaseTemplate[], documents: DocumentTemplate[], trainings: TrainingPath[] }
   Clause { id, code ('4.1'), chapitre (4..10), titre, exigence, guide, poids, nouveaute2026: boolean }
   PhaseTemplate { id, ordre (1..6), titre, description, taches: TaskTemplate[] }
   Dossier { id, ref (DOS-0042), tenantId, clientName, secteur, effectif, siteCount, responsable,
             assignedUserIds[], kitVersionId, createdAt, targetAuditDate, status: 'ACTIF'|'EN_PAUSE'|'CLOTURE' }
   ClauseAssessment { dossierId, clauseId, score: 0|1|2|3|4|null (null = non évaluée), applicable,
                      constat, preuves, actionIds[], evaluatedBy, evaluatedAt }
   Task { id, dossierId, phaseOrdre, templateId?|null (null = personnalisée), titre, description,
          responsable, dueDate, status: 'A_FAIRE'|'EN_COURS'|'TERMINEE'|'BLOQUEE', sourceClauseId? }
   DossierDocument { id, dossierId, templateId?|null, code, titre, type, status: 'A_CREER'|'EN_COURS'|'VALIDE',
                     owner, updatedAt, fileName? }
   TrainingSession { id, dossierId, pathId, date, duree, formateur, participants: Participant[], lieu, caFacture? }
   Notification { id, userId, type, title, body, link, createdAt, readAt? }
   AccessLog { id, userId, action, ip, at }

2. SEED (src/mocks/data/*.seed.ts) — données réalistes en contexte ouest-africain (FCFA, villes :
   Abidjan, Dakar, Cotonou, Lomé, Ouagadougou, Bamako, Yamoussoukro) :
   - T = 1 000 000 FCFA. Coefficients droit d'entrée : CABINET 1.0, FORMATION 0.8, INSTITUTION 1.5,
     PME 0.5, ETI 0.75. Redevance annuelle 0.4 T. Majoration exclusivité +25 %. Variable 8 % du CA
     sessions déclaré. Forfait programme 0.3 T. Plans self-service : Essentiel 25 000 FCFA/mois,
     Pro 45 000 FCFA/mois, Annuel -15 %.  (Hypothèses à aligner sur le prototype Console HTML.)
   - 12 licenciés (statuts variés : 8 habilités, 2 en attente, 2 suspendus), dont « Qualis Conseil »
     (cabinet, Abidjan, exclusivité, accent #0E7490) et « FormaPro Sahel » (formation, Dakar, accent #1F4FE0).
   - 48 entreprises self-service.
   - 3 versions du Kit : 2026.1 (archivée), 2026.2 (publiée, utilisée par certains dossiers), 2026.3 (publiée, dernière).
   - Clauses ISO 9001 chapitres 4 à 10 (4.1–4.4, 5.1–5.3, 6.1–6.3, 7.1–7.5 avec 7.1.1–7.1.6, 8.1–8.7,
     9.1–9.3, 10.1–10.3), environ 40 clauses, avec 5 marquées nouveauté 2026 (ex. changement
     climatique en 4.1/4.2, culture qualité et éthique en 5.1, gestion des opportunités en 6.1).
   - 6 phases : 1 Cadrage & diagnostic, 2 Analyse d'écart, 3 Planification des actions,
     4 Mise en œuvre & documentation, 5 Formation & sensibilisation, 6 Audit interne & certification ;
     4 à 7 tâches types chacune.
   - ~25 documents socle (Politique qualité, Cartographie des processus, Manuel/SMQ, Procédure
     maîtrise des informations documentées, Registre des risques et opportunités, Plan d'audit
     interne, Revue de direction…).
   - 3 parcours de formation : « Sensibilisation direction & encadrement », « Pilotes de processus &
     référents qualité », « Auditeurs internes ISO 9001:2026 », avec modules et durée.
   - Chez Qualis Conseil : 3 utilisateurs (1 admin, 2 consultants), 9 dossiers clients fictifs
     (Ivoire Agro SA, Lagune Pharma, Batik Logistique, Sahel BTP, Cacao Premium Export,
     Clinique Les Palmiers, Transit Atlantique, Banque Rurale du Sud, Eburnie Emballages) avec
     avancements variés (12 % → 91 %), dont un sur la version 2026.2 (pour tester « nouvelle version »).
   - Journal : 18 mois d'encaissements, quelques retards, 6 relances.
   - Habilitations dont 3 expirant dans moins de 12 mois (alertes) et 1 audit avec écart majeur.
   - Notifications et journal d'accès.

3. BASE EN MÉMOIRE (src/mocks/db.ts) : collections typées, initialisées depuis le seed, persistées
   dans localStorage (clé « standset-demo-v1 »), fonction resetDemo(). Fonction delay(min=200,max=600).

4. SERVICES (src/services/) — API asynchrone, retours typés, erreurs typées (ApiError), filtrage
   par tenant OBLIGATOIRE à partir de la session courante (simule le cloisonnement) :
   auth.service, licencies.service, entreprises.service, royalties.service, payments.service,
   habilitations.service, kitVersions.service, dossiers.service, assessments.service,
   tasks.service, documents.service, trainings.service, reports.service, users.service,
   branding.service, notifications.service, billing.service, import.service, aggregates.service.
   Chaque service appelant une donnée d'un autre tenant doit lever ApiError(403).
   aggregates.service ne renvoie QUE des nombres agrégés à la Console (jamais de contenu dossier).

5. CALCULS (src/lib/calculations/, fonctions pures + tests unitaires vitest) :
   - coverage.ts : score clause 0–4 (0 Non traité, 1 Initié, 2 Partiel, 3 Largement couvert,
     4 Conforme), clauses non applicables exclues ; couverture globale = Σ(score×poids) / Σ(4×poids)
     en % arrondi ; couverture par chapitre ; nombre d'écarts (score ≤ 2).
   - royalties.ts : montants dus par licencié à partir de la grille (droit d'entrée × coef segment,
     annuelle, majoration si exclusivité, variable = pct × CA déclaré, forfait), solde = dû − encaissé,
     retard = échéances dépassées non soldées.
   - alerts.ts : alerte habilitation si expireLe − 12 mois ≤ aujourd'hui ; niveaux « à planifier »
     (≤ 12 mois), « urgent » (≤ 3 mois), « expirée ».
   - progress.ts : avancement phase = tâches terminées / tâches ; avancement dossier pondéré
     (écart 30 %, plan 40 %, documents 20 %, formations 10 %).

6. HOOKS react-query par domaine (useLicencies, useDossier(id), useAssessments(dossierId), …) avec
   clés normalisées et invalidation après mutation.
```

---

### F-04 — Routing, layouts, authentification mockée & garde-fous

```text
Mets en place le routing, les layouts et l'authentification mockée de StandSet.

1. SESSION (stores/session.store.ts, zustand persist) : user, tenant (Licencie|Enterprise|null),
   impersonation (dev), login(email, password), verify2fa(code), logout(). Mot de passe démo
   « demo1234 », code 2FA démo « 123456 ».

2. PERMISSIONS (lib/permissions.ts) : matrice rôle → capacités (ex. console.view, licencies.manage,
   kit.publish, dossiers.create, dossiers.viewAssignedOnly, branding.edit, users.manage,
   royalties.viewOwn, billing.manage). Hook useCan(capability). Composant <Can I="...">.

3. ROUTES (lazy + Suspense avec skeleton de page) :
   Public : /, /tarifs, /connexion, /connexion/2fa, /mot-de-passe-oublie, /reinitialiser,
            /inscription (wizard), /suspendu, /403, /404
   Console (ADMIN_CONCESSIONNAIRE) sous /console :
     /console (dashboard), /console/licencies, /console/licencies/:id, /console/entreprises,
     /console/entreprises/:id, /console/redevances/grille, /console/redevances/journal,
     /console/habilitations, /console/kit, /console/kit/:versionId (éditeur), /console/import,
     /console/parametres, /console/journal-acces
   Licencié (LICENCIE_ADMIN, LICENCIE_USER) sous /app :
     /app (dashboard selon rôle), /app/bienvenue (onboarding, admin), /app/dossiers,
     /app/mes-taches (user), /app/utilisateurs (admin), /app/marque (admin),
     /app/redevances (admin), /app/declarations (admin)
   Entreprise (ENTREPRISE) sous /espace :
     /espace (dashboard), /espace/abonnement, /espace/support
   Espace dossier (Kit, partagé) :
     /app/dossiers/:dossierId/{vue-ensemble, analyse-ecart, plan, documents, formations, rapport}
     /espace/dossier/{vue-ensemble, analyse-ecart, plan, documents, formations, rapport}
   Communs : /notifications, /profil (dans chaque layout).

4. GARDES : <RequireAuth>, <RequireRole roles=[…]>, <RequireDossierAccess> (LICENCIE_USER
   n'accède qu'aux dossiers affectés → sinon /403), <RequireActiveTenant> (licencié SUSPENDU →
   /suspendu), redirection post-login selon rôle.

5. LAYOUTS :
   - ConsoleLayout : sidebar sombre (brand-950 → brand-900) repliable, logo StandSet, badge
     « Console », sections : Pilotage (Tableau de bord), Réseau (Licenciés, Entreprises),
     Finances (Grille de redevances, Journal), Conformité (Habilitations & audits), Contenu
     (Kit & versions, Import), Système (Paramètres, Journal d'accès). Topbar blanche : fil d'Ariane,
     recherche globale (⌘K), cloche notifications, avatar + menu.
   - TenantLayout : sidebar BLANCHE avec filet droit, logo et nom commercial du licencié en tête,
     accent --tenant-accent injecté depuis tenant.branding.accentColor ; mention discrète
     « propulsé par StandSet » en pied de sidebar. Menu filtré par rôle (voir infographie :
     Tableau de bord, Clients/Dossiers, Kit ISO 9001:2026, Utilisateurs, Redevances ; pour le
     consultant : Tableau de bord, Mes clients, Mes tâches, Support).
   - EnterpriseLayout : topbar horizontale simple (logo StandSet, Tableau de bord, Mon dossier,
     Abonnement, Support), pensée pour un utilisateur non expert.
   - DossierLayout (imbriqué dans Tenant/Enterprise) : en-tête de dossier (nom client, RefCode,
     version du Kit, anneau de couverture mini, avancement global, équipe affectée), puis onglets
     horizontaux collants : Vue d'ensemble · Analyse d'écart · Plan de transition · Documents ·
     Formations · Rapport. Bandeau « nouvelle version du socle disponible » si applicable (D-21).
   - AuthLayout : écran scindé — panneau gauche bleu profond avec proposition de valeur et
     horloge de transition, panneau droit blanc avec le formulaire.

6. SÉLECTEUR DE PERSONA (dev uniquement, flottant en bas à gauche) : bascule instantanée entre les
   4 comptes démo + bouton « Réinitialiser la démo ».

7. Mobile : sidebars en drawer (Sheet) sous 1024px ; barre d'onglets dossier scrollable horizontalement.
```

---

### F-05 — Composants métier transverses

```text
Crée les composants communs (src/components/common/) réutilisés sur tous les écrans, chacun avec
props typées et story visible sur /design-system.

- PageHeader : titre, sous-titre, fil d'Ariane, zone d'actions à droite, onglets optionnels.
- KpiCard : libellé, valeur (mono, compteur animé), variation (↑↓ avec couleur), sparkline optionnelle,
  icône, lien « voir ». Variante compacte.
- StatusBadge : mapping central de TOUS les statuts métier → libellé FR + couleur + icône
  (EN_ATTENTE, HABILITE, SUSPENDU, A_CREER, EN_COURS, VALIDE, A_FAIRE, TERMINEE, BLOQUEE,
  ACTIF, EN_PAUSE, CLOTURE, BROUILLON, PUBLIEE, ARCHIVEE, EN_RETARD, SOLDE…).
- RoleBadge : couleur d'accent du rôle + icône.
- Money : formatage FCFA (« 1 250 000 FCFA », séparateur espace fine), mono, variantes positif/négatif.
- RefCode, SectionTitle, DottedLeader (cf. F-02).
- CoverageRing : anneau SVG 0–100 %, couleur par seuil (< 40 danger, 40–70 warning, ≥ 70 brand,
  ≥ 90 success), valeur au centre, tailles sm/md/lg, animation de remplissage.
- ScoreBar : barre horizontale fine avec pourcentage (utilisée dans les listes de clients).
- ClauseScorePicker : segmented control 0–4 + « N/A », chaque niveau avec libellé et couleur,
  navigable au clavier (← →), tooltips de définition.
- PhaseRail : rail horizontal des 6 phases (pastilles numérotées reliées par une ligne, remplissage
  proportionnel à l'avancement, phase courante mise en avant, cliquable). Version verticale mobile.
- TransitionClock : compte à rebours jusqu'au 15/09/2029 (années, mois, jours) avec mini-barre de
  la période de transition écoulée ; variantes « héros » et « compacte ».
- ClauseHeatmap : grille des clauses groupées par chapitre (4 à 10), chaque cellule colorée selon
  le score, tooltip (code, titre, score), clic → ouvre l'évaluation.
- DataTable : wrapper @tanstack/react-table : tri, recherche, filtres à facettes (chips), pagination,
  sélection multiple avec barre d'actions groupées, colonnes masquables, densité, état vide, skeleton,
  export CSV côté client. Style ledger-row.
- FilterBar : recherche + filtres + vues enregistrées.
- EmptyState : illustration linéaire bleue, titre, texte, action principale.
- ConfirmDialog : confirmation standard et destructive (option « saisir le nom pour confirmer »).
- FileDropzone : glisser-déposer, types acceptés, taille max, aperçu, progression simulée.
- Timeline : historique vertical (événements horodatés, icône, acteur).
- StatCompare : « avant / après » ou « v2026.2 → v2026.3 ».
- AvatarStack : pile d'avatars avec +N.
- OfflineBanner : bannière si navigator.onLine = false (« Vous êtes hors ligne — vos saisies seront
  synchronisées »), avec file d'attente simulée.
- NewVersionBanner : bandeau d'information versions du socle.
- KeyboardShortcut : affiche ⌘K / Ctrl K.
```

---

## 2. Pages publiques & authentification

### P-01 — Page d'accueil (vitrine)

`Route : /` · `Layout : PublicLayout` · `Feature : features/public`

```text
Crée la page d'accueil publique de StandSet (vitrine qui mène à l'inscription self-service et à
la connexion). Ton : expert, rassurant, orienté échéance.

Sections :
1. Header collant blanc : logo StandSet, liens (La norme 2026, Comment ça marche, Tarifs,
   Devenir licencié), boutons « Se connecter » (outline) et « Démarrer ma transition » (primary).
2. Héros : titre « Votre transition ISO 9001:2026, structurée de bout en bout. », sous-titre,
   2 CTA, et à droite une composition illustrant le produit : carte « Analyse d'écart » avec
   CoverageRing 68 %, mini PhaseRail, carte « Documents 14/25 validés ». Sous le héros :
   TransitionClock en version héros (« Il reste 2 ans, 11 mois, 16 jours pour migrer »).
3. « Ce que change l'édition 2026 » : 4 cartes (contexte & climat, culture qualité, risques &
   opportunités, preuves documentées) — style fiches de registre avec numéro de clause.
4. « Comment ça marche » : les 6 phases présentées sur un PhaseRail vertical animé au scroll.
5. « Trois façons d'utiliser StandSet » : Entreprise en autonomie / Accompagné par un licencié /
   Devenir licencié (cabinets, formateurs, institutions) — chaque carte avec CTA.
6. Tarifs (résumé des plans self-service Essentiel / Pro / Annuel, lien /tarifs).
7. Preuves : chiffres réseau (licenciés, dossiers en cours, pays) — issus des agrégats mockés.
8. FAQ (accordéon) et footer (mentions légales, confidentialité ARTCI/RGPD, contact).

Mobile : héros empilé, composition produit simplifiée. Images légères (SVG), aucune vidéo.
```

### P-02 — Connexion

`Route : /connexion` · `Layout : AuthLayout`

```text
Crée l'écran de connexion.
- Panneau gauche (bleu profond, motif de lignes registre) : logo, phrase « Ensemble vers
  l'excellence opérationnelle », 3 puces de valeur, TransitionClock compacte.
- Panneau droit : titre « Connexion », champs courriel et mot de passe (afficher/masquer), case
  « Se souvenir de moi », lien « Mot de passe oublié ? », bouton « Se connecter » (loading),
  lien « Pas encore de compte ? Démarrer ma transition ».
- En dessous, bloc « Comptes de démonstration » : 4 cartes persona cliquables (avatar, nom, rôle,
  RoleBadge coloré) qui préremplissent et connectent : Admin concessionnaire, Licencié
  (Qualis Conseil), Consultant (Qualis Conseil), Entreprise (Eburnie Emballages).
- Si le tenant est brandé (sous-domaine simulé via ?tenant=qualis), afficher logo et accent du
  licencié à la place de StandSet (démontre le theming à la connexion).
- Erreurs : identifiants invalides (message générique), compte suspendu → /suspendu, 5 échecs →
  message de verrouillage temporaire. Validation zod.
- Si 2FA activé pour le compte → /connexion/2fa.
```

### P-03 — Vérification double facteur

`Route : /connexion/2fa` · `Layout : AuthLayout`

```text
Écran de saisie du code 2FA : 6 cases OTP (auto-focus, collage accepté, avance automatique),
compte à rebours de validité 30 s, lien « Utiliser un code de secours », case « Faire confiance à
cet appareil 30 jours », bouton « Vérifier ». Code démo 123456. Erreur : vibration légère des
cases + message. Lien retour connexion.
```

### P-04 — Mot de passe oublié & réinitialisation

`Routes : /mot-de-passe-oublie, /reinitialiser` · `Layout : AuthLayout`

```text
1. Mot de passe oublié : champ courriel → état de confirmation (« Si un compte existe, un lien a
   été envoyé ») avec illustration d'enveloppe et bouton « Renvoyer » (désactivé 60 s).
2. Réinitialisation : nouveau mot de passe + confirmation, jauge de robustesse (4 critères cochés
   en direct : 10 caractères, majuscule, chiffre, caractère spécial), succès → redirection connexion
   avec toast.
```

### P-05 — Inscription self-service (wizard)

`Route : /inscription` · `Layout : AuthLayout (variante large)` · `Feature : features/enterprise/signup`

```text
Crée le parcours d'inscription d'une entreprise en 4 étapes avec Stepper en haut et récapitulatif
latéral collant (plan choisi, prix, prochaine échéance).

Étape 1 — Votre organisation : raison sociale, secteur (select), effectif (tranches), pays, ville,
  certifiée ISO 9001:2015 ? (oui/non + date d'échéance du certificat), nombre de sites.
Étape 2 — Votre compte : prénom, nom, fonction (responsable qualité par défaut), courriel,
  téléphone (indicatif pays), mot de passe (jauge), consentement CGU + politique de confidentialité
  (cases non pré-cochées), consentement marketing optionnel.
Étape 3 — Votre formule : cartes Essentiel / Pro avec bascule Mensuel/Annuel (-15 %), liste des
  fonctionnalités, badge « Recommandé » sur Pro. Mention « Sans engagement, résiliable à tout moment ».
Étape 4 — Paiement : ouvre le composant de paiement (voir D-26) intégré dans la page : onglets
  « Carte bancaire » et « Mobile Money » (Orange Money, MTN MoMo, Moov Money, Wave). Mock : succès
  après 1,5 s ; numéro se terminant par 0000 = échec.
Écran final — Bienvenue : confetti discret, CoverageRing à 0 %, « Votre dossier est prêt »,
  3 prochaines étapes, bouton « Commencer mon analyse d'écart » → /espace.

Sauvegarde des étapes dans l'état (retour arrière sans perte), validation par étape, mobile-first.
```

### P-06 — Pages d'erreur & états d'accès

`Routes : /suspendu, /403, /404, + ErrorBoundary`

```text
Crée 4 écrans d'état cohérents (illustration linéaire bleue + message + action) :
- /suspendu : « L'accès à cette instance est suspendu » — explication neutre, contact du
  concessionnaire, bouton « Se déconnecter ». Tampon « SUSPENDU » style registre.
- /403 : « Ce dossier ne vous est pas affecté » (cas consultant) → retour à mes dossiers.
- /404 : « Page introuvable » avec recherche.
- ErrorBoundary global : « Une erreur est survenue », bouton réessayer, référence d'incident (RefCode).
```

---

## 3. Console — Administrateur concessionnaire

### C-01 — Tableau de bord réseau

`Route : /console` · `Layout : ConsoleLayout` · `Dialogs : D-03, D-04`

```text
Crée le tableau de bord réseau de la Console. Objectif : en 10 secondes, l'administrateur sait
comment va le réseau, combien il doit encaisser et ce qui demande une action.

1. PageHeader : « Bonjour Koffi », date du jour, sélecteur de période (Mois / Trimestre / Année),
   bouton « Publier une version du Kit » (ouvre /console/kit).
2. Rangée de 4 KpiCard : Licenciés habilités (12 dont 2 en attente), Dossiers actifs réseau
   (1 248, agrégat), Redevances de la période (encaissé / dû, barre de progression), Alertes
   ouvertes (habilitations + retards).
3. Colonne principale :
   - Graphique « Redevances » (recharts, barres empilées par type : droit d'entrée, annuelle,
     variable, forfait) avec courbe des encaissements.
   - Graphique « Activité réseau agrégée » : dossiers actifs et sessions de formation par mois
     (aire), avec mention « Données agrégées et anonymisées ».
   - Tableau « Effectifs par segment » (Cabinet, Formation, Institution, PME, ETI) + donut.
4. Colonne droite :
   - « À traiter » : liste priorisée (habilitation qui expire dans 2 mois, 3 échéances en retard,
     1 licencié en attente de validation, 1 audit avec écart majeur) — chaque ligne a une action
     directe (Relancer → D-04, Voir la fiche, Valider).
   - Carte « Version du Kit en production » : 2026.3, date, % des dossiers migrés (anneau),
     lien vers les versions.
   - Carte « Carte du réseau » : liste pays/villes avec nombre de licenciés (mini barres)
     — pas de vraie carte géographique pour rester léger.
5. Pied : TransitionClock compacte « Échéance de transition : 15/09/2029 ».

Skeletons pendant le chargement, compteurs animés, responsive (KPI en 2×2 sur mobile).
```

### C-02 — Registre des licenciés

`Route : /console/licencies` · `Dialogs : D-01, D-02, D-28`

```text
Crée l'écran « Registre des licenciés » — le cœur de la Console, au style registre assumé.

- PageHeader : titre, compteur, actions « Nouveau licencié » (D-01), « Importer (JSON) » (D-28),
  « Exporter CSV ».
- Onglets rapides avec compteurs : Tous · Habilités · En attente · Suspendus.
- FilterBar : recherche (raison sociale, référence), segment (multi), pays/territoire,
  exclusivité (oui/non), alerte (habilitation < 12 mois, retard de paiement).
- DataTable colonnes : Réf (RefCode), Raison sociale (+ logo miniature + nom commercial), Segment,
  Territoire, Exclusivité (icône cadenas), Statut (StatusBadge), Dossiers actifs (agrégat),
  Solde redevances (Money, rouge si retard), Habilitation (date d'expiration + pastille d'alerte),
  Version Kit, Actions (menu : Ouvrir la fiche, Changer le statut → D-02, Relancer → D-04,
  Se connecter en tant que (impersonation démo, journalisée)).
- Sélection multiple → barre d'actions : Relancer, Exporter.
- Vue alternative « Cartes » (toggle) : fiches licenciés en grille avec tampon de statut.
- Ligne cliquable → /console/licencies/:id.
- État vide pédagogique si aucun résultat.
```

### C-03 — Fiche licencié

`Route : /console/licencies/:id` · `Dialogs : D-02, D-03, D-04, D-05, D-06`

```text
Crée la fiche détaillée d'un licencié.

En-tête : logo + raison sociale + nom commercial, RefCode, StatusBadge, tampon registre du statut,
segment, territoire, exclusivité, date d'entrée, sous-domaine (lien). Actions : « Changer le statut »
(D-02), « Enregistrer un encaissement » (D-03), « Relancer » (D-04), menu (se connecter en tant que,
exporter la fiche).

Stepper de cycle de statut visible sous l'en-tête : En attente → Habilité → Suspendu, avec dates
de passage (Timeline compacte).

Onglets :
1. Synthèse : DottedLeader des informations administratives et contact ; 4 KpiCard d'agrégats
   remontés (dossiers actifs, sessions de formation, CA sessions déclaré, taux de dossiers sur la
   dernière version) avec bannière « Indicateurs agrégés — aucune donnée client n'est accessible
   depuis la Console ». Graphique d'évolution des agrégats sur 12 mois.
2. Redevances : décomposition calculée (DottedLeader : droit d'entrée = coef × T, annuelle,
   majoration exclusivité, variable = 8 % × CA déclaré, forfait) avec total ; tableau de l'échéancier
   (échéance, type, dû, encaissé, solde, statut) ; historique des encaissements ; historique des relances.
3. Habilitations & audits : liste des habilitations (intitulé, délivrée, expire, jauge temporelle
   avec seuil 12 mois), bouton « Ajouter une habilitation » (D-05) ; liste des audits (date,
   résultat, notes) avec bouton « Consigner un audit » (D-06). Si écart majeur → encart d'alerte
   avec action « Proposer une suspension ».
4. Instance : aperçu de la marque (logo, couleur, domaine, statut DNS), version du Kit utilisée,
   nombre d'utilisateurs (agrégat), dernière activité.
5. Historique : Timeline de tous les événements (création, changements de statut, paiements,
   relances, publications reçues).
```

### C-04 — Espaces entreprises (self-service)

`Routes : /console/entreprises, /console/entreprises/:id`

```text
Crée la liste des entreprises abonnées en self-service et leur fiche.
- KPI : abonnés actifs, MRR (FCFA), churn du mois, essais/impayés.
- DataTable : Réf, Raison sociale, Secteur, Pays, Formule (Essentiel/Pro, mensuel/annuel),
  Statut abonnement (Actif, Impayé, Résilié), Prochaine facturation, Version Kit, Inscrite le.
- Fiche : informations organisation, historique de facturation (factures mockées), statut
  d'abonnement, avancement AGRÉGÉ uniquement (pourcentage global, sans détail des écarts), actions :
  suspendre l'accès, relancer impayé, offrir un mois.
```

### C-05 — Grille de redevances (paramétrage du montant T)

`Route : /console/redevances/grille` · `Dialogs : D-29`

```text
Crée l'écran de paramétrage de la grille de redevances ancrée sur T. C'est un écran de configuration
sensible : clarté des calculs et simulation en direct.

Disposition en 2 colonnes :
GAUCHE — Formulaire (react-hook-form + zod) :
  - Montant de référence T (input monétaire FCFA, gros, mono) + devise (lecture seule XOF).
  - Droit d'entrée par segment : tableau Segment | Coefficient (slider + input) | Montant calculé.
  - Redevance annuelle fixe : coefficient × T.
  - Majoration exclusivité territoriale : %.
  - Variable sur CA des sessions de formation déclaré : %.
  - Forfait programme : coefficient × T.
  - Abonnements self-service : plans (nom, prix mensuel, remise annuelle).
DROITE — Simulateur collant « Aperçu du calcul » :
  - Choisir un segment, cocher exclusivité, saisir un CA sessions annuel → affichage en direct du
    détail (DottedLeader) et du total première année / années suivantes.
  - Encart « Impact sur le réseau » : nombre de licenciés concernés, variation estimée des
    redevances annuelles (avant → après, StatCompare).
Pied : historique des versions de la grille (v1, v2… avec date et auteur) ; bouton « Enregistrer
la nouvelle grille » → ConfirmDialog (D-29) expliquant que la grille s'applique aux prochaines
échéances. Détection de modifications non enregistrées (garde de navigation).
```

### C-06 — Journal des redevances & relances

`Route : /console/redevances/journal` · `Dialogs : D-03, D-04, D-31`

```text
Crée le journal des redevances.
- KPI : Total dû (période), Encaissé, Solde, Montant en retard (+ nombre de licenciés).
- Onglets : Échéancier · Encaissements · Relances.
- Échéancier : DataTable (Licencié, Type, Période, Échéance, Dû, Encaissé, Solde, Statut :
  À venir / Partiel / Soldé / En retard avec nombre de jours). Lignes en retard marquées d'un filet
  rouge à gauche. Actions ligne : Enregistrer un encaissement (D-03), Relancer (D-04).
- Encaissements : liste (date, licencié, mode, référence, montant) + bouton « Enregistrer ».
- Relances : liste (date, licencié, niveau 1/2/3, montant, canal, statut d'ouverture simulé) +
  encart « Relances automatiques » : switch activé, règle (J+7 niveau 1, J+21 niveau 2, J+45
  niveau 3), aperçu du modèle de courriel.
- Frise mensuelle en haut (12 mois) : barres dû/encaissé, clic = filtre la période.
- Bouton « Export comptable CSV » (D-31).
```

### C-07 — Habilitations & audits

`Route : /console/habilitations` · `Dialogs : D-05, D-06`

```text
Crée l'écran de suivi des habilitations et audits du réseau.
- Bandeau d'alertes : « 3 habilitations arrivent à échéance dans moins de 12 mois », « 1 audit
  avec écart majeur ».
- Vue « Frise » (par défaut) : une ligne par licencié, axe temporel sur 36 mois, barre de validité
  de chaque habilitation, zone hachurée des 12 derniers mois avant expiration, marqueurs d'audits
  (couleur par résultat), ligne « aujourd'hui ».
- Vue « Liste » : DataTable (Licencié, Habilitation, Délivrée, Expire, Niveau d'alerte :
  OK / À planifier / Urgent / Expirée, Dernier audit, Résultat).
- Actions : Ajouter une habilitation (D-05), Consigner un audit (D-06), Proposer une suspension
  (depuis un audit en écart majeur → D-02 pré-rempli).
```

### C-08 — Kit & versions

`Route : /console/kit` · `Dialogs : D-07, D-12`

```text
Crée l'écran de gestion des versions du contenu socle du Kit.
- En-tête : version en production (2026.3, grand, mono), date, auteur, bouton « Nouvelle version
  (brouillon) » qui duplique la dernière publiée et ouvre l'éditeur C-09.
- Carte « Adoption » : répartition des dossiers du réseau par version (agrégat, barre empilée),
  nombre de tenants notifiés.
- Liste chronologique des versions (style registre, numéros à gauche) : numéro, statut
  (Brouillon / Publiée / Archivée), date et heure de publication, auteur, résumé du changelog,
  compteurs de changements (+3 clauses, 2 tâches modifiées…), actions : Ouvrir, Comparer (D-12),
  Publier (si brouillon → D-07), Archiver.
- Explication pédagogique (encart) : « Publier diffuse le socle à tous les tenants. Les dossiers
  en cours conservent leurs évaluations et sont informés de la nouvelle version. »
```

### C-09 — Éditeur du contenu socle

`Route : /console/kit/:versionId` · `Dialogs : D-07, D-08, D-09, D-10, D-11, D-12`

```text
Crée l'éditeur du contenu socle d'une version du Kit. Lecture seule si la version est publiée,
éditable si brouillon (bannière claire de l'état).

Structure : en-tête (numéro, statut, dernière sauvegarde auto, boutons « Comparer avec… » (D-12),
« Publier » (D-07)), puis onglets :
1. Grille d'analyse d'écart : arborescence des chapitres 4 → 10 à gauche, liste des clauses à
   droite (code mono, titre, poids, badge « Nouveauté 2026 »). Clic → D-08 (édition clause).
   Réordonnancement par glisser-déposer, ajout, désactivation.
2. Phases du plan : 6 colonnes/cartes de phase (titre, description) avec leurs tâches types ;
   ajout/édition via D-09. Le nombre de phases est fixe (6).
3. Registre documentaire : tableau des documents types (code, titre, type, clause liée,
   obligatoire oui/non) ; D-10.
4. Parcours de formation : 3 parcours (cartes), modules, durée, public cible ; D-11.
Chaque élément modifié depuis la version précédente porte une pastille « modifié / nouveau ».
Compteur global de changements dans l'en-tête.
```

### C-10 — Paramètres globaux & sécurité

`Route : /console/parametres` · `Dialogs : D-25, D-29`

```text
Crée les paramètres globaux de la plateforme, en sections verticales avec navigation d'ancres à gauche :
- Identité de la plateforme : nom, logo StandSet, couleur par défaut, domaine racine (standset.com).
- Courriels : expéditeur, modèles (relance niveaux 1-3, alerte habilitation, nouvelle version du
  Kit, bienvenue) avec éditeur simple et aperçu à variables ({{licencie}}, {{montant}}…).
- Sécurité : 2FA obligatoire pour les admins (switch), durée de session, politique de mot de passe,
  verrouillage après N échecs.
- Sauvegardes : dernière sauvegarde (mock), fréquence quotidienne, bouton « Tester une
  restauration » (simulation avec étapes et succès).
- Conformité : liens registre des traitements, mentions légales, politique de confidentialité
  (ARTCI / RGPD), durée de conservation.
- Langue : français (actif), anglais (bêta).
- Zone de danger : réinitialiser la démo (D-29 destructive).
```

### C-11 — Import JSON (reprise des prototypes)

`Route : /console/import` · `Dialogs : D-28`

```text
Crée l'écran d'import des fichiers JSON produits par les prototypes HTML (Console et Kit).
Assistant en 3 étapes :
1. Déposer le fichier (FileDropzone .json) + choix du type détecté automatiquement
   (« Registre Console » ou « Dossier Kit ») ; pour un dossier Kit, choisir le licencié cible.
2. Analyse : rapport de validation (nombre d'éléments reconnus par entité, champs manquants,
   avertissements, correspondance des clauses avec la version du socle) sous forme de tableau
   vert/orange/rouge ; aperçu des 5 premiers éléments.
3. Import : barre de progression, résultat « 1 dossier, 38 évaluations, 42 tâches, 19 documents,
   6 sessions importés sans perte », lien vers le dossier importé.
Historique des imports en bas (date, fichier, type, résultat, auteur).
```

### C-12 — Journal des accès administrateur

`Route : /console/journal-acces`

```text
Crée le journal des accès administrateur (exigence sécurité) : DataTable filtrable (date/heure,
utilisateur, rôle, action — connexion, échec de connexion, 2FA, impersonation, publication,
modification de grille —, IP, appareil). Filtres par période et type d'action. Export CSV.
Lignes sensibles (impersonation, échec répété) mises en évidence.
```

---

## 4. Instance licencié — Administrateur de tenant

> Toutes ces pages utilisent `TenantLayout` et l'accent `--tenant-accent` du licencié.

### L-01 — Onboarding & personnalisation de l'instance

`Route : /app/bienvenue` · `Rôle : LICENCIE_ADMIN` · `Dialogs : D-24`

```text
Crée l'onboarding de première connexion d'un licencié — un moment « waouh » où il voit son
instance prendre ses couleurs en direct.

Wizard en 4 étapes à gauche, APERÇU EN DIRECT à droite (mini-maquette de l'app : sidebar avec son
logo, bouton primaire, en-tête de rapport PDF, en-tête de courriel) qui se met à jour à chaque saisie.
1. Identité : upload du logo (FileDropzone, recadrage carré/horizontal), nom commercial.
2. Couleur d'accent : 8 pastilles suggérées + sélecteur libre (hex), vérification de contraste
   AA en direct (« Lisibilité : excellente / insuffisante — nous ajusterons le texte en blanc »).
3. Coordonnées : courriel de contact, téléphone, adresse, site web (utilisés dans courriels et PDF).
4. Domaine (optionnel) : sous-domaine proposé « qualis.standset.com » (vérification de
   disponibilité simulée) ou domaine propre → D-24 (instructions DNS).
Fin : « Votre instance est prête » + checklist (inviter l'équipe, créer un premier dossier,
découvrir le Kit) avec liens.
Possibilité de « Passer pour l'instant ».
```

### L-02 — Tableau de bord du tenant

`Route : /app` · `Rôle : LICENCIE_ADMIN` · `Dialogs : D-13`

```text
Crée le tableau de bord du licencié : vue consolidée de tous ses dossiers clients.
1. En-tête : « Bonjour Aïcha — Qualis Conseil », bouton « Nouveau dossier » (D-13).
   Si une nouvelle version du socle existe : NewVersionBanner (« Version 2026.3 publiée —
   2 dossiers utilisent encore 2026.2 »).
2. KPI : Dossiers actifs, Couverture moyenne (CoverageRing mini), Tâches en retard, Sessions de
   formation ce trimestre, Prochain audit de transition (date + client).
3. « Portefeuille de dossiers » : liste compacte type infographie — pour chaque client : nom,
   ScoreBar d'avancement global (couleurs), phase courante (pastille n/6), consultant(s)
   (AvatarStack), prochaine échéance. Tri par avancement / échéance.
4. « Échéances d'audit de transition » : frise des 6 prochains mois avec les audits planifiés.
5. « Activité de l'équipe » : Timeline des dernières actions (évaluations, documents validés,
   sessions enregistrées).
6. Encarts droite : « Mes redevances » (prochaine échéance, solde, lien), « Déclaration d'activité
   du trimestre » (à faire / faite, lien L-08).
```

### L-03 — Clients & dossiers

`Route : /app/dossiers` · `Rôles : LICENCIE_ADMIN (tous), LICENCIE_USER (affectés)` · `Dialogs : D-13, D-14, D-29`

```text
Crée la liste des dossiers clients.
- Toggle de vue : Cartes (par défaut) / Tableau / Kanban par phase (6 colonnes).
- Carte dossier : nom du client + secteur, RefCode, CoverageRing sm, PhaseRail mini, AvatarStack
  des intervenants, date cible d'audit, badge version du Kit (orange si obsolète), statut.
- Filtres : statut, phase, consultant, secteur, version du Kit, « en retard ».
- Actions (admin) : Nouveau dossier (D-13), Affecter des intervenants (D-14), Mettre en pause,
  Clôturer, Archiver (D-29).
- Pour LICENCIE_USER : même écran, titre « Mes clients », uniquement ses dossiers, pas d'action
  de création.
- Clic → /app/dossiers/:id/vue-ensemble.
```

### L-04 — Utilisateurs du tenant

`Route : /app/utilisateurs` · `Rôle : LICENCIE_ADMIN` · `Dialogs : D-15, D-14, D-29`

```text
Crée la gestion de l'équipe du licencié.
- DataTable : Utilisateur (avatar, nom, courriel), Profil (Consultant / Formateur / Admin),
  Statut (Actif / Invitation envoyée / Désactivé), Dossiers affectés (nombre + AvatarStack clients),
  2FA (activé ou non), Dernière connexion, Actions (modifier les affectations → D-14, renvoyer
  l'invitation, désactiver → D-29).
- Bouton « Inviter un utilisateur » (D-15).
- Panneau latéral (Sheet) au clic : fiche utilisateur avec la matrice de ses dossiers
  (cases à cocher) et son activité récente.
- Encart pédagogique : « Un consultant ne voit que les dossiers qui lui sont affectés. »
```

### L-05 — Marque & instance

`Route : /app/marque` · `Rôle : LICENCIE_ADMIN` · `Dialogs : D-24`

```text
Crée l'écran de personnalisation permanente (mêmes champs que L-01, mais en page de paramètres).
Colonne gauche : formulaire par sections (Identité, Couleur, Coordonnées, Domaine).
Colonne droite : aperçu en direct avec 3 onglets : « Application », « Courriel » (rendu d'un
courriel de relance aux couleurs du licencié), « Rapport PDF » (page de garde A4 miniature).
Domaine : statut (Non configuré / En attente DNS / Actif avec certificat HTTPS) + bouton
« Configurer » (D-24). Bouton « Enregistrer » avec aperçu des changements appliqués immédiatement
au layout après sauvegarde.
```

### L-06 — Mes redevances

`Route : /app/redevances` · `Rôle : LICENCIE_ADMIN`

```text
Crée la consultation des redevances côté licencié (lecture seule).
- Carte « Solde » en tête (Money, grand), prochaine échéance, statut (à jour / en retard).
- Décomposition annuelle (DottedLeader) : droit d'entrée, redevance annuelle, majoration
  exclusivité, variable sur CA déclaré, forfait programme — avec info-bulle expliquant chaque
  calcul (sans dévoiler T brut si jugé sensible : afficher les montants).
- Échéancier (tableau : échéance, type, montant, payé, solde, statut) et encaissements.
- Graphique 12 mois dû vs payé.
- Bouton « Télécharger le relevé » (PDF mock), coordonnées de paiement du concessionnaire.
```

### L-07 — Déclarations d'activité

`Route : /app/declarations` · `Rôle : LICENCIE_ADMIN` · `Dialogs : D-23`

```text
Crée l'écran des déclarations d'activité (flux ascendant vers la Console).
- Encart d'explication : « Seuls ces agrégats sont transmis au concessionnaire. Aucune donnée de
  vos clients (analyses, documents) ne quitte votre instance. » avec schéma simple
  (votre instance → agrégats → Console).
- Carte de la période en cours : dossiers actifs (calculé auto), sessions de formation réalisées
  (calculé auto), CA des sessions (à saisir) → bouton « Déclarer » (D-23) ; estimation de la
  redevance variable correspondante (8 %).
- Historique des déclarations (période, dossiers, sessions, CA, redevance calculée, date d'envoi).
```

---

## 5. Kit — Espace dossier (partagé par 3 rôles)

> Utilisé par LICENCIE_ADMIN, LICENCIE_USER (dossiers affectés) et ENTREPRISE (dossier unique).
> Layout : `DossierLayout`. Les droits varient : l'entreprise n'a pas d'affectation d'équipe ; le branding PDF dépend du tenant.

### K-01 — Vue d'ensemble du dossier

`Route : …/vue-ensemble` · `Dialogs : D-14, D-21, D-22`

```text
Crée la vue d'ensemble d'un dossier — le « cockpit » de la transition d'une organisation.
1. Bloc héros : CoverageRing lg (couverture de l'analyse d'écart), avancement global pondéré,
   phase courante, date cible d'audit + compte à rebours, version du socle (badge + lien D-21 si
   nouvelle version).
2. PhaseRail complet (6 phases) : pour chaque phase, % d'avancement, tâches terminées/total ;
   clic → plan filtré sur la phase.
3. Grille de 4 cartes modules (cliquables) : Analyse d'écart (clauses évaluées x/40, écarts
   ouverts), Plan (tâches en retard), Documents (validés/total, mini barre par statut),
   Formations (3 parcours, % de participants formés).
4. « Prochaines actions » : 5 tâches les plus urgentes (échéance, responsable) avec case à cocher
   rapide.
5. « Points d'attention » : clauses à score 0 ou 1 sur des exigences nouveauté 2026.
6. Colonne droite : fiche client (DottedLeader : secteur, effectif, sites, responsable qualité,
   certification actuelle), équipe affectée (AvatarStack + « Gérer » → D-14, admin uniquement),
   activité récente (Timeline).
Bouton d'en-tête « Générer le rapport » (D-22).
```

### K-02 — Analyse d'écart

`Route : …/analyse-ecart` · `Dialogs : D-16 (drawer), D-17`

```text
Crée le module d'analyse d'écart clause par clause — l'écran le plus utilisé, il doit être rapide
et agréable pour évaluer ~40 clauses.

Disposition :
- Barre supérieure collante : CoverageRing md + % global, compteur « 31/40 clauses évaluées »,
  nombre d'écarts, filtre (Toutes / Non évaluées / Écarts / Nouveautés 2026 / N/A), recherche,
  bascule de vue « Liste » / « Carte thermique ».
- Colonne gauche (sommaire) : chapitres 4 → 10 avec couverture par chapitre (mini barres),
  clic = défilement vers le chapitre.
- Zone principale (vue Liste) : groupes par chapitre (SectionTitle « § 4 — Contexte de
  l'organisme ») ; chaque clause = ligne registre : code mono, titre, badge nouveauté, pastille de
  score, constat résumé, nombre d'actions liées. La grille (code, titre, exigence) vient du socle en
  LECTURE SEULE (icône cadenas + tooltip « Contenu socle v2026.3 »).
  Clic → ouvre le drawer d'évaluation D-16.
- Vue « Carte thermique » : ClauseHeatmap en grand, légende des scores.
- Panneau « Synthèse » (repliable, à droite sur desktop) : radar ou barres de couverture par
  chapitre (recharts), top 5 écarts par poids.
- Mode « Évaluation rapide » (bouton) : parcours séquentiel plein écran, une clause à la fois,
  raccourcis clavier 0-4, N (N/A), → suivant, ← précédent, E ouvrir le constat.
Le score global se recalcule en direct (lib/calculations/coverage.ts). Sauvegarde automatique
avec indicateur « Enregistré ».
```

### K-03 — Plan de transition (6 phases)

`Route : …/plan` · `Dialogs : D-18, D-17`

```text
Crée le module Plan de transition en 6 phases.
- En-tête : PhaseRail interactif (sélection de phase), avancement global, bouton « Ajouter une
  tâche » (D-18).
- 3 vues (segmented control) :
  1. Phases (défaut) : accordéon ou colonnes par phase ; chaque tâche : case à cocher, titre,
     badge « Socle » (cadenas, titre/description non modifiables) ou « Personnalisée », responsable
     (avatar), échéance (rouge si dépassée), statut, lien « issue de la clause 6.1 » si générée
     depuis un écart.
  2. Kanban par statut (À faire / En cours / Bloquée / Terminée), glisser-déposer.
  3. Chronologie (Gantt léger) : barres par tâche sur l'axe du temps, groupées par phase, jalon
     « audit de certification ».
- Les tâches socle : seuls statut, responsable, échéance et commentaire sont modifiables.
- Filtres : responsable, statut, en retard, origine (socle / personnalisée / issue d'un écart).
- Clic tâche → drawer de détail (description, sous-tâches, commentaires, historique).
```

### K-04 — Registre documentaire

`Route : …/documents` · `Dialogs : D-19`

```text
Crée le registre documentaire du dossier.
- KPI en ligne : À créer · En cours · Validés (barre segmentée horizontale), % validé.
- DataTable style registre : Code (mono), Titre, Origine (Socle 🔒 / Ajout), Clause liée,
  Type (Politique, Procédure, Enregistrement, Formulaire…), Propriétaire, Statut (sélecteur
  inline À créer → En cours → Validé), Dernière mise à jour, Fichier (icône + nom, téléchargement mock).
- Regroupement par statut ou par chapitre de la norme (toggle).
- Bouton « Ajouter un document » (D-19). Les documents socle ne peuvent pas être supprimés.
- Drawer de détail : métadonnées, historique des versions du fichier, commentaires, action
  « Marquer comme validé » avec nom du validateur et date.
- Téléversement par glisser-déposer directement sur une ligne (mock).
```

### K-05 — Suivi des formations

`Route : …/formations` · `Dialogs : D-20`

```text
Crée le module de suivi des 3 parcours de formation.
- 3 grandes cartes parcours en tête (Sensibilisation direction, Pilotes de processus, Auditeurs
  internes) : public cible, nombre de modules, durée, participants formés / prévus (anneau),
  sessions réalisées.
- Sous chaque carte (ou onglet par parcours) : liste des sessions (date, formateur, lieu, durée,
  nombre de participants, modules couverts) + bouton « Enregistrer une session » (D-20).
- Onglet « Participants » : matrice participants × modules (cases cochées = suivi), export CSV.
- Pour un formateur (LICENCIE_USER) : raccourci « Enregistrer la session d'aujourd'hui ».
- Le CA facturé des sessions (champ optionnel) alimente l'agrégat « CA sessions » (L-07) — ne
  pas l'afficher dans l'espace Entreprise.
```

### K-06 — Rapport de synthèse

`Route : …/rapport` · `Dialogs : D-22`

```text
Crée le module Rapport de synthèse : aperçu fidèle du PDF, en pages A4 rendues en HTML.
- Barre d'outils : sélection des sections (D-22), date d'arrêté, bouton « Télécharger le PDF »
  (window.print() avec CSS @media print soigné, ou génération mock), « Historique des rapports ».
- Aperçu paginé (zoom 50/75/100 %) :
  1. Page de garde : logo et couleur du LICENCIÉ (ou StandSet pour l'entreprise self-service),
     nom du client, « Rapport de synthèse — Transition ISO 9001:2026 », date, RefCode, version du socle.
  2. Synthèse exécutive : CoverageRing, avancement global, phase courante, 3 messages clés.
  3. Analyse d'écart : tableau par chapitre, ClauseHeatmap, liste des écarts majeurs.
  4. Plan de transition : PhaseRail et tâches par phase avec statut.
  5. Registre documentaire : répartition par statut + liste.
  6. Formations : bilan des 3 parcours.
  7. Pied de page sur chaque page : coordonnées du licencié, pagination, « Confidentiel ».
- Style registre sobre, impression propre en noir et blanc aussi.
```

---

## 6. Utilisateur licencié (consultant / formateur)

### U-01 — Mon espace (tableau de bord consultant)

`Route : /app (rôle LICENCIE_USER)` · `Layout : TenantLayout`

```text
Crée le tableau de bord du consultant/formateur, centré sur « que dois-je faire aujourd'hui ».
1. En-tête : « Bonjour Mariam », nombre de dossiers affectés, bouton « Évaluation rapide »
   (reprend la dernière analyse d'écart en cours).
2. « Aujourd'hui & cette semaine » : tâches qui lui sont assignées, tous dossiers confondus,
   groupées (En retard / Aujourd'hui / Cette semaine), cochables directement.
3. « Mes clients » : liste de l'infographie — nom du client + ScoreBar colorée + % + phase +
   prochaine échéance ; clic → dossier.
4. « Sessions de formation à venir » (si profil formateur) avec bouton « Enregistrer une session ».
5. Colonne droite : raccourcis vers les modules du Kit (Analyse d'écart, Plan d'action,
   Documentation, Formation — icônes cochées comme dans l'infographie), notifications récentes,
   lien Support.
Aucune donnée d'un dossier non affecté ne doit apparaître (le service filtre).
```

### U-02 — Mes tâches (vue transverse)

`Route : /app/mes-taches` · `Rôle : LICENCIE_USER` · `Dialogs : D-18`

```text
Crée la vue « Mes tâches » : toutes les tâches assignées à l'utilisateur, tous dossiers affectés.
- Vues : Liste groupée par échéance / Calendrier mensuel / Par dossier.
- Chaque tâche : titre, dossier (pastille client), phase n/6, échéance, statut, origine.
- Actions rapides : changer le statut, reporter l'échéance, ouvrir dans le dossier.
- Filtres : dossier, phase, statut, en retard.
```

---

## 7. Entreprise abonnée (self-service)

### E-01 — Mon espace (tableau de bord entreprise)

`Route : /espace` · `Layout : EnterpriseLayout` · `Dialogs : D-21`

```text
Crée le tableau de bord de l'entreprise self-service — très guidé, pour un responsable qualité
qui travaille seul.
1. Héros « Mon avancement » : barre de progression globale (ex. 78 %), CoverageRing, message
   contextuel (« Vous êtes en phase 4 : Mise en œuvre & documentation »), bouton « Voir mon dossier ».
2. « Votre parcours » : les 4 étapes de l'infographie en cartes horodatées — 1 Se connecter /
   créer son compte (✓), 2 Compléter son analyse d'écart (68 % + « Continuer »), 3 Mettre en œuvre
   son plan d'action (actions, documents, formations), 4 Obtenir son suivi et la certification
   (préparer l'audit). L'étape courante est mise en avant.
3. « Prochaine meilleure action » : une seule recommandation claire (ex. « Évaluez les 9 clauses
   restantes du chapitre 8 — environ 20 min »).
4. TransitionClock compacte + date d'échéance du certificat actuel (saisie à l'inscription).
5. Encarts : abonnement (formule, prochaine facturation), aide (guides, contact support),
   nouveautés du socle (NewVersionBanner si nouvelle version, D-21).
```

### E-02 — Mon dossier

`Route : /espace/dossier/*` · `Layout : EnterpriseLayout + DossierLayout`

```text
Réutilise tels quels les modules K-01 à K-06 dans l'espace entreprise :
- Pas d'affectation d'équipe (masquer D-14), responsable = l'utilisateur lui-même, possibilité
  de saisir des « intervenants internes » en texte libre comme responsables de tâches.
- Rapport PDF à la marque StandSet par défaut (pas de marque blanche).
- Masquer le champ CA facturé des sessions de formation.
- Ajouter des aides contextuelles (icône « ? » ouvrant un panneau d'aide par module) car
  l'utilisateur n'est pas accompagné.
```

### E-03 — Abonnement & facturation

`Route : /espace/abonnement` · `Dialogs : D-26, D-27`

```text
Crée l'écran d'abonnement.
- Carte formule actuelle : nom, prix, périodicité, prochaine facturation, moyen de paiement
  (carte ••4242 ou numéro mobile money masqué), boutons « Changer de formule » (D-27),
  « Mettre à jour le moyen de paiement » (D-26).
- Historique des factures : numéro, date, montant, statut (Payée / Échouée / En attente),
  téléchargement PDF mock.
- Encart impayé (état alternatif) : bandeau rouge « Paiement échoué le 03/10 — réessayer ».
- Zone « Résilier l'abonnement » (D-27, parcours de rétention : proposer pause ou formule inférieure,
  rappel de la conservation des données et de l'export).
```

### E-04 — Aide & support

`Route : /espace/support` (aussi accessible aux consultants)

```text
Crée l'écran d'aide : recherche dans une base de connaissances mockée (articles par module du Kit),
guides « Premiers pas » en 5 étapes, FAQ, formulaire de contact (sujet, module, message, pièce
jointe) avec confirmation, et statut des demandes précédentes.
```

---

## 8. Écrans communs

### X-01 — Centre de notifications

`Route : /notifications` + popover dans la topbar

```text
Crée le système de notifications.
- Popover depuis la cloche (badge compteur) : 8 dernières, groupées Aujourd'hui / Plus tôt,
  icône par type (nouvelle version du Kit, relance, alerte habilitation, tâche assignée,
  document validé, paiement), bouton « Tout marquer comme lu », lien « Voir tout ».
- Page complète : filtres par type, lu/non lu, actions (ouvrir, marquer lu).
- Préférences (onglet) : par type, activer courriel / in-app.
Contenu différent selon rôle (mock filtré par utilisateur).
```

### X-02 — Profil & sécurité

`Route : /profil` · `Dialogs : D-25`

```text
Crée la page Profil : informations personnelles (avatar, nom, fonction, téléphone), langue
(français / anglais bêta), sécurité (changer le mot de passe, activer la double authentification
→ D-25, codes de secours, sessions actives avec « déconnecter les autres appareils »), préférences
de notification, et « Mes données » (export de mes données, lien politique de confidentialité).
```

### X-03 — Palette de commandes (⌘K)

`Global`

```text
Crée une palette de commandes globale (cmdk) ouverte par ⌘K / Ctrl+K et par la recherche de la
topbar. Contenu selon le rôle :
- Navigation (toutes les pages accessibles), Recherche (licenciés, dossiers, clauses « 6.1 »,
  documents, utilisateurs), Actions (Nouveau dossier, Nouveau licencié, Enregistrer une session,
  Publier une version, Évaluation rapide).
Résultats groupés, raccourcis affichés, navigation clavier, derniers éléments consultés.
```

---

## 9. Catalogue des dialogs, drawers & modales

> Conventions : `Dialog` pour les formulaires courts, `Sheet` (drawer droit, 480–640 px) pour l'édition riche, `AlertDialog` pour les confirmations. Toujours : titre explicite, description, focus sur le premier champ, `Échap` pour fermer, bouton primaire à droite, état « enregistrement… », toast de succès, gestion d'erreur inline. Formulaires en react-hook-form + zod.

### Console

**D-01 — Créer un licencié (stepper 3 étapes)**
```text
Dialog large avec Stepper. 1) Entité : raison sociale, nom commercial, segment (cartes
sélectionnables avec icône : Cabinet, Formation, Institution, PME, ETI), pays, territoire (villes/
régions multi), exclusivité territoriale (switch + avertissement si un autre licencié a déjà
l'exclusivité sur ce territoire). 2) Contact administrateur : nom, courriel, téléphone (recevra
l'invitation). 3) Récapitulatif : DottedLeader + redevances calculées automatiquement (droit
d'entrée selon segment, annuelle, majoration si exclusivité), statut initial « En attente ».
Validation → création du tenant (mock), toast, redirection vers la fiche.
```

**D-02 — Changer le statut / suspendre un licencié**
```text
Dialog : statut actuel → nouveau statut (radio cards En attente / Habilité / Suspendu), motif
obligatoire (select : Écart majeur d'audit, Impayés, Demande du licencié, Autre + commentaire),
date d'effet. Pour « Suspendu » : variante destructive, résumé d'impact (« 3 utilisateurs et 9
dossiers perdront l'accès immédiatement »), saisie du nom du licencié pour confirmer, case
« Notifier le licencié par courriel ». Pour « Habilité » : vérifie la présence d'une habilitation valide.
```

**D-03 — Enregistrer un encaissement**
```text
Dialog : licencié (combobox, pré-rempli si ouvert depuis une fiche), échéance(s) à solder
(liste à cocher avec soldes), montant (pré-calculé, modifiable), date, mode (Virement, Mobile
Money, Chèque, Carte), référence, pièce jointe (preuve). Affiche le solde restant après
encaissement. Gère le paiement partiel.
```

**D-04 — Envoyer une relance**
```text
Dialog en 2 colonnes : gauche — licencié(s), niveau de relance (1 courtois, 2 ferme,
3 mise en demeure), échéances concernées, montant total ; droite — aperçu du courriel (objet,
corps avec variables remplies, aux couleurs StandSet). Bouton « Envoyer » (mock) → entrée ajoutée
dans l'onglet Relances. En envoi groupé : liste des destinataires et total.
```

**D-05 — Ajouter une habilitation**
```text
Dialog : licencié, intitulé (select : Habilitation réseau StandSet, Formateur certifié, Auditeur
interne…), date de délivrance, durée (1/2/3 ans) → date d'expiration calculée, date d'alerte
(expiration − 12 mois) affichée, auditeur/délivrant, document justificatif.
```

**D-06 — Consigner un audit**
```text
Sheet : licencié, date, auditeur, périmètre, résultat (Conforme / Écart mineur / Écart majeur),
constats (liste dynamique), plan de correction exigé (date limite). Si « Écart majeur » : encart
d'alerte + case « Proposer une suspension » qui enchaîne sur D-02 pré-rempli.
```

**D-07 — Publier une version du Kit**
```text
Dialog en 3 étapes : 1) Numéro de version (proposé : 2026.4, format validé), résumé des
changements détectés (clauses +/−/modifiées, tâches, documents, parcours) ; 2) Changelog (éditeur
texte, notes pour les licenciés) ; 3) Impact et confirmation : « 12 tenants et 48 entreprises seront
notifiés », « 1 138 dossiers en cours conserveront leurs évaluations et verront un bandeau de mise
à jour », case de confirmation. Publier → animation de diffusion (liste des tenants qui passent à
« notifié »), horodatage, statut « Publiée ».
```

**D-08 — Éditer une clause du socle**
```text
Sheet : code (4.1…), chapitre, titre, exigence (texte riche), guide d'évaluation (critères pour
chaque niveau de score 0–4), preuves attendues (liste), poids (1–3), badge « Nouveauté 2026 »,
documents socle liés (multi-select). Indicateur « modifié depuis v2026.3 » avec diff du texte.
```

**D-09 — Éditer une tâche type / phase**
```text
Sheet : phase (1–6), titre, description, durée indicative, rôle responsable suggéré, clauses
liées, livrables attendus (documents socle liés), ordre dans la phase.
```

**D-10 — Éditer un document socle**
```text
Dialog : code, titre, type (Politique, Procédure, Processus, Enregistrement, Formulaire, Plan),
clause(s) liée(s), obligatoire (switch), description, modèle téléversable (fichier .docx mock).
```

**D-11 — Éditer un parcours de formation**
```text
Sheet : nom du parcours, public cible, objectifs, modules (liste réordonnable : titre, durée,
objectifs), durée totale calculée, prérequis, évaluation de fin (oui/non).
```

**D-12 — Comparer deux versions du Kit**
```text
Sheet plein écran : sélecteurs de version A et B, résumé des différences (compteurs), onglets
Clauses / Phases / Documents / Formations, diff par élément (ajouté en vert, supprimé en rouge,
modifié en orange avec diff de texte mot à mot).
```

### Licencié & Kit

**D-13 — Créer un dossier client**
```text
Dialog en 2 étapes : 1) Client : raison sociale, secteur, effectif, nombre de sites, ville,
responsable qualité (nom, courriel), certification actuelle (ISO 9001:2015 oui/non + date
d'échéance), date cible d'audit de transition. 2) Équipe & socle : intervenants affectés
(multi-select avec avatars), version du socle (dernière par défaut, verrouillée), aperçu de ce
qui sera généré (« 40 clauses à évaluer, 32 tâches types en 6 phases, 25 documents socle,
3 parcours »). Créer → redirection vers la vue d'ensemble du dossier.
```

**D-14 — Affecter des intervenants à un dossier**
```text
Dialog : liste des utilisateurs du tenant avec cases à cocher, profil (Consultant/Formateur),
charge actuelle (nombre de dossiers), rôle sur le dossier (Responsable / Contributeur).
Avertissement si on retire le dernier responsable.
```

**D-15 — Inviter un utilisateur**
```text
Dialog : prénom, nom, courriel, profil (Consultant / Formateur / Administrateur — avec
description des droits), dossiers à affecter (optionnel), message personnalisé. Aperçu du courriel
d'invitation aux couleurs du licencié. Invitation multiple (ajouter une ligne).
```

**D-16 — Évaluer une clause (drawer)**
```text
Sheet droit 640 px, navigable (← clause précédente / clause suivante →, raccourcis clavier).
- En-tête : code mono + titre + badge nouveauté + cadenas « socle v2026.3 ».
- Bloc « Exigence » (lecture seule, repliable) et « Guide d'évaluation » (critères par niveau).
- ClauseScorePicker 0–4 / N/A avec définition du niveau sélectionné.
- Champ « Constat » (texte), « Preuves » (liste + pièces jointes), « Commentaire interne ».
- Section « Actions liées » : liste des tâches liées + bouton « Créer une action » (D-17).
- Pied : évalué par / le, bouton « Enregistrer et suivant ».
- Si score ≤ 2 et aucune action liée : suggestion douce « Créer une action corrective ? ».
```

**D-17 — Créer une action depuis un écart**
```text
Dialog : pré-rempli depuis la clause (titre « Mettre en conformité § 6.1 — … », clause source),
phase suggérée (Phase 4 par défaut), responsable, échéance, priorité, description. La tâche créée
apparaît dans le plan avec le lien « issue de la clause ».
```

**D-18 — Ajouter / modifier une tâche personnalisée**
```text
Sheet : titre, description, phase (1–6), responsable (utilisateur ou intervenant interne libre
pour l'entreprise), échéance, statut, priorité, clause liée (optionnelle), sous-tâches
(checklist), pièces jointes. Pour une tâche socle : champs titre/description verrouillés avec
explication.
```

**D-19 — Ajouter un document au registre**
```text
Dialog : titre, code (proposé automatiquement), type, clause(s) liée(s), propriétaire, statut
initial, fichier (FileDropzone, optionnel), commentaire. Option « Basé sur un document socle »
(select) pour une variante.
```

**D-20 — Enregistrer une session de formation**
```text
Sheet : parcours (3 cartes), modules couverts (cases), date, durée, lieu / distanciel,
formateur, participants (ajout rapide nom + fonction, import CSV mock, ou sélection des
participants déjà connus du dossier), présence (cases), évaluation de satisfaction (1–5,
optionnel), CA facturé (masqué pour l'entreprise). Récapitulatif : « 12 participants, 3 modules ».
```

**D-21 — Nouvelle version du socle disponible**
```text
Dialog informatif : « La version 2026.3 est disponible (ce dossier utilise 2026.2) ». Résumé des
changements pertinents pour le dossier (3 clauses modifiées, 1 nouvelle, 2 tâches types
ajoutées), garantie « Vos évaluations, tâches et documents existants sont conservés ». Aperçu :
clauses nouvelles marquées « à évaluer ». Boutons « Adopter la version 2026.3 » / « Plus tard ».
Après adoption : toast, badge de version mis à jour, nouvelles clauses surlignées dans K-02.
```

**D-22 — Générer le rapport de synthèse**
```text
Dialog : sections à inclure (cases : synthèse, analyse d'écart détaillée, plan, documents,
formations, annexes), niveau de détail (Synthétique / Complet), date d'arrêté, destinataire
(nom affiché en page de garde), langue (FR). Aperçu de la page de garde brandée. « Générer » →
barre de progression → ouvre K-06 ou télécharge.
```

**D-23 — Déclarer l'activité (CA sessions)**
```text
Dialog : période (trimestre), dossiers actifs (pré-rempli, lecture seule), sessions réalisées
(pré-rempli), CA des sessions (saisie), calcul en direct de la redevance variable (8 %),
certification sur l'honneur (case), rappel « seuls ces 3 agrégats sont transmis ». Envoyer → toast.
```

**D-24 — Configurer un domaine personnalisé**
```text
Dialog en étapes : 1) Choix sous-domaine StandSet (vérif disponibilité) ou domaine propre ;
2) Instructions DNS (tableau CNAME/TXT avec bouton copier) ; 3) Vérification (bouton « Vérifier »
→ états En attente → Propagation → Actif + HTTPS émis, simulés).
```

### Compte & facturation

**D-25 — Activer la double authentification**
```text
Dialog 3 étapes : 1) explication + applis compatibles ; 2) QR code (image mock) + clé en clair
copiable, saisie du code à 6 chiffres (démo 123456) ; 3) 10 codes de secours (copier / télécharger),
case « J'ai conservé mes codes ». Désactivation : confirmation par mot de passe.
```

**D-26 — Paiement (carte / mobile money)**
```text
Composant de paiement réutilisable (page et dialog). Onglets :
- Carte : numéro (formatage par groupes, détection Visa/Mastercard), expiration, CVC, titulaire.
- Mobile Money : choix de l'opérateur (Orange Money, MTN MoMo, Moov Money, Wave — logos
  génériques), numéro, puis écran d'attente « Validez le paiement sur votre téléphone » avec
  compte à rebours et animation, succès/échec simulés.
Récapitulatif montant, mention paiement sécurisé, facturation récurrente expliquée. Aucune vraie
donnée bancaire n'est traitée (mock).
```

**D-27 — Changer de formule / résilier**
```text
Dialog : comparatif des formules avec la formule actuelle marquée, calcul du prorata, date
d'effet. Pour la résiliation : parcours en 2 étapes (motif, proposition de rétention : pause d'un
mois ou formule inférieure), puis confirmation destructive avec rappel « vos données restent
exportables 90 jours ».
```

### Transverses

**D-28 — Importer un fichier JSON**
```text
Version dialog du flux C-11 (dépôt → validation → import) pour un import rapide depuis le registre
ou la liste des dossiers.
```

**D-29 — Confirmation générique**
```text
AlertDialog réutilisable : variantes neutre et destructive, titre, description d'impact, option
de saisie de confirmation, bouton primaire contextualisé (« Archiver le dossier », pas « OK »).
```

**D-30 — Session expirée**
```text
Dialog non fermable : « Votre session a expiré pour des raisons de sécurité », saisie du mot de
passe pour reprendre sans perdre la page en cours, ou « Se déconnecter ».
```

**D-31 — Export CSV**
```text
Dialog : période, colonnes à inclure (cases), séparateur (; ou ,), encodage (UTF-8 BOM pour
Excel), aperçu des 3 premières lignes, « Exporter » → téléchargement généré côté client.
```

---

## 10. États transverses, responsive & finitions

### F-06 — Passe de finition globale

```text
Effectue une passe de finition sur tout le prototype StandSet :

1. ÉTATS : chaque page et chaque liste doit avoir un skeleton de chargement, un état vide
   (EmptyState avec action), un état d'erreur (message + réessayer). Activer dans le mock une
   option « erreurs aléatoires 5 % » (?chaos=1) pour tester.
2. HORS LIGNE : OfflineBanner ; les saisies du Kit (scores, statuts) sont mises en file et
   « synchronisées » au retour du réseau (simulation), avec indicateur par élément.
3. RESPONSIVE : vérifier 360 px, 768 px, 1024 px, 1440 px. Tableaux → cartes empilées sous 768 px.
   Drawers plein écran sur mobile. Cibles tactiles ≥ 44 px.
4. PERFORMANCE : routes lazy, pas d'image lourde, recharts chargé uniquement sur les pages qui
   l'utilisent, bundle initial < 250 ko gzip.
5. ACCESSIBILITÉ : navigation clavier complète, aria-live pour les toasts et le score global,
   ordre de focus dans les dialogs, libellés des icônes, contrastes AA (y compris accents tenant).
6. I18N : aucune chaîne en dur ; fichier en.json rempli pour les layouts et l'auth (démontrer la
   bascule FR/EN depuis le profil).
7. COHÉRENCE : un seul mapping de statuts (StatusBadge), un seul formatage monétaire (Money),
   dates au format « 12 oct. 2026 », références en RefCode.
8. MICRO-INTERACTIONS : compteurs KPI, remplissage des anneaux, transition de score dans
   ClauseScorePicker, confetti discret à la validation d'une phase complète, toasts contextuels
   (« Clause 6.1 enregistrée — couverture 68 % → 70 % »).
9. CLOISONNEMENT : écrire un test (vitest) qui vérifie que chaque service lève 403 lorsqu'un
   utilisateur d'un tenant demande une ressource d'un autre tenant, et que la Console n'obtient
   que des agrégats.
```

---

## 11. Checklist de recette du prototype

| # | Scénario de démonstration | Rôle |
|---|---------------------------|------|
| 1 | Se connecter via une carte persona, être redirigé vers le bon espace | Tous |
| 2 | Créer un licencié, le faire passer En attente → Habilité, voir la redevance calculée | Admin |
| 3 | Modifier T dans la grille, observer le simulateur et l'impact réseau | Admin |
| 4 | Enregistrer un encaissement partiel puis envoyer une relance niveau 2 | Admin |
| 5 | Voir une alerte d'habilitation à < 12 mois, consigner un audit avec écart majeur, proposer la suspension | Admin |
| 6 | Créer un brouillon de version du Kit, modifier une clause, comparer, publier | Admin |
| 7 | Suspendre un licencié puis tenter de se connecter avec son compte → /suspendu | Admin / Licencié |
| 8 | Personnaliser la marque (logo, couleur) et voir l'app, le courriel et le PDF changer | Licencié |
| 9 | Inviter un consultant, lui affecter 2 dossiers | Licencié |
| 10 | Créer un dossier, évaluer 5 clauses en mode rapide, créer une action depuis un écart | Licencié / Consultant |
| 11 | Faire avancer des tâches en Kanban, voir le PhaseRail et l'avancement évoluer | Consultant |
| 12 | Valider des documents, enregistrer une session de formation | Consultant |
| 13 | Adopter une nouvelle version du socle sur un dossier 2026.2 sans perte d'évaluations | Licencié |
| 14 | Générer le rapport PDF brandé licencié ; même chose côté entreprise (marque StandSet) | Licencié / Entreprise |
| 15 | Consultant : ouvrir l'URL d'un dossier non affecté → /403 | Consultant |
| 16 | S'inscrire en self-service, payer en Mobile Money (succès puis échec) | Entreprise |
| 17 | Déclarer le CA du trimestre et vérifier que la Console ne voit que les agrégats | Licencié / Admin |
| 18 | Importer un JSON de prototype et ouvrir le dossier importé | Admin |
| 19 | Activer la 2FA, se reconnecter avec le code | Tous |
| 20 | Passer hors ligne, modifier un score, revenir en ligne → synchronisation | Consultant |

---

## Annexe — Inventaire des écrans

| Code | Écran | Route | Rôle(s) |
|------|-------|-------|---------|
| P-01 | Accueil vitrine | `/` | Public |
| P-02 | Connexion | `/connexion` | Public |
| P-03 | Vérification 2FA | `/connexion/2fa` | Public |
| P-04 | Mot de passe oublié / réinitialisation | `/mot-de-passe-oublie`, `/reinitialiser` | Public |
| P-05 | Inscription self-service | `/inscription` | Public |
| P-06 | Suspendu / 403 / 404 / erreur | `/suspendu`, `/403`, `/404` | Tous |
| C-01 | Tableau de bord réseau | `/console` | Admin |
| C-02 | Registre des licenciés | `/console/licencies` | Admin |
| C-03 | Fiche licencié | `/console/licencies/:id` | Admin |
| C-04 | Espaces entreprises | `/console/entreprises(/:id)` | Admin |
| C-05 | Grille de redevances | `/console/redevances/grille` | Admin |
| C-06 | Journal des redevances | `/console/redevances/journal` | Admin |
| C-07 | Habilitations & audits | `/console/habilitations` | Admin |
| C-08 | Kit & versions | `/console/kit` | Admin |
| C-09 | Éditeur du socle | `/console/kit/:versionId` | Admin |
| C-10 | Paramètres globaux | `/console/parametres` | Admin |
| C-11 | Import JSON | `/console/import` | Admin |
| C-12 | Journal des accès | `/console/journal-acces` | Admin |
| L-01 | Onboarding & personnalisation | `/app/bienvenue` | Licencié admin |
| L-02 | Tableau de bord tenant | `/app` | Licencié admin |
| L-03 | Clients & dossiers | `/app/dossiers` | Licencié admin / user |
| L-04 | Utilisateurs | `/app/utilisateurs` | Licencié admin |
| L-05 | Marque & instance | `/app/marque` | Licencié admin |
| L-06 | Mes redevances | `/app/redevances` | Licencié admin |
| L-07 | Déclarations d'activité | `/app/declarations` | Licencié admin |
| K-01 | Vue d'ensemble dossier | `…/vue-ensemble` | Licencié, consultant, entreprise |
| K-02 | Analyse d'écart | `…/analyse-ecart` | idem |
| K-03 | Plan de transition | `…/plan` | idem |
| K-04 | Registre documentaire | `…/documents` | idem |
| K-05 | Formations | `…/formations` | idem |
| K-06 | Rapport de synthèse | `…/rapport` | idem |
| U-01 | Mon espace consultant | `/app` | Consultant |
| U-02 | Mes tâches | `/app/mes-taches` | Consultant |
| E-01 | Mon espace entreprise | `/espace` | Entreprise |
| E-02 | Mon dossier | `/espace/dossier/*` | Entreprise |
| E-03 | Abonnement & facturation | `/espace/abonnement` | Entreprise |
| E-04 | Aide & support | `/espace/support` | Entreprise, consultant |
| X-01 | Notifications | `/notifications` | Tous |
| X-02 | Profil & sécurité | `/profil` | Tous |
| X-03 | Palette de commandes | global | Tous |

**Dialogs :** D-01 à D-31 (voir section 9).

**Ordre de génération recommandé :** F-00 → F-01 → F-02 → F-03 → F-04 → F-05 → P-02/P-03 → C-01 → C-02 → C-03 → C-05 → C-06 → C-07 → C-08 → C-09 → L-01 → L-02 → L-03 → K-01 → K-02 → K-03 → K-04 → K-05 → K-06 → L-04 → L-05 → L-06 → L-07 → U-01 → U-02 → P-05 → E-01 → E-03 → E-04 → C-04 → C-10 → C-11 → C-12 → X-01 → X-02 → X-03 → P-01 → P-04 → P-06 → F-06.
