import type { Clause, DocumentTemplate, KitVersion, PhaseTemplate, SocleContent, TaskTemplate, TrainingPath } from '@/types/domain'

type ClauseRow = [code: string, titre: string, poids: 1 | 2 | 3, nouveaute: boolean, exigence: string, preuves: string[]]

const CLAUSE_ROWS: ClauseRow[] = [
  ['4.1', "Compréhension de l'organisme et de son contexte", 2, true, "Déterminer les enjeux externes et internes pertinents, y compris l'effet du changement climatique sur la capacité à atteindre les résultats attendus.", ['Analyse de contexte (PESTEL, SWOT)', 'Prise en compte explicite du climat', 'Revue périodique datée']],
  ['4.2', 'Besoins et attentes des parties intéressées', 2, true, 'Identifier les parties intéressées pertinentes, leurs exigences, et déterminer celles qui peuvent porter sur le changement climatique.', ['Cartographie des parties intéressées', 'Exigences pertinentes retenues', 'Mise à jour documentée']],
  ['4.3', "Domaine d'application du SMQ", 1, false, "Déterminer les limites et l'applicabilité du système de management de la qualité et le tenir à disposition.", ["Périmètre documenté", 'Justification des exclusions']],
  ['4.4', 'Système de management de la qualité et ses processus', 3, false, 'Établir, mettre en œuvre, tenir à jour et améliorer le SMQ, y compris les processus nécessaires et leurs interactions.', ['Cartographie des processus', 'Fiches processus avec indicateurs', 'Pilotes désignés']],
  ['5.1', 'Leadership et engagement', 3, true, "La direction démontre son leadership, promeut une culture qualité et un comportement éthique au sein de l'organisme.", ['Engagements formalisés', 'Actions de promotion de la culture qualité', 'Charte éthique']],
  ['5.2', 'Politique qualité', 2, false, "Établir, communiquer et tenir à jour une politique qualité appropriée à la finalité et au contexte de l'organisme.", ['Politique signée', 'Preuves de communication']],
  ['5.3', 'Rôles, responsabilités et autorités', 2, false, 'Attribuer, communiquer et faire comprendre les responsabilités et autorités des rôles pertinents.', ['Organigramme', 'Fiches de fonction']],
  ['6.1', 'Actions face aux risques et opportunités', 3, true, 'Planifier des actions pour traiter les risques et, de manière distincte, saisir les opportunités.', ['Registre des risques', 'Registre des opportunités', 'Plans de traitement suivis']],
  ['6.2', 'Objectifs qualité et planification', 2, false, 'Établir des objectifs qualité mesurables aux fonctions et niveaux pertinents et planifier leur atteinte.', ['Tableau des objectifs', 'Plans d’actions associés']],
  ['6.3', 'Planification des modifications', 1, false, 'Réaliser les modifications du SMQ de manière planifiée en considérant leur finalité et leurs conséquences.', ['Procédure de gestion des changements', 'Enregistrements de modifications']],
  ['7.1.1', 'Ressources — généralités', 1, false, "Déterminer et fournir les ressources nécessaires au SMQ en tenant compte des capacités et contraintes internes.", ['Budget qualité', 'Revue des ressources']],
  ['7.1.2', 'Ressources humaines', 1, false, 'Déterminer et fournir les personnes nécessaires à la mise en œuvre efficace du SMQ.', ['Plan de charge', 'Effectifs par processus']],
  ['7.1.3', 'Infrastructure', 1, false, "Déterminer, fournir et maintenir l'infrastructure nécessaire à la mise en œuvre des processus.", ['Plan de maintenance', 'Inventaire des équipements']],
  ['7.1.4', 'Environnement de mise en œuvre des processus', 1, false, "Déterminer, fournir et maintenir l'environnement nécessaire, y compris les facteurs humains et physiques.", ['Évaluation des conditions de travail']],
  ['7.1.5', 'Ressources pour la surveillance et la mesure', 2, false, 'Garantir des résultats valides et fiables lorsque la surveillance ou la mesure sert à démontrer la conformité.', ["Plan d'étalonnage", 'Certificats de vérification']],
  ['7.1.6', 'Connaissances organisationnelles', 2, false, 'Déterminer les connaissances nécessaires, les tenir à jour et les rendre disponibles.', ['Base de connaissances', 'Retours d’expérience']],
  ['7.2', 'Compétences', 2, false, 'Déterminer les compétences nécessaires et s’assurer que les personnes sont compétentes.', ['Matrice des compétences', 'Plan de formation', 'Évaluations']],
  ['7.3', 'Sensibilisation', 2, true, 'Les personnes sont sensibilisées à la politique qualité, à leur contribution, à la culture qualité et au comportement éthique.', ['Supports de sensibilisation', 'Feuilles de présence']],
  ['7.4', 'Communication', 1, false, 'Déterminer les besoins de communication interne et externe pertinents pour le SMQ.', ['Plan de communication']],
  ['7.5', 'Informations documentées', 3, false, 'Créer, mettre à jour et maîtriser les informations documentées exigées par la norme et jugées nécessaires.', ['Procédure de maîtrise documentaire', 'Liste des documents en vigueur']],
  ['8.1', 'Planification et maîtrise opérationnelles', 2, false, 'Planifier, mettre en œuvre et maîtriser les processus nécessaires à la fourniture des produits et services.', ['Plans qualité', 'Critères d’acceptation']],
  ['8.2', 'Exigences relatives aux produits et services', 2, false, 'Communiquer avec les clients, déterminer et revoir les exigences relatives aux produits et services.', ['Revues de contrat', 'Enregistrements de communication client']],
  ['8.3', 'Conception et développement', 2, false, 'Établir un processus de conception et développement approprié pour assurer la fourniture ultérieure.', ['Dossiers de conception', 'Revues, vérifications, validations']],
  ['8.4', 'Maîtrise des prestataires externes', 3, false, 'Assurer la conformité des processus, produits et services fournis par des prestataires externes.', ['Critères de sélection', 'Évaluations fournisseurs', 'Liste des prestataires approuvés']],
  ['8.5', 'Production et prestation de service', 3, false, 'Mettre en œuvre la production et la prestation de service dans des conditions maîtrisées.', ['Instructions de travail', 'Traçabilité', 'Préservation']],
  ['8.6', 'Libération des produits et services', 2, false, 'Mettre en œuvre les dispositions planifiées pour vérifier que les exigences sont satisfaites avant libération.', ['Enregistrements de libération', 'Autorisation de libération']],
  ['8.7', 'Maîtrise des éléments de sortie non conformes', 2, false, 'Identifier et maîtriser les éléments de sortie non conformes pour empêcher leur utilisation non intentionnelle.', ['Registre des non-conformités', 'Décisions de traitement']],
  ['9.1.1', 'Surveillance et mesure — généralités', 2, false, 'Déterminer ce qui doit être surveillé et mesuré, les méthodes, et quand analyser les résultats.', ['Tableau de bord qualité', 'Fréquences de mesure']],
  ['9.1.2', 'Satisfaction du client', 2, false, 'Surveiller la perception des clients sur le niveau de satisfaction de leurs besoins et attentes.', ['Enquêtes de satisfaction', 'Analyse des réclamations']],
  ['9.1.3', 'Analyse et évaluation', 1, false, 'Analyser et évaluer les données et informations appropriées issues de la surveillance et de la mesure.', ['Rapports d’analyse']],
  ['9.2', 'Audit interne', 3, false, 'Réaliser des audits internes à intervalles planifiés pour vérifier la conformité et l’efficacité du SMQ.', ["Programme d'audit", "Rapports d'audit", 'Qualification des auditeurs']],
  ['9.3', 'Revue de direction', 3, false, 'Procéder à la revue du SMQ à intervalles planifiés pour s’assurer qu’il demeure approprié et efficace.', ['Comptes rendus de revue', 'Décisions et actions']],
  ['10.1', 'Amélioration — généralités', 1, false, "Déterminer et sélectionner les opportunités d'amélioration et entreprendre les actions nécessaires.", ['Pistes d’amélioration recensées']],
  ['10.2', 'Non-conformité et action corrective', 3, false, 'Réagir aux non-conformités, en analyser les causes et mettre en œuvre les actions correctives.', ['Fiches NC / AC', 'Analyses de causes', 'Vérification d’efficacité']],
  ['10.3', 'Amélioration continue', 2, false, "Améliorer en continu la pertinence, l'adéquation et l'efficacité du SMQ.", ['Plan d’amélioration', 'Résultats mesurés']],
]

