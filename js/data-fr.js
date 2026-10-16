// French content. Overwrites the display text in data.js when French is active.
// Internal keys (element, glyph, lucky.number) stay as they are.

if (FR) {
  const S = [
    { name: "Bélier", dates: "21 mars – 19 avr.", modality: "Cardinal", ruler: "Mars", symbol: "Le Bélier",
      summary: "Le Bélier est l'étincelle qui lance le zodiaque : audacieux, direct et allergique à l'attente. Vous montrez l'exemple par l'action, vous rebondissez vite après un échec et vous vous sentez pleinement vivant face à un défi.",
      strengths: ["Courageux", "Énergique", "Honnête", "Pionnier"], challenges: ["Impatient", "Impulsif", "Colérique"],
      love: "Vous tombez amoureux vite et aimez ouvertement. Il vous faut un partenaire qui suit votre rythme, aime un peu de compétition amicale et ne joue jamais : pour vous, la franchise est romantique.",
      career: "Vous excellez là où vous pouvez diriger, lancer et vous mesurer aux autres : entrepreneuriat, vente, services d'urgence, sport, et tout ce qui a de l'élan et une victoire claire.",
      compatible: ["Lion", "Sagittaire", "Gémeaux", "Verseau"],
      lucky: { color: "Rouge", day: "Mardi", stone: "Diamant" },
      style: "avec audace et franchise, avec un besoin d'action", domain: "le courage, l'indépendance et l'initiative",
      moon: "Vos émotions s'enflamment vite et retombent aussi vite. Vous gérez vos sentiments en agissant, vous avez besoin d'indépendance pour vous sentir en sécurité et vous gardez rarement rancune." },
    { name: "Taureau", dates: "20 avr. – 20 mai", modality: "Fixe", ruler: "Vénus", symbol: "Le Taureau",
      summary: "Le Taureau bâtit des choses durables. Ancré, sensuel et constant, vous faites confiance à ce que vous pouvez toucher et vous ne vous pressez pas : une fois engagé, vous êtes inébranlable.",
      strengths: ["Fiable", "Patient", "Dévoué", "Pratique"], challenges: ["Têtu", "Possessif", "Résistant au changement"],
      love: "La loyauté et l'affection physique sont vos langages amoureux. Vous séduisez lentement, appréciez les rituels romantiques (bonne cuisine, confort, beauté) et voulez un partenaire qui reste.",
      career: "Finance, design, gastronomie, immobilier, musique, et partout où la patience se transforme en vraie valeur.",
      compatible: ["Vierge", "Capricorne", "Cancer", "Poissons"],
      lucky: { color: "Vert", day: "Vendredi", stone: "Émeraude" },
      style: "avec constance et sensualité, en valorisant le confort et la loyauté", domain: "la stabilité, les ressources et la patience",
      moon: "Vous trouvez la sécurité émotionnelle dans la routine, le confort et le concret : un bon repas, une couverture douce, un visage familier. Vous restez calme sous pression mais avez besoin de temps pour vous adapter au changement." },
    { name: "Gémeaux", dates: "21 mai – 20 juin", modality: "Mutable", ruler: "Mercure", symbol: "Les Jumeaux",
      summary: "Les Gémeaux fonctionnent à la curiosité. Vif, spirituel et toujours intéressé, vous reliez les gens et les idées, et vous avez besoin de variété comme d'autres ont besoin de sommeil.",
      strengths: ["Adaptable", "Malin", "Sociable", "Expressif"], challenges: ["Agité", "Inconstant", "Vite lassé"],
      love: "Pour vous, la conversation est un prélude. Il vous faut un partenaire qui vous stimule l'esprit, vous laisse de l'espace et rit de vos blagues.",
      career: "Écriture, médias, enseignement, marketing, technologie et vente : des métiers qui récompensent la communication et la gestion de plusieurs fils à la fois.",
      compatible: ["Balance", "Verseau", "Bélier", "Lion"],
      lucky: { color: "Jaune", day: "Mercredi", stone: "Agate" },
      style: "avec curiosité et légèreté, par les mots et les idées", domain: "l'apprentissage, la communication et les liens",
      moon: "Vous comprenez vos émotions en en parlant. Votre humeur change vite, vous avez besoin de stimulation intellectuelle et vous vous sentez en sécurité quand vous pouvez nommer ce que vous ressentez." },
    { name: "Cancer", dates: "21 juin – 22 juil.", modality: "Cardinal", ruler: "Lune", symbol: "Le Crabe",
      summary: "Le Cancer avance avec le cœur. Protecteur, intuitif et profondément loyal, vous créez une ambiance de foyer partout où vous allez, et vous n'oubliez rien.",
      strengths: ["Bienveillant", "Intuitif", "Loyal", "Tenace"], challenges: ["Lunatique", "Trop sensible", "Sur la défensive"],
      love: "Vous aimez profondément et cherchez la sécurité affective. Les petites attentions comptent plus que les grands gestes : vous voulez quelqu'un qui devienne votre famille.",
      career: "Soins, hôtellerie, éducation, immobilier, accompagnement, et toute entreprise que vous pouvez faire grandir comme un foyer.",
      compatible: ["Scorpion", "Poissons", "Taureau", "Vierge"],
      lucky: { color: "Argent", day: "Lundi", stone: "Perle" },
      style: "avec tendresse et protection, guidé par le ressenti", domain: "la famille, la sécurité affective et l'appartenance",
      moon: "La Lune est chez elle ici : vos émotions sont profondes et votre intuition forte. Vous prenez soin des autres instinctivement et avez besoin d'un nid sûr quand le monde devient bruyant." },
    { name: "Lion", dates: "23 juil. – 22 août", modality: "Fixe", ruler: "Soleil", symbol: "Le Lion",
      summary: "Le Lion rayonne. Chaleureux, généreux et créatif, vous êtes fait pour être vu, et quand vous brillez, vous laissez de la place aux autres pour briller aussi.",
      strengths: ["Confiant", "Généreux", "Créatif", "Loyal"], challenges: ["Orgueilleux", "Théâtral", "Besoin d'être validé"],
      love: "Vous aimez comme un roi : en grand, avec loyauté et espièglerie. Vous voulez être admiré et adoré, et vous le rendez au centuple.",
      career: "Scène, direction, divertissement, design et enseignement : partout où votre présence illumine la pièce.",
      compatible: ["Bélier", "Sagittaire", "Gémeaux", "Balance"],
      lucky: { color: "Or", day: "Dimanche", stone: "Rubis" },
      style: "avec chaleur et expressivité, avec du cœur et du panache", domain: "la créativité, l'expression de soi et le leadership",
      moon: "Vous avez besoin de vous sentir apprécié et vu. Vos émotions sont grandes, chaleureuses et généreuses, et vous retrouvez le moral en créant, en jouant et en vous entourant de gens qui vous célèbrent." },
    { name: "Vierge", dates: "23 août – 22 sept.", modality: "Mutable", ruler: "Mercure", symbol: "La Vierge",
      summary: "La Vierge perfectionne. Observateur, analytique et discrètement dévoué, vous remarquez ce que les autres ratent et laissez les choses en meilleur état que vous ne les avez trouvées.",
      strengths: ["Minutieux", "Serviable", "Analytique", "Travailleur"], challenges: ["Trop critique", "Anxieux", "Perfectionniste"],
      love: "Vous montrez votre amour par des actes : vous vous souvenez, réparez, aidez. Il vous faut un partenaire qui remarque vos efforts et vous sort doucement de votre tête.",
      career: "Santé, recherche, édition, analyse de données, opérations et artisanat : des métiers où la précision fait la différence.",
      compatible: ["Taureau", "Capricorne", "Cancer", "Scorpion"],
      lucky: { color: "Bleu marine", day: "Mercredi", stone: "Saphir" },
      style: "avec soin et réflexion, avec le sens du détail", domain: "le service, le savoir-faire et la discipline quotidienne",
      moon: "Vous êtes serein quand la vie est en ordre. Vous apaisez votre anxiété en étant utile, en faisant des listes et en résolvant des problèmes : vos émotions n'ont pas besoin d'être réparées pour être légitimes." },
    { name: "Balance", dates: "23 sept. – 22 oct.", modality: "Cardinal", ruler: "Vénus", symbol: "La Balance",
      summary: "La Balance cherche l'équilibre et la beauté. Charmant, juste et diplomate, vous êtes le pont entre les gens et celui qui rend chaque pièce plus harmonieuse.",
      strengths: ["Diplomate", "Gracieux", "Juste", "Sociable"], challenges: ["Indécis", "Veut plaire à tous", "Évite les conflits"],
      love: "Le couple est central pour vous. Vous séduisez avec élégance et cherchez un égal : quelqu'un qui partage votre goût du beau, de la conversation et de la justice.",
      career: "Droit, design, médiation, mode, ressources humaines et diplomatie : des rôles qui demandent du goût et du tact.",
      compatible: ["Gémeaux", "Verseau", "Lion", "Sagittaire"],
      lucky: { color: "Rose", day: "Vendredi", stone: "Opale" },
      style: "avec grâce et esprit de coopération, en recherchant l'harmonie", domain: "les relations, la justice et l'équilibre",
      moon: "Vous vous sentez au mieux quand vos relations sont apaisées et votre environnement est beau. Les disputes vous troublent profondément : apprendre à vivre des conflits sains fait partie de votre croissance." },
    { name: "Scorpion", dates: "23 oct. – 21 nov.", modality: "Fixe", ruler: "Mars et Pluton", symbol: "Le Scorpion",
      summary: "Le Scorpion va en profondeur. Intense, perspicace et farouchement loyal, vous êtes attiré par ce qui est caché et avez une capacité inégalée à vous transformer et à renaître.",
      strengths: ["Passionné", "Débrouillard", "Courageux", "Perspicace"], challenges: ["Jaloux", "Secret", "Rancunier"],
      love: "Tout ou rien. Vous voulez une intimité d'âme, une confiance totale et de la loyauté, et vous rendez la même intensité.",
      career: "Psychologie, recherche, enquête, finance et médecine : partout où la profondeur et la stratégie l'emportent.",
      compatible: ["Cancer", "Poissons", "Vierge", "Capricorne"],
      lucky: { color: "Bordeaux", day: "Mardi", stone: "Topaze" },
      style: "avec intensité et stratégie, tout ou rien", domain: "la confiance, l'intimité et la transformation",
      moon: "Vos sentiments sont puissants et intimes. Vous percevez des courants que d'autres ne voient pas, il vous faut une confiance absolue avant de vous ouvrir, et vous guérissez par des expériences honnêtes et transformatrices." },
    { name: "Sagittaire", dates: "22 nov. – 21 déc.", modality: "Mutable", ruler: "Jupiter", symbol: "L'Archer",
      summary: "Le Sagittaire court après l'horizon. Optimiste, philosophe et aventurier, vous avez besoin de liberté, de sens et d'une histoire qui vaut la peine d'être racontée.",
      strengths: ["Optimiste", "Honnête", "Aventurier", "Généreux"], challenges: ["Agité", "Manque de tact", "Promet trop"],
      love: "Vous voulez un partenaire d'aventure : quelqu'un qui voyage, débat et grandit avec vous sans vous enfermer.",
      career: "Voyage, éducation, édition, droit, philosophie et métiers en plein air : tout ce qui laisse de la place pour explorer.",
      compatible: ["Bélier", "Lion", "Balance", "Verseau"],
      lucky: { color: "Violet", day: "Jeudi", stone: "Turquoise" },
      style: "librement et avec optimisme, en quête de sens", domain: "l'aventure, les convictions et les horizons lointains",
      moon: "Vous avez besoin d'espace, d'humour et de possibilités pour vous sentir bien. Quand ça ne va pas, un changement de décor, une grande idée ou un bon fou rire vous remettent sur pied plus vite que tout." },
    { name: "Capricorne", dates: "22 déc. – 19 janv.", modality: "Cardinal", ruler: "Saturne", symbol: "La Chèvre-Poisson",
      summary: "Le Capricorne grimpe. Ambitieux, discipliné et pince-sans-rire, vous jouez sur le long terme et bâtissez des héritages sur lesquels les autres s'appuient.",
      strengths: ["Discipliné", "Responsable", "Stratège", "Patient"], challenges: ["Rigide", "Bourreau de travail", "Pessimiste"],
      love: "Vous prenez l'amour au sérieux et le prouvez par l'engagement et la fiabilité. La confiance se gagne lentement, puis c'est pour toujours.",
      career: "Management, finance, ingénierie, fonction publique et entrepreneuriat : des structures que vous pouvez diriger et améliorer.",
      compatible: ["Taureau", "Vierge", "Scorpion", "Poissons"],
      lucky: { color: "Marron", day: "Samedi", stone: "Grenat" },
      style: "avec méthode et ambition, pour durer", domain: "la responsabilité, la structure et les objectifs à long terme",
      moon: "Vous gardez vos émotions sous contrôle et trouvez du réconfort dans la réussite et la structure. Laissez-vous soutenir de temps en temps : la vulnérabilité n'est pas une faiblesse." },
    { name: "Verseau", dates: "20 janv. – 18 févr.", modality: "Fixe", ruler: "Saturne et Uranus", symbol: "Le Porteur d'eau",
      summary: "Le Verseau pense en avance. Original, humaniste et indépendant, vous êtes plus heureux quand vous travaillez sur des idées qui pourraient changer la vie de tous.",
      strengths: ["Inventif", "Progressiste", "Indépendant", "Amical"], challenges: ["Détaché", "Esprit de contradiction", "Imprévisible"],
      love: "Il vous faut d'abord de l'amitié et beaucoup d'air. Le bon partenaire aime vos bizarreries et partage votre vision de l'avenir.",
      career: "Technologie, sciences, militantisme, associations et innovation : partout où l'on construit l'avenir.",
      compatible: ["Gémeaux", "Balance", "Bélier", "Sagittaire"],
      lucky: { color: "Bleu électrique", day: "Samedi", stone: "Améthyste" },
      style: "de façon originale et indépendante, selon vos propres règles", domain: "la communauté, l'innovation et la liberté",
      moon: "Vous vivez vos émotions avec un peu de recul, préférant comprendre avant de ressentir. L'amitié et la liberté sont des besoins vitaux, et vous vous sentez chez vous parmi des esprits semblables." },
    { name: "Poissons", dates: "19 févr. – 20 mars", modality: "Mutable", ruler: "Jupiter et Neptune", symbol: "Les Poissons",
      summary: "Les Poissons ressentent tout. Compatissant, imaginatif et intuitif, vous circulez entre les mondes (rêves, art, empathie) et adoucissez les angles de la réalité.",
      strengths: ["Empathique", "Artiste", "Intuitif", "Doux"], challenges: ["Fuit la réalité", "Trop confiant", "Limites floues"],
      love: "Vous aimez de façon romantique et désintéressée. Il vous faut un partenaire qui protège votre sensibilité et partage votre émerveillement.",
      career: "Arts, musique, soins, spiritualité, associations et métiers d'aide : partout où l'imagination et la compassion comptent.",
      compatible: ["Cancer", "Scorpion", "Taureau", "Capricorne"],
      lucky: { color: "Vert d'eau", day: "Jeudi", stone: "Aigue-marine" },
      style: "avec intuition et compassion, par l'imagination", domain: "l'empathie, la spiritualité et le lâcher-prise",
      moon: "Vous absorbez l'humeur ambiante comme une éponge. La musique, l'eau, l'art et le calme vous aident à revenir à vous : protégez votre énergie et choisissez bien votre entourage." },
  ];
  S.forEach((fr, i) => {
    const { lucky, ...rest } = fr;
    Object.assign(SIGNS[i], rest);
    Object.assign(SIGNS[i].lucky, lucky);
  });

  Object.assign(PLANETS.sun, { name: "Soleil", role: "votre identité profonde et votre force vitale" });
  Object.assign(PLANETS.moon, { name: "Lune", role: "vos émotions, vos instincts et vos besoins intimes" });
  Object.assign(PLANETS.mercury, { name: "Mercure", role: "votre façon de penser, d'apprendre et de communiquer" });
  Object.assign(PLANETS.venus, { name: "Vénus", role: "votre façon d'aimer et ce qui compte pour vous" });
  Object.assign(PLANETS.mars, { name: "Mars", role: "votre énergie, votre courage et votre désir" });
  Object.assign(PLANETS.jupiter, { name: "Jupiter", role: "là où vous trouvez chance, croissance et abondance" });
  Object.assign(PLANETS.saturn, { name: "Saturne", role: "vos leçons de vie, votre discipline et votre maîtrise" });

  const H = [
    null,
    { name: "Soi et identité", short: "vous-même, votre image et les nouveaux départs", headline: "Le moment de commencer",
      do: ["Démarrez le projet que vous repoussez sans cesse", "Rafraîchissez votre look, votre garde-robe ou votre espace de travail", "Faites passer vos besoins en premier, pour une fois", "Présentez-vous à quelqu'un de nouveau", "Fixez-vous un objectif personnel et écrivez-le"],
      avoid: ["Attendre une permission pour agir", "Vous comparer aux autres", "Foncer dans un conflit pour avoir raison"] },
    { name: "Argent et valeurs", short: "l'argent, vos biens et l'estime de vous", headline: "Construisez votre valeur",
      do: ["Revoyez votre budget et vos objectifs d'épargne", "Demandez ce que vaut votre travail", "Investissez dans quelque chose de durable", "Débarrassez-vous de ce qui ne compte plus pour vous", "Offrez-vous un petit plaisir simple"],
      avoid: ["Les achats impulsifs pour se remonter le moral", "Sous-estimer vos compétences", "Vous accrocher aux choses par peur"] },
    { name: "Communication et apprentissage", short: "les conversations, l'apprentissage, la fratrie et les petits trajets", headline: "Exprimez-vous",
      do: ["Envoyez le message que vous rédigez dans votre tête", "Lisez, suivez un cours ou apprenez une compétence", "Appelez un frère, une sœur, un voisin ou un vieil ami", "Faites vos courses et réglez les détails en suspens", "Écrivez : journal, publication ou plan"],
      avoid: ["Les ragots et les paroles irréfléchies", "La surcharge d'informations", "Les promesses impossibles à tenir"] },
    { name: "Foyer et famille", short: "le foyer, la famille, les racines et les bases affectives", headline: "Revenez à vous",
      do: ["Passez du temps de qualité en famille", "Rangez ou améliorez votre logement", "Préparez un bon repas réconfortant à la maison", "Réfléchissez à vos origines", "Créez un rituel du soir cocooning"],
      avoid: ["Ramener le stress du travail à la maison", "Rouvrir de vieilles blessures familiales", "Trop vous engager à l'extérieur"] },
    { name: "Amour et créativité", short: "l'amour, la créativité, la joie et l'expression de soi", headline: "Jouez et créez",
      do: ["Prévoyez un rendez-vous ou une activité juste pour le plaisir", "Faites de l'art, de la musique ou toute chose créative", "Jouez avec des enfants, des animaux ou votre enfant intérieur", "Montrez un talent", "Acceptez une invitation"],
      avoid: ["Vous prendre trop au sérieux", "Les paris et jeux d'argent risqués", "Avoir besoin d'applaudissements pour vous sentir bien"] },
    { name: "Santé et routine", short: "la routine quotidienne, le travail, la santé et le service", headline: "Organisez-vous",
      do: ["Organisez votre agenda et votre liste de tâches", "Prenez ce rendez-vous médical", "Bougez et mangez bien", "Aidez un collègue sur quelque chose de concret", "Réparez un petit système qui vous agace"],
      avoid: ["Le perfectionnisme au lieu du progrès", "Sauter des repas ou des heures de sommeil", "Vous inquiéter de ce que vous ne contrôlez pas"] },
    { name: "Partenariats", short: "les relations, les partenaires et les accords", headline: "Faites un pas vers l'autre",
      do: ["Ayez une vraie conversation avec votre partenaire", "Collaborez au lieu de faire cavalier seul", "Négociez ou finalisez un accord", "Voyez les choses du point de vue de l'autre", "Retrouvez un ami proche en tête-à-tête"],
      avoid: ["Tenir les comptes dans vos relations", "Faire plaisir aux autres à vos dépens", "Éviter une conversation nécessaire"] },
    { name: "Transformation et ressources partagées", short: "l'intimité, l'argent partagé, le changement et le lâcher-prise", headline: "Allez plus loin",
      do: ["Réglez vos dettes, impôts ou finances communes", "Laissez partir ce qui a fait son temps", "Approfondissez une relation importante", "Étudiez un sujet à fond", "Ayez la conversation honnête que vous évitez"],
      avoid: ["Les luttes de pouvoir et jeux de contrôle", "Les secrets qui nourrissent la méfiance", "Garder de la rancune"] },
    { name: "Voyages et sagesse", short: "les voyages, les études supérieures, les croyances et les grandes idées", headline: "Élargissez vos horizons",
      do: ["Préparez un voyage ou explorez un lieu nouveau", "Étudiez quelque chose qui élargit votre vision du monde", "Philosophez avec quelqu'un de sage", "Prenez du recul sur vos objectifs", "Goûtez la cuisine, la musique ou les idées d'une autre culture"],
      avoid: ["Faire la morale ou être dogmatique", "Négliger les détails au profit des grands projets", "Trop promettre"] },
    { name: "Carrière et réputation", short: "la carrière, l'ambition, le statut et l'image publique", headline: "Prenez votre place",
      do: ["Faites un pas audacieux dans votre carrière ou présentez votre projet", "Mettez à jour votre CV ou votre portfolio", "Rencontrez une personne influente ou haut placée", "Fixez vos objectifs professionnels à long terme", "Revendiquez vos réussites"],
      avoid: ["Bâcler votre travail", "Négliger complètement votre vie privée pour le travail", "Les conflits publics avec l'autorité"] },
    { name: "Amis et communauté", short: "les amis, les groupes, les réseaux et les rêves d'avenir", headline: "Trouvez votre tribu",
      do: ["Contactez vos amis ou votre réseau", "Rejoignez un groupe, un club ou un événement local", "Imaginez vos rêves pour l'année à venir", "Engagez-vous pour une cause qui vous tient à cœur", "Collaborez sur un projet d'équipe"],
      avoid: ["Suivre la foule contre vos valeurs", "Vous disperser socialement", "Vous isoler quand vous avez besoin de soutien"] },
    { name: "Repos et monde intérieur", short: "le repos, la solitude, les rêves et le renouveau spirituel", headline: "Reposez-vous et ressourcez-vous",
      do: ["Reposez-vous, rechargez-vous et faites la grasse matinée si possible", "Méditez, priez ou écrivez", "Terminez les affaires en cours avant d'en commencer de nouvelles", "Soyez attentif à vos rêves et à votre intuition", "Faites une bonne action anonymement"],
      avoid: ["Surcharger votre agenda", "Vous anesthésier ou fuir", "Lancer de grands projets"] },
  ];
  H.forEach((h, i) => { if (h) Object.assign(HOUSES[i], h); });

  const A = [
    "Avec la Lune dans votre signe, vos sentiments et votre instinct sont amplifiés : c'est vous qui donnez le ton aujourd'hui.",
    "Une journée lunaire discrète : de petits changements d'humeur méritent votre attention.",
    "La Lune forme un sextile facile avec votre Soleil et ouvre de petites portes si vous frappez.",
    "La Lune est au carré de votre Soleil et ajoute des frictions : utilisez-les comme carburant plutôt que pour vous battre.",
    "La Lune est en trigone avec votre Soleil : les choses vont dans votre sens avec moins d'efforts que d'habitude.",
    "Quelque chose semble légèrement décalé ; de petits ajustements font beaucoup.",
    "Avec la Lune opposée à votre Soleil, les autres sont au centre de la scène : équilibrez leurs besoins et les vôtres.",
  ];
  A.forEach((m, i) => (ASPECTS[i].moon = m));

  const P = [
    ["Nouvelle Lune", "Fixez une intention claire pour le cycle à venir et écrivez-la."],
    ["Premier croissant", "Faites le premier pas concret vers votre intention."],
    ["Premier quartier", "Dépassez les résistances : décidez et engagez-vous."],
    ["Lune gibbeuse croissante", "Affinez et ajustez : peaufinez ce que vous avez commencé."],
    ["Pleine Lune", "Célébrez vos progrès et lâchez ce qui ne marche pas."],
    ["Lune gibbeuse décroissante", "Partagez ce que vous avez appris et exprimez votre gratitude."],
    ["Dernier quartier", "Faites le tri, pardonnez et lâchez prise."],
    ["Dernier croissant", "Reposez-vous et faites le point avant la prochaine nouvelle lune."],
  ];
  P.forEach(([name, action], i) => Object.assign(PHASES[i], { name, action }));

  Object.assign(AREAS.love, { label: "Amour",
    high: ["Votre charme est au maximum : faites le premier pas, flirtez ou prévoyez quelque chose de spécial.", "Les liens se créent facilement ; montrez votre côté tendre."],
    mid: ["Doux et stable. Les petits gestes comptent plus que les grandes déclarations.", "Restez clair dans votre communication et constant dans votre affection."],
    low: ["Les sentiments peuvent être à vif. Écoutez d'abord et n'interprétez pas trop les petites maladresses.", "Laissez respirer vos relations plutôt que de forcer une solution."] });
  Object.assign(AREAS.career, { label: "Carrière",
    high: ["L'élan est de votre côté : présentez, postulez, demandez, menez.", "On vous remarque pour les bonnes raisons. Montrez votre meilleur travail."],
    mid: ["Des progrès solides grâce à la routine. Terminez ce qui est en cours avant d'en ajouter.", "L'effort discret paie ; gardez un haut niveau d'exigence."],
    low: ["Attendez-vous à des retards ou malentendus. Vérifiez les détails et n'envenimez rien.", "Ce n'est pas le moment de forcer une décision : informez-vous plutôt."] });
  Object.assign(AREAS.wellness, { label: "Bien-être",
    high: ["L'énergie est haute : bougez et attaquez les tâches physiques.", "Vous êtes résistant en ce moment ; idéal pour commencer une bonne habitude."],
    mid: ["Équilibrez effort et repos. Hydratez-vous, étirez-vous et gardez un sommeil régulier.", "Rythme modéré : la régularité vaut mieux que l'intensité en ce moment."],
    low: ["Votre batterie est faible ; protégez votre sommeil et refusez le superflu.", "Le stress peut se manifester dans votre corps. Ralentissez et respirez."] });
  Object.assign(AREAS.money, { label: "Argent",
    high: ["Bon instinct financier : négociez ou investissez en vous.", "Des occasions de gagner ou d'économiser apparaissent ; saisissez les plus concrètes."],
    mid: ["Respectez votre budget et vous vous sentirez maître de la situation.", "Passez en revue vos abonnements et petites fuites ; des finances en ordre font du bien."],
    low: ["Évitez les achats impulsifs et de prêter de l'argent en ce moment.", "Lisez les petites lignes avant de signer ou de dépenser."] });

  Object.assign(ELEMENT_INFO.Fire, { colors: ["Cramoisi", "Or", "Orange"], desc: "Le Feu vous donne passion, confiance et courage d'agir. Les défis vous dynamisent et votre enthousiasme inspire les autres." });
  Object.assign(ELEMENT_INFO.Earth, { colors: ["Vert forêt", "Terre cuite", "Brun chocolat"], desc: "La Terre vous rend pratique, patient et ancré. Vous construisez pas à pas et appréciez ce qui est réel, fiable et concret." });
  Object.assign(ELEMENT_INFO.Air, { colors: ["Bleu ciel", "Lavande", "Argent"], desc: "L'Air fait de vous un penseur et un connecteur. Les idées, la conversation et les échanges vous font vivre." });
  Object.assign(ELEMENT_INFO.Water, { colors: ["Vert d'eau", "Indigo", "Blanc nacré"], desc: "L'Eau vous donne profondeur émotionnelle, intuition et empathie. Vous lisez entre les lignes et sentez la vérité." });

  Object.assign(LIFE_PATH, {
    1: ["Le Leader", "Indépendant, motivé et original. Vous êtes là pour tracer votre propre chemin et apprendre à vous faire confiance."],
    2: ["Le Pacificateur", "Sensible, coopératif et diplomate. Votre don est de rassembler les gens et de créer l'harmonie."],
    3: ["Le Communicant", "Créatif, expressif et joyeux. Vous êtes là pour inspirer par les mots, l'art et l'optimisme."],
    4: ["Le Bâtisseur", "Pratique, loyal et travailleur. Vous créez des bases solides sur lesquelles les autres comptent."],
    5: ["L'Aventurier", "Curieux, libre et adaptable. Vous apprenez par l'expérience, le changement et le voyage."],
    6: ["Le Protecteur", "Responsable, aimant et protecteur. Le foyer, la famille et le service sont au cœur de votre mission."],
    7: ["Le Chercheur", "Analytique, introspectif et spirituel. Vous êtes là pour chercher des vérités plus profondes."],
    8: ["Le Battant", "Ambitieux, autoritaire et tourné vers les objectifs. Vous êtes fait pour maîtriser le monde matériel."],
    9: ["L'Humaniste", "Compatissant, généreux et sage. Vous êtes là pour servir une cause plus grande que vous."],
    11: ["L'Intuitif (nombre maître)", "Visionnaire et très sensible. Vous transmettez l'inspiration et élevez les autres par votre clairvoyance."],
    22: ["Le Maître bâtisseur (nombre maître)", "Vous pouvez transformer de grands rêves en réalité grâce à la vision alliée à la discipline."],
    33: ["Le Maître enseignant (nombre maître)", "Désintéressé et bienveillant, vous êtes là pour guérir et enseigner par l'amour."],
  });

  const C = [
    ["Rat", "Vif d'esprit, débrouillard et charmant"], ["Buffle", "Appliqué, fiable et déterminé"],
    ["Tigre", "Courageux, compétitif et confiant"], ["Lapin", "Doux, élégant et diplomate"],
    ["Dragon", "Charismatique, ambitieux et chanceux"], ["Serpent", "Sage, intuitif et mystérieux"],
    ["Cheval", "Énergique, libre et chaleureux"], ["Chèvre", "Calme, créatif et bienveillant"],
    ["Singe", "Malin, joueur et inventif"], ["Coq", "Observateur, travailleur et honnête"],
    ["Chien", "Loyal, juste et protecteur"], ["Cochon", "Généreux, sincère et facile à vivre"],
  ];
  C.forEach((c, i) => { CHINESE[i][0] = c[0]; CHINESE[i][1] = c[1]; });
  ["Métal", "Métal", "Eau", "Eau", "Bois", "Bois", "Feu", "Feu", "Terre", "Terre"].forEach((e, i) => (CHINESE_ELEMENTS[i] = e));

  [
    "Vous paraissez direct, énergique et prêt à agir. On rencontre une personne fonceuse qui prend la vie à bras-le-corps, et vous commencez chaque nouveau chapitre sans peur.",
    "Vous paraissez calme, ancré et discrètement magnétique. On vous trouve stable et rassurant, et vous avancez dans la vie à votre propre rythme.",
    "Vous paraissez curieux, bavard et vif. On rencontre quelqu'un de brillant et d'accessible, et vous avancez en posant des questions et en créant des liens.",
    "Vous paraissez chaleureux, attentionné et un peu protecteur. On se sent en sécurité avec vous, et vous abordez les nouvelles situations avec prudence tant que vous n'avez pas confiance.",
    "Vous paraissez sûr de vous, rayonnant et expressif. Vous faites une entrée remarquée sans le vouloir, et l'on vous laisse naturellement donner le ton.",
    "Vous paraissez posé, compétent et observateur. On voit quelqu'un de soigné et serviable, et vous analysez avant d'agir.",
    "Vous paraissez charmant, gracieux et facile à aimer. On vous trouve diplomate et élégant, et vous abordez la vie à travers vos relations.",
    "Vous paraissez intense, secret et magnétique. On devine une grande profondeur, et vous avancez avec stratégie, en vous dévoilant lentement.",
    "Vous paraissez ouvert, enjoué et aventurier. On rencontre quelqu'un d'amical et drôle, et vous voyez la vie comme un voyage à explorer.",
    "Vous paraissez sérieux, compétent et maître de vous. On fait confiance à votre compétence, et vous avancez avec un plan et une vision à long terme.",
    "Vous paraissez unique, amical et un peu atypique. On voit un esprit original, et vous vivez selon vos propres règles.",
    "Vous paraissez doux, rêveur et empathique. On se sent compris auprès de vous, et vous avancez guidé par l'intuition et l'imagination.",
  ].forEach((r, i) => (RISING[i] = r));
}
