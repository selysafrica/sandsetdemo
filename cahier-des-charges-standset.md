# Cahier des Charges Detaille

## Projet StandSet — Plateforme Multi-Tenant de Transition ISO 9001:2026

---

| Information       | Detail                                                  |
|-------------------|---------------------------------------------------------|
| Client            | Concessionnaire StandSet (maitre d'ouvrage)             |
| Prestataire       | Selys Africa                                            |
| Date du document  | 24 septembre 2026                                       |
| Reference         | SELYS-STANDSET-CPR-2026-001                             |
| Statut            | Version initiale                                        |
| Confidentialite   | Confidentiel — Diffusion restreinte                     |

---

## Sommaire

1. [Comprehension globale du projet](#1-comprehension-globale-du-projet)
2. [Contexte et existant](#2-contexte-et-existant)
3. [Architecture multi-tenant](#3-architecture-multi-tenant)
4. [Matrice des roles et perimetres](#4-matrice-des-roles-et-perimetres)
5. [Parcours utilisateurs detailles](#5-parcours-utilisateurs-detailles)
   - 5.1 [Administrateur concessionnaire](#51-administrateur-concessionnaire)
   - 5.2 [Licencie (administrateur de tenant)](#52-licencie--administrateur-de-tenant)
   - 5.3 [Utilisateur licencie (consultant / formateur)](#53-utilisateur-licencie-consultant--formateur)
   - 5.4 [Entreprise abonnee (self-service)](#54-entreprise-abonnee-self-service)
6. [Flux de donnees inter-tenants](#6-flux-de-donnees-inter-tenants)
7. [Exigences transverses](#7-exigences-transverses)
8. [Lotissement et calendrier](#8-lotissement-et-calendrier)
9. [Specifications techniques detaillees](#9-specifications-techniques-detaillees)
10. [Exigences fonctionnelles detaillees](#10-exigences-fonctionnelles-detaillees)
11. [Criteres d'acceptation](#11-criteres-dacceptation)
12. [Annexes](#12-annexes)

---

## 1. Comprehension globale du projet

### 1.1 Vision du projet

Le projet StandSet consiste a transformer deux prototypes HTML fonctionnels — **StandSet Console** et **StandSet Kit** — en une **plateforme web multi-tenant hebergee**, destinee a industrialiser l'accompagnement des organisations dans leur transition vers la norme **ISO 9001:2026**.

### 1.2 Contexte normatif

La norme ISO 9001 definit les exigences internationales en matiere de management de la qualite. La version 2015 etant en cours de revision, toute organisation certifiee devra migrer vers l'edition 2026 **avant septembre 2029**. Cette transition implique :

- Une analyse d'ecart clause par clause
- Un plan d'action structure
- La mise a jour de la documentation qualite
- La formation du personnel
- Le passage d'un audit de certification

### 1.3 Modele de distribution

StandSet propose un outil structure et reproductible distribue sous forme de **franchise en marque blanche**. Le modele repose sur trois niveaux :

| Niveau | Description |
|--------|-------------|
| **Concessionnaire unique** | Maitre d'ouvrage qui pilote le reseau, parametre la methodologie, publie les versions du kit et encaisse les redevances via la Console |
| **Licencies** | Cabinets de conseil, organismes de formation ou institutions, disposant chacun d'une instance brandee a leur marque pour accompagner leurs propres clients |
| **Entreprises en direct** | S'abonnent en self-service pour gerer leur propre dossier de transition sans intermediaire |

### 1.4 Horizon d'exploitation

- **Periode de transition** : jusqu'en septembre 2029
- **Mise en production Lot 1** : T1 2027

---

## 2. Contexte et existant

### 2.1 Livrables fournis a la signature

Le maitre d'ouvrage fournit a la signature du contrat :

| Document | Description |
|----------|-------------|
| `Console-Licencies-ISO9001-2026.html` | Application autonome gerant le reseau de licencies, avec etat en memoire et export/import JSON |
| `Kit-Deploiement-ISO9001-2026.html` | Application autonome de conduite de transition ISO, meme architecture |
| Business plan synthetique | Document separe decrivant le modele economique |

### 2.2 Valeur contractuelle des prototypes

Ces prototypes ont valeur de **cahier des charges fonctionnel executable** :

- **Ecrans, champs, calculs** (grille de redevances ancree sur T, score de couverture de l'analyse d'ecart, alertes d'audit a 12 mois)
- **Regles de statut et libelles** font reference
- **Toute fonctionnalite presente dans les prototypes doit etre reproduite a l'identique** dans la plateforme, sauf mention contraire

### 2.3 Charte visuelle

La charte visuelle des prototypes (palette, typographie, style « registre ») constitue la **base graphique** de la plateforme, enrichie par le theming par instance decrit dans l'architecture.

---

## 3. Architecture multi-tenant

### 3.1 Organisation en couches

La plateforme s'organise en **trois couches de tenants** avec un **cloisonnement strict des donnees** :

```
+--------------------------------------------------+
|        TENANT CONCESSIONNAIRE (unique)            |
|  Console complete, pilotage reseau, publication   |
+--------------------------------------------------+
          |                          |
          v                          v
+--------------------+   +--------------------+
| TENANT LICENCIE 1  |   | TENANT LICENCIE N  |
| Instance brandee    |   | Instance brandee    |
| Multi-dossiers      |   | Multi-dossiers      |
| Kit lecture/ecriture|   | Kit lecture/ecriture|
+--------------------+   +--------------------+
          |
          v
+--------------------+
| ESPACE ENTREPRISE  |
| (self-service)     |
| Dossier unique     |
| Sans marque blanche|
+--------------------+
```

### 3.2 Flux structurants entre couches

| Flux | Description |
|------|-------------|
| **Descendant (Console → Tenants)** | La Console publie une version du Kit → elle se diffuse a tous les tenants (contenu socle en lecture seule cote licencie) |
| **Ascendant (Tenants → Console)** | Indicateurs agreges anonymises : nombre de dossiers actifs, sessions de formation, CA declare — base du calcul des redevances variables |
| **Regle fondamentale** | Aucun contenu client (analyses d'ecart, documents) ne remonte a la Console : seuls des agregats circulent |

---

## 4. Matrice des roles et perimetres

| Role | Perimetre | Modules accessibles |
|------|-----------|---------------------|
| **Administrateur concessionnaire** | Toute la plateforme | Console complete, gestion des tenants, publication du kit, parametres globaux |
| **Licencie (admin tenant)** | Son tenant uniquement | Kit multi-dossiers, gestion utilisateurs, personnalisation marque, tableau redevances |
| **Utilisateur licencie** | Dossiers affectes | Kit de deploiement, rapports |
| **Entreprise abonnee** | Son dossier unique | Kit self-service, sans marque blanche |

---

## 5. Parcours utilisateurs detailles

### 5.1 Administrateur concessionnaire

#### 5.1.1 Connexion a la Console

- Authentification via courriel + mot de passe avec **double facteur optionnel**
- Acces au **tableau de bord reseau** affichant les KPI globaux :
  - Nombre de licencies actifs
  - Dossiers en cours
  - Redevances courantes
  - Alertes

#### 5.1.2 Gestion du registre des licencies

Depuis le registre, l'administrateur peut :

- **Creer un nouveau tenant licencie** en renseignant :
  - Raison sociale
  - Segment (cabinet, formation, institution, PME, ETI)
  - Territoire
  - Exclusivite eventuelle
- **Suivre le cycle de statut** : `En attente` → `Habilite` → `Suspendu`
- **Suspendre un licencie** : coupe immediatement l'acces de son tenant
- **Consulter la fiche detaillee** de chaque licencie avec ses indicateurs remontes

#### 5.1.3 Parametrage de la grille de redevances

L'administrateur configure la grille tarifaire **ancree sur un montant T** :

| Element | Description |
|---------|-------------|
| Droit d'entree | Par segment |
| Redevance annuelle fixe | Montant fixe |
| Majoration exclusivite | En cas d'exclusivite territoriale |
| Pourcentage CA formation | Sur le CA des sessions de formation declare |
| Forfait programme | Abonnements et forfaits |

Le systeme **calcule automatiquement** les montants dus par licencie.

#### 5.1.4 Journal des redevances et relances

- Acces au journal des encaissements
- Consultation des soldes et de l'echeancier
- **Relances automatiques par courriel** pour les echeances depassees

#### 5.1.5 Habilitations et audits

Pour chaque licencie, l'administrateur :

- Consigne les habilitations delivrees
- Recoit des **alertes automatiques a 12 mois** avant expiration
- Peut proposer une suspension en cas d'ecart majeur constate lors d'un audit

#### 5.1.6 Publication des versions du Kit

L'administrateur edite le contenu socle du Kit depuis la Console :

- **Grille d'analyse d'ecart** (clauses ISO 9001:2026)
- **Phases types** du plan de transition (6 phases)
- **Registre documentaire socle**
- **Parcours de formation types**

Regles de publication :

- Chaque publication est **horodatee et numerotee**
- Les tenants sont **notifies**
- Les dossiers en cours signalent au licencie qu'une version plus recente est disponible **sans ecraser les evaluations existantes**

#### 5.1.7 Tableau de bord reseau

Vue consolidee comprenant :

- Effectifs par segment
- Redevances courantes
- Alertes (audits, echeances)
- Indicateurs agreges remontes anonymement depuis tous les tenants

---

### 5.2 Licencie — Administrateur de tenant

#### 5.2.1 Premiere connexion et personnalisation

Apres activation de son tenant par le concessionnaire, le licencie personnalise son instance :

| Element | Description |
|---------|-------------|
| Logo | Upload du logo de sa structure |
| Nom commercial | Nom affiche dans l'interface |
| Couleur d'accent | Couleur personnalisee |
| Coordonnees | Informations de contact |
| Sous-domaine | Configuration optionnelle (ex. `cabinet.standset.com`) ou domaine propre |

Ces elements sont appliques a :
- L'interface utilisateur
- Les courriels sortants
- Les rapports PDF generes

#### 5.2.2 Gestion des utilisateurs du tenant

- Creation des comptes consultants et formateurs
- Affectation de dossiers clients specifiques a chaque utilisateur

#### 5.2.3 Creation et gestion des dossiers clients

Le licencie ouvre **un dossier par organisation cliente** accompagnee. Chaque dossier constitue un espace complet de conduite de transition comprenant les modules suivants.

#### 5.2.4 Module — Analyse d'ecart (par dossier)

Le licencie (ou son consultant affecte) conduit l'analyse d'ecart **clause par clause** de la norme ISO 9001:2026 :

- La grille d'analyse est fournie **en lecture seule** par le contenu socle publie depuis la Console
- Pour chaque clause, un **score de couverture** est evalue
- Le systeme calcule un **score global de couverture** automatiquement
- Les ecarts identifies **alimentent le plan d'action**

#### 5.2.5 Module — Plan de transition en 6 phases (par dossier)

Un plan structure en 6 phases est genere a partir des taches types du socle :

- **Taches types en lecture seule** issues du socle
- Possibilite d'ajouter des **taches personnalisees** propres au dossier
- Suivi de l'**avancement phase par phase**
- **Echeances et responsabilites** par tache

#### 5.2.6 Module — Registre documentaire (par dossier)

Le registre documentaire combine :

- Le **socle documentaire** fourni par la Console (en lecture seule)
- Les **documents propres** ajoutes par le licencie pour ce dossier
- Suivi du statut de chaque document : `A creer` | `En cours` | `Valide`

#### 5.2.7 Module — Suivi des formations (par dossier)

- **Trois parcours de formation** suivis par dossier (conformement au prototype)
- Enregistrement des sessions realisees
- Suivi des participants et de l'avancement

#### 5.2.8 Module — Rapport de synthese (par dossier)

Generation d'un **rapport PDF a la marque du licencie**, reprenant :

- Scores d'ecart
- Avancement du plan
- Etat du registre documentaire
- Bilan des formations

#### 5.2.9 Tableau de bord du tenant

- Vue consolidee de l'avancement de **tous les dossiers** du licencie
- Echeances d'audit de transition a venir

#### 5.2.10 Consultation des redevances

Le licencie consulte le tableau de ses redevances :

- Montants dus
- Encaissements
- Solde
- Echeancier

---

### 5.3 Utilisateur licencie (consultant / formateur)

#### 5.3.1 Connexion

- Connexion a l'instance de son licencie
- **Visibilite limitee** aux seuls dossiers affectes

#### 5.3.2 Travail sur un dossier affecte

Au sein de chaque dossier, l'utilisateur peut :

- Conduire ou poursuivre l'**analyse d'ecart**
- Mettre a jour l'**avancement des taches** du plan de transition
- Ajouter des **documents** au registre
- Enregistrer les **sessions de formation** realisees

#### 5.3.3 Generation de rapports

- Generation du rapport de synthese PDF du dossier
- **Branding automatique** a la marque du licencie

---

### 5.4 Entreprise abonnee (self-service)

#### 5.4.1 Inscription en ligne

Le responsable qualite d'une entreprise s'inscrit directement en ligne en renseignant les informations de son organisation.

#### 5.4.2 Paiement de l'abonnement

- Paiement par **carte bancaire** ou **mobile money**
- Facturation **automatique et recurrente**

#### 5.4.3 Acces au dossier unique

L'entreprise accede a un dossier unique comprenant les memes modules que le Kit licencie :

| Module | Description |
|--------|-------------|
| Analyse d'ecart | Clause par clause avec score de couverture |
| Plan de transition | 6 phases (taches types + personnalisees) |
| Registre documentaire | Socle + ajouts |
| Suivi des formations | 3 parcours de formation |
| Rapport de synthese | PDF sans marque blanche (marque StandSet par defaut) |

#### 5.4.4 Autonomie complete

- Travail en **totale autonomie**
- Mises a jour du contenu socle publiees par le concessionnaire recues **automatiquement avec notification**

---

## 6. Flux de donnees inter-tenants

> **Principe fondamental** : aucune donnee client nominative ne remonte au concessionnaire.

### 6.1 Flux descendant : Console → Tenants

| Element | Detail |
|---------|--------|
| Contenu socle | Grille d'ecart, phases, registre documentaire type, parcours de formation |
| Versioning | Horodate et numerote a chaque publication |
| Notification | Tous les tenants sont notifies lors d'une nouvelle version |
| Non-ecrasement | Les dossiers en cours signalent la disponibilite d'une version plus recente sans ecraser les evaluations |

### 6.2 Flux ascendant : Tenants → Console

| Donnee remontee | Usage |
|-----------------|-------|
| Nombre de dossiers actifs par tenant | Indicateur reseau |
| Nombre de sessions de formation realisees | Indicateur reseau |
| Chiffre d'affaires sessions declare | Base de calcul des redevances variables |

> **Aucune analyse d'ecart, aucun document client ne circule vers la Console.**

---

## 7. Exigences transverses

### 7.1 Authentification et securite

| Exigence | Detail |
|----------|--------|
| Authentification | Courriel + mot de passe, double facteur optionnel |
| Mot de passe oublie | Reinitialisation autonome |
| Chiffrement | HTTPS partout |
| Stockage mots de passe | Hachage securise (bcrypt ou equivalent) |
| Audit | Journal des acces administrateur |
| Cloisonnement | Strict des tenants, verifie par **tests d'etancheite** |
| Sauvegardes | Quotidiennes automatisees avec **restauration testee** |

### 7.2 Conformite reglementaire

| Reglementation | Detail |
|----------------|--------|
| Loi ivoirienne (ARTCI) | Conformite a la loi sur la protection des donnees |
| RGPD | Conformite pour les utilisateurs europeens eventuels |
| Documentation | Registre des traitements et mentions legales fournis |

### 7.3 Performance et compatibilite

| Exigence | Detail |
|----------|--------|
| Reseau | Usage fluide sur connexions mobiles ouest-africaines (pages legeres, tolerance aux coupures reseau) |
| Responsive | Navigateurs recents desktop et mobile |
| Hebergement | Cloud avec bonne latence en Afrique de l'Ouest |

### 7.4 Internationalisation

| Exigence | Detail |
|----------|--------|
| Langue initiale | Francais |
| Architecture i18n | Prete pour l'anglais (chaines externalisees) |

### 7.5 Notifications

| Type | Declencheur |
|------|-------------|
| Alerte d'audit | Echeance a 12 mois |
| Echeances redevances | Rappel automatique |
| Publication Kit | Notification de nouvelle version |

### 7.6 Exports et imports

| Fonctionnalite | Detail |
|----------------|--------|
| Rapport PDF | Fidele au prototype, brande selon le role |
| Export CSV | Export comptable des redevances |
| Import JSON | Reprise des fichiers JSON produits par les prototypes |

---

## 8. Lotissement et calendrier

### 8.1 Decoupage en lots

Chaque lot est soumis a une **recette de 15 jours ouvres** avant mise en production.

| Lot | Contenu | Echeance |
|-----|---------|----------|
| **Lot 1 — Socle** | Authentification, multi-tenant, Console (registre, redevances, versions), instance licenciee multi-dossiers avec Kit complet, theming, import JSON | **T1 2027** |
| **Lot 2 — Self-service** | Espace entreprise, inscription et paiement en ligne (carte + mobile money), facturation automatique | **T2 2027** |
| **Lot 3 — Confort** | Notifications avancees, exports comptables, tableaux de bord enrichis, interface anglaise | **T3 2027** |

### 8.2 Livrables permanents a chaque lot

- Code source complet dans un **depot Git** appartenant au maitre d'ouvrage
- Script de deploiement reproductible
- Jeu de tests
- Manuel utilisateur par role

---

## 9. Specifications techniques detaillees

### 9.1 Stack technologique recommandee

| Couche | Technologie |
|--------|-------------|
| **Frontend** | Application web SPA (React / Next.js ou equivalent) |
| **Backend** | API REST ou GraphQL (NestJS / Express ou equivalent) |
| **Base de donnees** | PostgreSQL avec schema multi-tenant (schema par tenant ou colonne discriminante) |
| **Authentification** | JWT + refresh tokens, 2FA optionnel (TOTP) |
| **Stockage fichiers** | Object storage S3-compatible (documents, logos) |
| **Generation PDF** | Moteur de rendu serveur (Puppeteer, wkhtmltopdf ou equivalent) |
| **Paiement** | Integration carte bancaire + mobile money (Lot 2) |
| **Hebergement** | Cloud provider avec POP en Afrique de l'Ouest |
| **CI/CD** | Pipeline automatise (GitHub Actions, GitLab CI ou equivalent) |

### 9.2 Architecture de la base de donnees

#### Entites principales

```
Concessionnaire (1)
  ├── GrilleRedevances
  ├── ContenuSocle (versionne)
  │     ├── GrilleAnalyseEcart
  │     ├── PhasesPlanTransition (6 phases)
  │     ├── RegistreDocumentaireSocle
  │     └── ParcoursFormationTypes
  ├── Licencies (N)
  │     ├── ParametresMarque (logo, couleur, nom)
  │     ├── Utilisateurs (N)
  │     ├── DossiersClients (N)
  │     │     ├── AnalyseEcart (clauses + scores)
  │     │     ├── PlanTransition (6 phases, taches)
  │     │     ├── RegistreDocumentaire
  │     │     ├── SuiviFormations (3 parcours)
  │     │     └── RapportSynthese
  │     └── TableauRedevances
  └── EntreprisesAbonnees (N)
        └── DossierUnique (memes modules que DossierClient)
```

### 9.3 Strategie multi-tenant

| Approche | Detail |
|----------|--------|
| Isolation des donnees | Schema PostgreSQL par tenant OU colonne `tenant_id` sur chaque table avec Row-Level Security |
| Middleware | Resolution du tenant via sous-domaine ou token JWT |
| Tests d'etancheite | Automatises en CI : un tenant ne peut jamais acceder aux donnees d'un autre |

### 9.4 API — Points d'entree principaux

| Domaine | Endpoints |
|---------|-----------|
| **Auth** | `POST /auth/login`, `POST /auth/register`, `POST /auth/forgot-password`, `POST /auth/2fa/enable` |
| **Tenants** | `POST /tenants`, `GET /tenants`, `PATCH /tenants/:id`, `PATCH /tenants/:id/suspend` |
| **Licencies** | `POST /licencies`, `GET /licencies`, `GET /licencies/:id`, `PATCH /licencies/:id/status` |
| **Redevances** | `GET /redevances`, `GET /redevances/journal`, `POST /redevances/relance` |
| **Contenu socle** | `POST /socle/versions`, `GET /socle/versions`, `GET /socle/versions/latest` |
| **Dossiers** | `POST /dossiers`, `GET /dossiers`, `GET /dossiers/:id` |
| **Analyse ecart** | `GET /dossiers/:id/analyse-ecart`, `PATCH /dossiers/:id/analyse-ecart/clauses/:clauseId` |
| **Plan transition** | `GET /dossiers/:id/plan`, `PATCH /dossiers/:id/plan/phases/:phaseId/taches/:tacheId` |
| **Registre doc** | `GET /dossiers/:id/registre`, `POST /dossiers/:id/registre/documents` |
| **Formations** | `GET /dossiers/:id/formations`, `POST /dossiers/:id/formations/sessions` |
| **Rapports** | `GET /dossiers/:id/rapport-pdf` |
| **Paiement** | `POST /abonnements`, `POST /abonnements/webhook` (Lot 2) |

---

## 10. Exigences fonctionnelles detaillees

### 10.1 Module Console — Registre des licencies

| Ref | Exigence | Priorite |
|-----|----------|----------|
| CON-01 | Creer un licencie avec raison sociale, segment, territoire, exclusivite | Lot 1 |
| CON-02 | Cycle de statut : En attente → Habilite → Suspendu | Lot 1 |
| CON-03 | Suspension immediat coupant l'acces du tenant | Lot 1 |
| CON-04 | Fiche detaillee avec indicateurs agreges remontes | Lot 1 |

### 10.2 Module Console — Redevances

| Ref | Exigence | Priorite |
|-----|----------|----------|
| RED-01 | Grille tarifaire configurable ancree sur T | Lot 1 |
| RED-02 | Calcul automatique des montants dus | Lot 1 |
| RED-03 | Journal des encaissements, soldes, echeancier | Lot 1 |
| RED-04 | Relances automatiques par courriel | Lot 1 |
| RED-05 | Export CSV comptable | Lot 3 |

### 10.3 Module Console — Habilitations

| Ref | Exigence | Priorite |
|-----|----------|----------|
| HAB-01 | Enregistrement des habilitations delivrees | Lot 1 |
| HAB-02 | Alertes a 12 mois avant expiration | Lot 1 |
| HAB-03 | Proposition de suspension sur ecart d'audit | Lot 1 |

### 10.4 Module Console — Publication du Kit

| Ref | Exigence | Priorite |
|-----|----------|----------|
| PUB-01 | Edition du contenu socle (grille ecart, phases, registre, formations) | Lot 1 |
| PUB-02 | Versioning horodate et numerote | Lot 1 |
| PUB-03 | Notification aux tenants | Lot 1 |
| PUB-04 | Signal de version plus recente sans ecrasement | Lot 1 |

### 10.5 Module Kit — Analyse d'ecart

| Ref | Exigence | Priorite |
|-----|----------|----------|
| ANA-01 | Grille clause par clause ISO 9001:2026 en lecture seule (socle) | Lot 1 |
| ANA-02 | Evaluation du score de couverture par clause | Lot 1 |
| ANA-03 | Calcul automatique du score global | Lot 1 |
| ANA-04 | Alimentation automatique du plan d'action | Lot 1 |

### 10.6 Module Kit — Plan de transition

| Ref | Exigence | Priorite |
|-----|----------|----------|
| PLN-01 | 6 phases avec taches types (lecture seule depuis socle) | Lot 1 |
| PLN-02 | Ajout de taches personnalisees | Lot 1 |
| PLN-03 | Suivi d'avancement phase par phase | Lot 1 |
| PLN-04 | Echeances et responsabilites par tache | Lot 1 |

### 10.7 Module Kit — Registre documentaire

| Ref | Exigence | Priorite |
|-----|----------|----------|
| DOC-01 | Socle documentaire en lecture seule | Lot 1 |
| DOC-02 | Ajout de documents propres au dossier | Lot 1 |
| DOC-03 | Statuts : A creer / En cours / Valide | Lot 1 |

### 10.8 Module Kit — Formations

| Ref | Exigence | Priorite |
|-----|----------|----------|
| FOR-01 | 3 parcours de formation par dossier | Lot 1 |
| FOR-02 | Enregistrement des sessions | Lot 1 |
| FOR-03 | Suivi des participants et avancement | Lot 1 |

### 10.9 Module Kit — Rapport PDF

| Ref | Exigence | Priorite |
|-----|----------|----------|
| RPT-01 | Generation PDF reprenant scores, avancement, registre, formations | Lot 1 |
| RPT-02 | Branding a la marque du licencie | Lot 1 |
| RPT-03 | Marque StandSet par defaut pour self-service | Lot 2 |

### 10.10 Module Self-service

| Ref | Exigence | Priorite |
|-----|----------|----------|
| SSV-01 | Inscription en ligne | Lot 2 |
| SSV-02 | Paiement carte bancaire | Lot 2 |
| SSV-03 | Paiement mobile money | Lot 2 |
| SSV-04 | Facturation automatique recurrente | Lot 2 |
| SSV-05 | Dossier unique avec tous les modules Kit | Lot 2 |

### 10.11 Theming et personnalisation

| Ref | Exigence | Priorite |
|-----|----------|----------|
| THM-01 | Upload logo | Lot 1 |
| THM-02 | Nom commercial personnalise | Lot 1 |
| THM-03 | Couleur d'accent | Lot 1 |
| THM-04 | Sous-domaine ou domaine propre | Lot 1 |
| THM-05 | Application aux emails et PDF | Lot 1 |

### 10.12 Import / Export

| Ref | Exigence | Priorite |
|-----|----------|----------|
| IMP-01 | Import JSON depuis les prototypes (reprise de l'existant) | Lot 1 |
| EXP-01 | Export rapport PDF | Lot 1 |
| EXP-02 | Export CSV redevances | Lot 3 |

---

## 11. Criteres d'acceptation

### 11.1 Criteres du Lot 1

| # | Critere | Methode de verification |
|---|---------|------------------------|
| 1 | Toutes les fonctions des deux prototypes sont presentes et produisent les **memes calculs** sur un jeu d'essai commun | Tests fonctionnels automatises + recette manuelle |
| 2 | Un tenant **ne peut acceder a aucune donnee** d'un autre tenant | Test d'etancheite documente |
| 3 | Un dossier exporte des prototypes **s'importe sans perte** | Test d'import JSON verifie champ par champ |
| 4 | Un rapport PDF a la marque d'un licencie de test est **produit conforme** au prototype | Comparaison visuelle + verification des donnees |
| 5 | La **restauration d'une sauvegarde** est demontree en recette | Procedure documentee et executee |

### 11.2 Criteres du Lot 2

| # | Critere |
|---|---------|
| 1 | Inscription self-service fonctionnelle de bout en bout |
| 2 | Paiement carte bancaire et mobile money operationnels |
| 3 | Facturation recurrente automatique verifiee |
| 4 | Dossier entreprise isolee des tenants licencies |

### 11.3 Criteres du Lot 3

| # | Critere |
|---|---------|
| 1 | Notifications avancees delivrees correctement |
| 2 | Exports CSV conformes aux attentes comptables |
| 3 | Tableaux de bord enrichis valides par le maitre d'ouvrage |
| 4 | Interface anglaise fonctionnelle et complete |

---

## 12. Annexes

### Annexe A — Glossaire

| Terme | Definition |
|-------|-----------|
| **Concessionnaire** | Maitre d'ouvrage unique, exploitant de la plateforme StandSet |
| **Licencie** | Entite (cabinet, organisme) exploitant une instance brandee |
| **Tenant** | Instance isolee de la plateforme attribuee a un licencie |
| **Contenu socle** | Referentiel publie par le concessionnaire (grille ecart, phases, documents, formations) |
| **Kit** | Ensemble des modules de conduite de transition ISO |
| **Console** | Interface d'administration du concessionnaire |
| **T** | Montant de reference ancrant la grille de redevances |
| **Analyse d'ecart** | Evaluation clause par clause de la conformite d'une organisation a la norme |
| **Score de couverture** | Indicateur de conformite calcule a partir de l'analyse d'ecart |

### Annexe B — Recette (protocole de validation)

Chaque lot fait l'objet d'une recette de **15 jours ouvres** comprenant :

1. **Tests fonctionnels** : verification de chaque exigence du lot
2. **Tests d'etancheite** : verification du cloisonnement multi-tenant
3. **Tests de performance** : validation de la fluidite sur connexions mobiles
4. **Tests de compatibilite** : navigateurs desktop et mobile
5. **Test de restauration** : restauration complete depuis une sauvegarde
6. **Validation metier** : parcours complet par role avec donnees reelles

### Annexe C — Livrables attendus

| Livrable | Frequence |
|----------|-----------|
| Code source complet (depot Git) | A chaque lot |
| Script de deploiement reproductible | A chaque lot |
| Jeu de tests automatises | A chaque lot |
| Manuel utilisateur par role | A chaque lot |
| Documentation technique (API, architecture) | A chaque lot |
| Rapport de tests d'etancheite | A chaque lot |
| Procedure de sauvegarde/restauration | Lot 1 |