export const CLAUSES: Clause[] = CLAUSE_ROWS.map(([code, titre, poids, nouveaute2026, exigence, guide]) => ({
  id: `cl_${code.replace(/\./g, '_')}`,
  code,
  chapitre: Number(code.split('.')[0]),
  titre,
  exigence,
  guide,
  poids,
  nouveaute2026,
}))

export const PHASES: PhaseTemplate[] = [
  { ordre: 1, titre: 'Cadrage & diagnostic', description: 'Définir le périmètre, mobiliser la direction et poser le diagnostic initial.' },
  { ordre: 2, titre: "Analyse d'écart", description: 'Évaluer chaque clause de la norme 2026 et identifier les écarts.' },
  { ordre: 3, titre: 'Planification des actions', description: 'Prioriser les écarts, bâtir le plan d’actions et affecter les responsables.' },
  { ordre: 4, titre: 'Mise en œuvre & documentation', description: 'Déployer les actions et mettre à jour les informations documentées.' },
  { ordre: 5, titre: 'Formation & sensibilisation', description: 'Former les équipes et ancrer la culture qualité.' },
  { ordre: 6, titre: 'Audit interne & certification', description: "Vérifier l'efficacité du système et préparer l'audit de transition." },
]

type TaskRow = [phase: number, titre: string, description: string, duree: number]

