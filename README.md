# StandSet — prototype React

Prototype front-end de la plateforme multi-tenant StandSet (transition ISO 9001:2026). Toutes les données sont mockées et persistées dans le `localStorage` du navigateur ; aucun backend n'est nécessaire.

## Démarrer

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # build de production (dist/)
npm test           # tests des calculs métier (vitest)
npm run typecheck
```

## Comptes de démonstration

Mot de passe commun : `demo1234` · code 2FA : `123456`. La page de connexion propose aussi des cartes « un clic », et le bouton **Démo** (en bas à droite) permet de changer de persona ou de réinitialiser les données.

| Rôle | Courriel | Espace |
|------|----------|--------|
| Administrateur concessionnaire | koffi.mensah@standset.com (2FA) | `/console` |
| Licencié — Qualis Conseil | aicha.traore@qualis-conseil.ci | `/app` |
| Consultante — Qualis Conseil | mariam.diallo@qualis-conseil.ci | `/app` |
| Formateur — Qualis Conseil | serge.kouassi@qualis-conseil.ci (2FA) | `/app` |
| Entreprise — Kora Plastiques | fatou.ndiaye@kora-plastiques.ci | `/espace` |
| Licencié suspendu | rodrigue.agbo@normeplus.bj | `/suspendu` |

Autres entrées utiles : `/connexion?tenant=qualis` (connexion brandée), `/inscription` (self-service ; un numéro finissant par `0000` simule un paiement refusé), `/design-system`, `?chaos=1` (5 % d'erreurs réseau simulées).

## Structure

```
src/
├── app/            router (routes lazy), providers, gardes d'accès
├── layouts/        Console, Tenant (thémé par licencié), Entreprise, Dossier, Auth + shell (topbar, ⌘K, démo)
├── features/       une feature par domaine : pages, dialogs, composants
│   ├── console/    registre, redevances, habilitations, Kit & versions, import, paramètres
│   ├── tenant/     tableau de bord, dossiers, utilisateurs, marque, redevances, déclarations
│   ├── kit/        espace dossier partagé : vue d'ensemble, analyse d'écart, plan, documents, formations, rapport
│   ├── consultant/ enterprise/ auth/ public/ notifications/ profile/
├── components/ui/      primitives (Radix + Tailwind)
├── components/common/  composants métier (anneau de couverture, frise des phases, carte thermique, tableau…)
├── services/       API mockée — seul dossier à remplacer pour brancher un vrai backend
├── mocks/          seed déterministe + base en mémoire persistée
├── lib/calculations/  couverture, redevances, alertes, avancement, diff de versions (fonctions pures testées)
├── hooks/          react-query par domaine, utilisateur courant, réseau
└── i18n/           fr (défaut), en
```

## Brancher une API réelle

Les pages ne lisent jamais les mocks directement : elles passent par `src/hooks/queries.ts`, qui appelle `src/services/*.service.ts`. Remplacer le corps des services par des appels HTTP (mêmes signatures asynchrones) suffit. Le cloisonnement entre tenants est simulé dans `services/scope.ts` ; côté serveur, il devra être appliqué par l'API.

## Hypothèses à valider

Les formules suivent le cahier des charges mais doivent être alignées sur les prototypes HTML d'origine :

- redevances ancrées sur T = 1 000 000 FCFA (coefficients par segment, 8 % du CA, +25 % d'exclusivité) ;
- score de clause de 0 à 4, pondéré par le poids de la clause ;
- avancement global = écart 30 % · plan 40 % · documents 20 % · formations 10 %.
