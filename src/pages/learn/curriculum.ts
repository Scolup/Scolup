export const LEVELS = [6, 5, 4, 3] as const
export type Level = (typeof LEVELS)[number]
export type Subject =
  | "Mathématiques"
  | "Français"
  | "Histoire-géographie"
  | "SVT"
  | "Physique-chimie"
  | "Anglais"

export interface Lesson {
  id: string
  title: string
  subject: Subject
  levels: readonly Level[]
  keywords: string
  summary: string
  points: readonly (readonly [notion: string, definition: string])[]
}

const COLLEGE = [6, 5, 4, 3] as const
const CYCLE_4 = [5, 4, 3] as const

export const LESSONS: readonly Lesson[] = [
  {
    id: "fractions",
    title: "Fractions",
    subject: "Mathématiques",
    levels: COLLEGE,
    keywords:
      "numérateur dénominateur fraction équivalente simplifier additionner",
    summary:
      "Une fraction représente un quotient. Pour comparer des fractions ou les additionner, on peut les écrire avec un même dénominateur.",
    points: [
      ["Numérateur", "Il se trouve au-dessus du trait de fraction."],
      [
        "Dénominateur",
        "Il se trouve au-dessous du trait et ne peut pas être nul.",
      ],
      [
        "Fraction équivalente",
        "On multiplie ou on divise les deux termes par un même nombre non nul.",
      ],
      [
        "Addition à même dénominateur",
        "On additionne les numérateurs et on garde le dénominateur.",
      ],
      ["Exemple", "2/7 + 3/7 = 5/7."],
    ],
  },
  {
    id: "proportionnalite",
    title: "Proportionnalité",
    subject: "Mathématiques",
    levels: COLLEGE,
    keywords:
      "produit en croix coefficient proportionnel prix unitaire tableau échelle pourcentage",
    summary:
      "Deux grandeurs sont proportionnelles quand on passe de l’une à l’autre en multipliant toujours par le même nombre.",
    points: [
      [
        "Coefficient de proportionnalité",
        "C’est le nombre fixe par lequel on multiplie.",
      ],
      [
        "Passage à l’unité",
        "On calcule d’abord la valeur correspondant à une seule unité.",
      ],
      ["Quantités doublées", "Si une grandeur double, l’autre double aussi."],
      [
        "Tableau de proportionnalité",
        "Pour une première grandeur non nulle, le quotient de la seconde par la première est constant.",
      ],
      [
        "Exemple",
        "Si 3 cahiers coûtent 6 €, un cahier coûte 2 € et 5 cahiers coûtent 10 €.",
      ],
    ],
  },
  {
    id: "natures-de-mots",
    title: "Les classes grammaticales",
    subject: "Français",
    levels: COLLEGE,
    keywords: "nature de mots déterminant nom adjectif pronom verbe grammaire",
    summary:
      "La classe grammaticale indique ce qu’est un mot. Sa fonction indique le rôle qu’il joue dans une phrase.",
    points: [
      ["Nom", "Dans « une maison », le mot « maison » désigne un lieu."],
      ["Déterminant", "Dans « mes cahiers », « mes » introduit le nom."],
      [
        "Adjectif",
        "Dans « une grande table », « grande » apporte une précision sur la table.",
      ],
      [
        "Pronom",
        "Dans « Léa arrive. Elle sourit. », « elle » reprend le nom Léa.",
      ],
      ["Verbe", "Dans « Le chien dort », « dort » est conjugué au présent."],
    ],
  },
  {
    id: "perimetre-aire",
    title: "Périmètres et aires",
    subject: "Mathématiques",
    levels: COLLEGE,
    keywords:
      "rectangle carré triangle longueur largeur surface périmètre aire géométrie",
    summary:
      "Le périmètre mesure le contour d’une figure. L’aire mesure la surface à l’intérieur de ce contour.",
    points: [
      ["Périmètre d’un rectangle", "2 × (longueur + largeur)."],
      ["Aire d’un rectangle", "Longueur × largeur."],
      ["Aire d’un carré", "Côté × côté."],
      ["Aire d’un triangle", "Base × hauteur correspondante ÷ 2."],
      ["Unité d’aire", "On peut l’exprimer en centimètres carrés (cm²)."],
    ],
  },
  {
    id: "etat-matiere",
    title: "États de la matière",
    subject: "Physique-chimie",
    levels: [6, 5, 4],
    keywords:
      "fusion solide liquide gaz vaporisation changement état solidification liquéfaction eau",
    summary:
      "Lors d’un changement d’état physique, la substance reste la même. Dans un système fermé, sa masse se conserve.",
    points: [
      ["Fusion", "Passage de l’état solide à l’état liquide."],
      ["Solidification", "Passage de l’état liquide à l’état solide."],
      ["Vaporisation", "Passage de l’état liquide à l’état gazeux."],
      ["Liquéfaction", "Passage de l’état gazeux à l’état liquide."],
      [
        "Conservation de la masse",
        "Dans un récipient fermé, la masse totale reste la même avant et après le changement d’état.",
      ],
    ],
  },
  {
    id: "present-anglais",
    title: "Le présent simple en anglais",
    subject: "Anglais",
    levels: COLLEGE,
    keywords:
      "present simple third person do does routines habits anglais conjugaison",
    summary:
      "Le présent simple sert notamment à parler d’habitudes, de goûts et de faits généraux.",
    points: [
      ["I play", "Forme affirmative avec « I » pour le verbe « play »."],
      ["She plays", "Forme affirmative du même verbe avec « she »."],
      ["He doesn’t play", "Forme négative avec « he » et « play »."],
      ["Do you play?", "Question avec « you » et « play »."],
      ["Does it work?", "Question avec « it » et « work »."],
    ],
  },
  {
    id: "metropoles",
    title: "Habiter une métropole",
    subject: "Histoire-géographie",
    levels: [6],
    keywords:
      "habiter métropole ville habitants transport quartier centre banlieue",
    summary:
      "Une métropole concentre des habitants, des activités et des fonctions de commandement. On l’habite de différentes manières selon ses lieux de vie et de déplacement.",
    points: [
      ["Métropole", "Grande ville qui exerce une influence sur un territoire."],
      [
        "Quartier d’affaires",
        "Espace qui concentre notamment des bureaux et des activités économiques.",
      ],
      [
        "Mobilité quotidienne",
        "Déplacement régulier, par exemple entre le domicile et le collège.",
      ],
      [
        "Banlieue",
        "Ensemble de communes urbanisées autour de la ville-centre.",
      ],
      [
        "Étalement urbain",
        "Extension de l’urbanisation sur les espaces qui entourent la ville.",
      ],
    ],
  },
  {
    id: "nombres-relatifs",
    title: "Nombres relatifs",
    subject: "Mathématiques",
    levels: CYCLE_4,
    keywords:
      "relatifs négatifs signe température somme soustraction opposé distance zéro",
    summary:
      "Un nombre relatif repère une position par rapport à zéro. Sur une droite graduée, il augmente quand on se déplace vers la droite.",
    points: [
      ["Nombre positif", "Un nombre strictement supérieur à zéro."],
      ["Nombre négatif", "Un nombre strictement inférieur à zéro."],
      ["Nombres opposés", "Deux nombres dont la somme est nulle."],
      [
        "Addition de deux négatifs",
        "Le résultat est négatif et les distances à zéro s’additionnent.",
      ],
      ["Soustraction", "Soustraire un nombre revient à ajouter son opposé."],
    ],
  },
  {
    id: "probabilites",
    title: "Probabilités",
    subject: "Mathématiques",
    levels: CYCLE_4,
    keywords:
      "hasard dé tirage urne issues événement contraire non A équiprobabilité fréquence",
    summary:
      "Une probabilité est comprise entre 0 et 1. Si les issues sont équiprobables, on divise le nombre d’issues favorables par le nombre total d’issues.",
    points: [
      ["Issue", "Un résultat possible de l’expérience."],
      ["Événement", "Un ensemble d’issues."],
      [
        "Événement contraire",
        "Il se réalise exactement quand l’événement initial ne se réalise pas.",
      ],
      ["Événement impossible", "Sa probabilité vaut 0."],
      ["Événement certain", "Sa probabilité vaut 1."],
    ],
  },
  {
    id: "pythagore",
    title: "Théorème de Pythagore",
    subject: "Mathématiques",
    levels: [4, 3],
    keywords:
      "triangle rectangle hypoténuse théorème Pythagore carré racine réciproque",
    summary:
      "Dans un triangle rectangle, le carré de l’hypoténuse est égal à la somme des carrés des deux autres côtés.",
    points: [
      ["Hypoténuse", "Côté opposé à l’angle droit."],
      [
        "Théorème",
        "Il permet de calculer une longueur dans un triangle dont on sait qu’il est rectangle.",
      ],
      [
        "Réciproque",
        "Si le carré du plus grand côté égale la somme des deux autres carrés, le triangle est rectangle.",
      ],
      [
        "Calcul d’un côté de l’angle droit",
        "On soustrait de l’hypoténuse au carré le carré de l’autre côté connu, puis on prend la racine carrée.",
      ],
      [
        "Exemple",
        "Pour des côtés de l’angle droit de 3 cm et 4 cm, l’hypoténuse mesure 5 cm.",
      ],
    ],
  },
  {
    id: "cosinus",
    title: "Cosinus d’un angle",
    subject: "Mathématiques",
    levels: [4],
    keywords:
      "cosinus trigonométrie CAH triangle rectangle côté adjacent hypoténuse",
    summary:
      "Dans un triangle rectangle, le cosinus d’un angle aigu est le rapport de la longueur du côté adjacent à celle de l’hypoténuse.",
    points: [
      ["Angle droit", "Il mesure 90°."],
      ["Hypoténuse", "C’est le côté opposé à l’angle droit."],
      [
        "Côté adjacent",
        "C’est le côté qui touche l’angle aigu étudié et qui n’est pas l’hypoténuse.",
      ],
      ["Cosinus", "Côté adjacent ÷ hypoténuse."],
      [
        "Exemple",
        "Si le côté adjacent mesure 4 cm et l’hypoténuse 5 cm, le cosinus vaut 0,8.",
      ],
    ],
  },
  {
    id: "trigonometrie",
    title: "Trigonométrie",
    subject: "Mathématiques",
    levels: [3],
    keywords:
      "sinus cosinus tangente SOH CAH TOA triangle rectangle côté adjacent opposé hypoténuse",
    summary:
      "Dans un triangle rectangle, le sinus, le cosinus et la tangente d’un angle aigu relient les longueurs des côtés.",
    points: [
      ["Hypoténuse", "C’est le côté en face de l’angle droit."],
      [
        "Côté opposé à l’angle",
        "C’est le côté qui ne touche pas l’angle aigu étudié.",
      ],
      ["Sinus", "Côté opposé ÷ hypoténuse."],
      ["Cosinus", "Côté adjacent ÷ hypoténuse."],
      ["Tangente", "Côté opposé ÷ côté adjacent."],
    ],
  },
  {
    id: "equations",
    title: "Équations du premier degré",
    subject: "Mathématiques",
    levels: [4, 3],
    keywords: "inconnue résoudre égalité x équation membre solution isoler",
    summary:
      "Résoudre une équation, c’est trouver toutes les valeurs de l’inconnue qui rendent l’égalité vraie.",
    points: [
      [
        "Inconnue",
        "La valeur à chercher, souvent représentée par la lettre x.",
      ],
      ["Solution", "Valeur de l’inconnue qui vérifie l’égalité."],
      [
        "Addition dans une équation",
        "On ajoute le même nombre aux deux membres.",
      ],
      [
        "Division dans une équation",
        "On divise les deux membres par un même nombre non nul.",
      ],
      [
        "Vérification",
        "On remplace l’inconnue par la valeur trouvée et on compare les deux membres.",
      ],
    ],
  },
  {
    id: "fonctions",
    title: "Fonctions et images",
    subject: "Mathématiques",
    levels: [3],
    keywords:
      "fonction affine linéaire image antécédent f(x) graphique tableau droite",
    summary:
      "Une fonction associe une seule image à chaque nombre de son ensemble de définition. Un nombre peut avoir plusieurs antécédents.",
    points: [
      ["Image de x", "Le nombre obtenu en appliquant la fonction à x."],
      ["Antécédent de y", "Un nombre dont l’image par la fonction est y."],
      ["Fonction linéaire", "Fonction de la forme x ↦ ax."],
      ["Fonction affine", "Fonction de la forme x ↦ ax + b."],
      [
        "Lecture d’un graphique",
        "Pour lire l’image d’un nombre, on part de son abscisse et on relève l’ordonnée du point de la courbe.",
      ],
    ],
  },
  {
    id: "subordonnees",
    title: "Les propositions subordonnées",
    subject: "Français",
    levels: [4, 3],
    keywords:
      "phrase complexe subordination relative complétive circonstancielle pronom relatif conjonction",
    summary:
      "Une proposition subordonnée dépend d’un élément de la phrase. Elle peut notamment préciser un nom, compléter un verbe ou exprimer une circonstance.",
    points: [
      [
        "Proposition relative",
        "Dans « Le livre que je lis est long », « que je lis » précise le nom « livre ».",
      ],
      [
        "Proposition complétive",
        "Dans « Je pense qu’il viendra », « qu’il viendra » complète le verbe « pense ».",
      ],
      [
        "Subordonnée de temps",
        "Dans « Je pars quand tu arrives », « quand tu arrives » précise à quel moment je pars.",
      ],
      [
        "Subordonnée de cause",
        "Dans « Il rentre parce qu’il pleut », « parce qu’il pleut » explique pourquoi il rentre.",
      ],
      [
        "Interrogative indirecte",
        "Dans « Je me demande où tu vas », « où tu vas » rapporte une question sans point d’interrogation.",
      ],
    ],
  },
  {
    id: "premiere-guerre-mondiale",
    title: "Première Guerre mondiale",
    subject: "Histoire-géographie",
    levels: [3],
    keywords:
      "1914 1918 armistice poilus tranchées Verdun guerre totale violence de masse",
    summary:
      "La Première Guerre mondiale se déroule de 1914 à 1918. Elle mobilise les combattants, les populations civiles et les économies.",
    points: [
      ["1914", "Année du début de la Première Guerre mondiale."],
      ["Verdun", "Bataille de 1916 sur le front occidental."],
      ["Tranchée", "Fossé aménagé pour abriter et protéger les soldats."],
      [
        "Guerre totale",
        "Conflit qui mobilise aussi les civils et les ressources économiques.",
      ],
      [
        "11 novembre 1918",
        "Date de l’armistice qui met fin aux combats sur le front occidental.",
      ],
    ],
  },
  {
    id: "seismes",
    title: "Séismes et plaques tectoniques",
    subject: "SVT",
    levels: CYCLE_4,
    keywords:
      "tectonique plaques lithosphère tremblement terre épicentre foyer ondes sismiques risque",
    summary:
      "Un séisme résulte d’une rupture brutale des roches en profondeur. Cette rupture libère de l’énergie qui se propage sous forme d’ondes.",
    points: [
      ["Foyer", "Zone en profondeur où commence la rupture."],
      ["Épicentre", "Point de la surface situé à la verticale du foyer."],
      [
        "Ondes sismiques",
        "Vibrations qui se propagent depuis la zone de rupture.",
      ],
      ["Sismomètre", "Appareil qui mesure les mouvements du sol."],
      [
        "Limite de plaques",
        "Zone où se produit une grande partie des séismes dans le monde.",
      ],
    ],
  },
]