const TASK_ROWS: TaskRow[] = [
  [1, 'Réunion de lancement avec la direction', 'Présenter la démarche, le calendrier et les rôles.', 1],
  [1, 'Nommer le pilote de la transition', 'Désigner le responsable du projet et son suppléant.', 1],
  [1, 'Confirmer le périmètre de certification', 'Valider sites, activités et exclusions éventuelles.', 3],
  [1, 'Collecter la documentation existante', 'Rassembler manuel, procédures et enregistrements 2015.', 5],
  [1, 'Planifier le calendrier de transition', "Fixer les jalons jusqu'à l'audit de certification.", 2],
  [2, 'Évaluer les chapitres 4 et 5', 'Contexte, parties intéressées, leadership.', 5],
  [2, 'Évaluer les chapitres 6 et 7', 'Risques, opportunités, ressources, compétences.', 5],
  [2, 'Évaluer les chapitres 8 à 10', 'Opérations, performance, amélioration.', 7],
  [2, 'Restituer les résultats à la direction', "Présenter la couverture et les écarts majeurs.", 1],
  [3, 'Prioriser les écarts', 'Classer par criticité et effort.', 2],
  [3, "Rédiger le plan d'actions", 'Une action par écart, avec responsable et échéance.', 4],
  [3, 'Valider les ressources nécessaires', 'Budget, temps, appui externe.', 2],
  [3, 'Mettre à jour les objectifs qualité', 'Aligner les objectifs sur la norme 2026.', 3],
  [4, 'Actualiser l’analyse de contexte (climat)', 'Intégrer l’exigence relative au changement climatique.', 5],
  [4, 'Formaliser le registre des opportunités', 'Distinguer opportunités et risques.', 4],
  [4, 'Réviser la politique qualité', 'Intégrer culture qualité et éthique.', 3],
  [4, 'Mettre à jour la cartographie des processus', 'Interactions, pilotes, indicateurs.', 6],
  [4, 'Réviser les procédures impactées', 'Maîtrise documentaire, NC/AC, audit.', 10],
  [4, 'Déployer les nouveaux enregistrements', 'Formulaires et registres opérationnels.', 5],
  [5, 'Sensibiliser la direction et l’encadrement', 'Parcours 1 — enjeux de la version 2026.', 1],
  [5, 'Former les pilotes de processus', 'Parcours 2 — référents qualité.', 3],
  [5, 'Qualifier les auditeurs internes', 'Parcours 3 — audit selon ISO 9001:2026.', 3],
  [5, 'Communiquer auprès de tout le personnel', 'Affichage, réunions, supports.', 2],
  [6, "Réaliser l'audit interne complet", 'Couvrir tous les processus et exigences 2026.', 5],
  [6, 'Traiter les constats d’audit', 'Actions correctives et vérification.', 7],
  [6, 'Tenir la revue de direction', 'Décisions et ressources avant audit.', 1],
  [6, "Planifier l'audit de transition", "Coordonner avec l'organisme certificateur.", 2],
  [6, 'Audit de certification', 'Audit de transition par l’organisme certificateur.', 2],
]