export function levelFromClass(name: string): Level | undefined {
  const text = name
    .normalize("NFKD")
    .replace(/\p{Diacritic}/gu, "")
    .trim()
    .toLowerCase()
    .replace(/^classe de\s+/u, "")
  const number = /^([3-6])(?=$|[a-z\s.\-_/0-9])/u.exec(text)?.[1]
  const names = ["troisieme", "quatrieme", "cinquieme", "sixieme"]
  const level = number
    ? Number(number)
    : names.findIndex((label) => text.startsWith(label)) + 3
  return LEVELS.find((candidate) => candidate === level)
}

function schoolYearStart(date: Date): number {
  return date.getFullYear() - (date.getMonth() < 8 ? 1 : 0)
}

export function programmeSource(level: Level, subject: Subject, date: Date) {
  const year = schoolYearStart(date)
  if (level === 6) {
    return {
      label: "Éduscol · Cycle 3",
      url: "https://eduscol.education.gouv.fr/4356/enseigner-au-cycle-3",
    }
  }
  if (subject === "Mathématiques" || subject === "Français") {
    if (year >= 2031 - level) {
      return {
        label: "Bulletin officiel du 5 mars 2026",
        url: "https://www.education.gouv.fr/bo/2026/Hebdo10/MENE2602912A",
      }
    }
    return {
      label: "Éduscol · Repères de progression",
      url: "https://eduscol.education.gouv.fr/6910/reperes-annuels-de-progression-et-attendus-de-fin-d-annee-du-cp-la-troisieme",
    }
  }
  return {
    label: "Éduscol · Cycle 4",
    url: "https://eduscol.education.gouv.fr/4362/enseigner-au-cycle-4",
  }
}