export const TASK_TEMPLATES_V3: TaskTemplate[] = TASK_ROWS.map(([phase, titre, description, dureeJours], i) => ({
  id: `tt_${i + 1}`,
  phase,
  titre,
  description,
  dureeJours,
}))

type DocRow = [code: string, titre: string, type: DocumentTemplate['type'], clause: string, obligatoire: boolean]

const DOC_ROWS: DocRow[] = [
  ['DOC-01', 'Analyse du contexte et des enjeux', 'ENREGISTREMENT', '4.1', true],
  ['DOC-02', 'Cartographie des parties intéressées', 'ENREGISTREMENT', '4.2', true],
  ['DOC-03', 'Domaine d’application du SMQ', 'POLITIQUE', '4.3', true],
  ['DOC-04', 'Cartographie des processus', 'PROCESSUS', '4.4', true],
  ['DOC-05', 'Charte éthique et culture qualité', 'POLITIQUE', '5.1', false],
  ['DOC-06', 'Politique qualité', 'POLITIQUE', '5.2', true],
  ['DOC-07', 'Organigramme et fiches de fonction', 'ENREGISTREMENT', '5.3', false],
  ['DOC-08', 'Registre des risques', 'ENREGISTREMENT', '6.1', true],
  ['DOC-09', 'Registre des opportunités', 'ENREGISTREMENT', '6.1', true],
  ['DOC-10', 'Tableau des objectifs qualité', 'PLAN', '6.2', true],
  ['DOC-11', 'Procédure de gestion des modifications', 'PROCEDURE', '6.3', false],
  ["DOC-12", 'Plan d’étalonnage', 'PLAN', '7.1.5', false],
  ['DOC-13', 'Matrice des compétences', 'ENREGISTREMENT', '7.2', true],
  ['DOC-14', 'Plan de communication', 'PLAN', '7.4', false],
  ['DOC-15', 'Procédure de maîtrise des informations documentées', 'PROCEDURE', '7.5', true],
  ['DOC-16', 'Revue de contrat client', 'FORMULAIRE', '8.2', false],
  ['DOC-17', 'Évaluation des prestataires externes', 'FORMULAIRE', '8.4', true],
  ['DOC-18', 'Fiche de non-conformité', 'FORMULAIRE', '8.7', true],
  ['DOC-19', 'Enquête de satisfaction client', 'FORMULAIRE', '9.1.2', false],
  ['DOC-20', "Programme d'audit interne", 'PLAN', '9.2', true],
  ['DOC-21', "Rapport d'audit interne", 'ENREGISTREMENT', '9.2', true],
  ['DOC-22', 'Compte rendu de revue de direction', 'ENREGISTREMENT', '9.3', true],
  ['DOC-23', 'Procédure actions correctives', 'PROCEDURE', '10.2', true],
  ['DOC-24', "Plan d'amélioration continue", 'PLAN', '10.3', false],
]

export const DOCUMENT_TEMPLATES: DocumentTemplate[] = DOC_ROWS.map(([code, titre, type, clauseCode, obligatoire]) => ({
  id: `dt_${code}`,
  code,
  titre,
  type,
  clauseCode,
  obligatoire,
}))

export const TRAINING_PATHS: TrainingPath[] = [
  {
    id: 'tp_1',
    nom: 'Sensibilisation direction & encadrement',
    publicCible: 'Comité de direction, managers',
    modules: [
      { id: 'tp_1_m1', titre: 'Enjeux de la version 2026', dureeHeures: 2 },
      { id: 'tp_1_m2', titre: 'Leadership, culture qualité et éthique', dureeHeures: 2 },
      { id: 'tp_1_m3', titre: 'Risques, opportunités et climat', dureeHeures: 3 },
    ],
  },
  {
    id: 'tp_2',
    nom: 'Pilotes de processus & référents qualité',
    publicCible: 'Pilotes de processus, référents qualité',
    modules: [
      { id: 'tp_2_m1', titre: 'Approche processus et indicateurs', dureeHeures: 4 },
      { id: 'tp_2_m2', titre: 'Informations documentées', dureeHeures: 3 },
      { id: 'tp_2_m3', titre: 'Non-conformités et actions correctives', dureeHeures: 3 },
      { id: 'tp_2_m4', titre: 'Pilotage de la performance', dureeHeures: 3 },
    ],
  },
  {
    id: 'tp_3',
    nom: 'Auditeurs internes ISO 9001:2026',
    publicCible: 'Futurs auditeurs internes',
    modules: [
      { id: 'tp_3_m1', titre: 'Principes d’audit (ISO 19011)', dureeHeures: 4 },
      { id: 'tp_3_m2', titre: 'Exigences ISO 9001:2026 clause par clause', dureeHeures: 7 },
      { id: 'tp_3_m3', titre: 'Conduite d’entretien et preuves', dureeHeures: 4 },
      { id: 'tp_3_m4', titre: "Rédaction du rapport d'audit", dureeHeures: 3 },
    ],
  },
]

function content(opts: { withClause63: boolean; extraTasks: boolean }): SocleContent {
  const clauses = CLAUSES.filter((c) => opts.withClause63 || c.code !== '6.3')
  const extraIds = new Set(['tt_14', 'tt_15'])
  const tasks = TASK_TEMPLATES_V3.filter((t) => opts.extraTasks || !extraIds.has(t.id))
  return {
    clauses,
    phases: PHASES,
    tasks,
    documents: DOCUMENT_TEMPLATES.filter((d) => opts.withClause63 || d.clauseCode !== '6.3'),
    trainings: TRAINING_PATHS,
  }
}

export function buildKitVersions(): KitVersion[] {
  return [
    {
      id: 'kv_2026_1',
      number: '2026.1',
      status: 'ARCHIVEE',
      createdAt: '2026-01-12T09:00:00Z',
      publishedAt: '2026-01-20T10:30:00Z',
      publishedBy: 'Koffi Mensah',
      changelog: 'Version initiale du socle, alignée sur le projet de norme (DIS).',
      content: content({ withClause63: false, extraTasks: false }),
    },
    {
      id: 'kv_2026_2',
      number: '2026.2',
      status: 'PUBLIEE',
      createdAt: '2026-04-02T09:00:00Z',
      publishedAt: '2026-04-15T08:45:00Z',
      publishedBy: 'Koffi Mensah',
      changelog: 'Ajout des critères d’évaluation par niveau ; parcours auditeurs internes enrichi.',
      content: content({ withClause63: false, extraTasks: false }),
    },
    {
      id: 'kv_2026_3',
      number: '2026.3',
      status: 'PUBLIEE',
      createdAt: '2026-08-28T09:00:00Z',
      publishedAt: '2026-09-08T11:15:00Z',
      publishedBy: 'Koffi Mensah',
      changelog:
        'Alignement sur la version FDIS : ajout de la clause 6.3 (planification des modifications), deux tâches types en phase 4 (climat, registre des opportunités), document DOC-11.',
      content: content({ withClause63: true, extraTasks: true }),
    },
  ]
}

export const LATEST_KIT_VERSION_ID = 'kv_2026_3'
