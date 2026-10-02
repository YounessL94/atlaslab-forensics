import { Locale } from './config';

export type ToolType = 'image' | 'text' | 'c2pa' | 'hub' | 'video' | 'deepfake' | 'privacy' | 'terms';

export interface RouteContent {
  slug: string;
  locale: Locale;
  /** ROUTE_MAP key of the same page in the other language (hreflang). */
  alt: string;
  title: string;
  metaDescription: string;
  h1: string;
  intro: string;
  toolType: ToolType;
  sections: Array<{ h2: string; p: string[] }>;
  faq: Array<{ q: string; a: string }>;
}

export const ROUTE_MAP: Record<string, RouteContent> = {
  '': {
    slug: '',
    locale: 'en',
    alt: 'fr',
    title: 'AI Content Forensics — Check Text & Images for AI | Atlas Forensics',
    metaDescription: 'Free AI Content Forensics for text and images. Check AI likelihood signals, C2PA provenance and honest uncertainty with no registration.',
    h1: 'Free AI Content Forensics & Provenance',
    intro: 'Inspect images and text for AI generation signals and cryptographic Content Credentials.',
    toolType: 'hub',
    sections: [
      {
        h2: 'What Atlas Forensics does',
        p: [
          'Atlas Forensics combines a commercial AI-generated content classifier with Content Credentials (C2PA) inspection. You get an AI likelihood estimate, a reliability level, the provenance status of the file and the limitations that apply to the result.',
          'When the evidence is weak or contradictory, the result is INDETERMINATE. We never turn a probabilistic score into a verdict of certainty.'
        ]
      },
      {
        h2: 'How to read a result',
        p: [
          'The AI likelihood estimate is the probability reported by the detection model, not a percentage of AI content. Reliability reflects input quality (length, compression) and how consistent the signals are.',
          'Content Credentials are cryptographically signed provenance records. When present and valid they are strong evidence about how a file was produced. When absent, they prove nothing: most platforms strip metadata on upload.'
        ]
      }
    ],
    faq: [
      { q: 'Can AI image detectors be wrong?', a: 'Yes. All detection methods are probabilistic estimations based on statistical patterns, not definitive proof.' },
      { q: 'Does missing C2PA mean an image is human-made?', a: 'No. C2PA credentials can be stripped by social media platforms or editing.' },
      { q: 'Do you store my uploaded images or text?', a: 'No. Content is sent to our detection provider for analysis and is not stored in our application storage.' }
    ]
  },
  'ai-detector': {
    slug: 'ai-detector',
    locale: 'en',
    alt: 'fr/detecteur-ia',
    title: 'Free AI Detector for Text & Images | Atlas Forensics',
    metaDescription: 'Analyze text and images for AI generation signals. Fast, free, transparent analysis with honest confidence levels.',
    h1: 'Free AI Detector Hub',
    intro: 'Choose your modality to analyze forensic signals and check cryptographic provenance.',
    toolType: 'hub',
    sections: [
      {
        h2: 'One detector, three checks',
        p: [
          'Image analysis estimates whether a picture was produced by a generative model and, when possible, which family of generator it most resembles. Text analysis scores passages for statistical patterns typical of large language models. The C2PA checker reads signed Content Credentials locally in your browser.'
        ]
      }
    ],
    faq: [
      { q: 'How does the AI detection hub work?', a: 'Select either image or text to run forensic signal analysis and inspect embedded Content Credentials.' },
      { q: 'Is it free?', a: 'Yes. The public detectors are free with fair-use limits to prevent abuse.' }
    ]
  },
  'ai-image-detector': {
    slug: 'ai-image-detector',
    locale: 'en',
    alt: 'fr/detecteur-image-ia',
    title: 'AI Image Detector — Check If an Image Was AI-Generated | Atlas Forensics',
    metaDescription: 'Upload an image to inspect AI-generation signals and Content Credentials. Free, no account required.',
    h1: 'AI Image Detector & Forensics',
    intro: 'Upload an image (JPG, PNG, WEBP max 4MB) to analyze synthetic visual signals and extract C2PA credentials.',
    toolType: 'image',
    sections: [
      {
        h2: 'What the image detector checks',
        p: [
          'The classifier looks for pixel-level artifacts left by diffusion models and GANs, and estimates the closest known generator (Midjourney, DALL·E, Flux, Stable Diffusion, Firefly and others). In parallel, your browser reads any embedded C2PA Content Credentials.',
          'Upload the original file whenever possible. Screenshots, heavy compression, resizing and filters remove the signals detectors rely on.'
        ]
      }
    ],
    faq: [
      { q: 'Can screenshots or compression affect detection?', a: 'Yes. Re-compressing or screenshotting images modifies pixel distribution and can lower signal accuracy.' },
      { q: 'What formats are supported?', a: 'JPG, PNG, and WEBP files up to 4MB are supported directly.' },
      { q: 'Can it detect partially edited images?', a: 'Only partially. The model is designed for fully generated images; local AI edits (inpainting) on a real photo may not be flagged.' }
    ]
  },
  'ai-text-detector': {
    slug: 'ai-text-detector',
    locale: 'en',
    alt: 'fr/detecteur-ia-texte',
    title: 'AI Text Detector — Check Text for AI Signals | Atlas Forensics',
    metaDescription: 'Paste text to inspect signals associated with AI-generated writing. Get an AI likelihood estimate and honest reliability levels.',
    h1: 'AI Text Detector',
    intro: 'Paste text (300 to 20,000 characters) to analyze linguistic predictability and structural coherence.',
    toolType: 'text',
    sections: [
      {
        h2: 'How the text detector works',
        p: [
          'The text is split into segments of about 2,000 characters. Each segment is scored, then an overall estimate is produced. When segments disagree, we lower the reliability and may return INDETERMINATE.',
          'Short texts, lists, formulaic writing (legal, technical, templates) and text written by non-native speakers are the most common sources of false positives.'
        ]
      }
    ],
    faq: [
      { q: 'Can AI text detectors produce false positives?', a: 'Yes, particularly on short texts or technical documentation.' },
      { q: 'How much text should I submit?', a: 'A minimum of 300 characters is required. 1,500+ characters produces the most reliable analysis.' },
      { q: 'Should I use this to sanction a student or employee?', a: 'No. A detector score alone is never sufficient evidence for a disciplinary decision.' }
    ]
  },
  'content-credentials-checker': {
    slug: 'content-credentials-checker',
    locale: 'en',
    alt: 'fr/verificateur-content-credentials',
    title: 'Content Credentials Checker — Inspect C2PA Provenance | Atlas Forensics',
    metaDescription: 'Inspect C2PA Content Credentials in your browser. Verify digital manifests and AI attribution locally.',
    h1: 'Content Credentials (C2PA) Checker',
    intro: 'Inspect embedded C2PA metadata directly in your browser without uploading your image to any server.',
    toolType: 'c2pa',
    sections: [
      {
        h2: 'What are Content Credentials?',
        p: [
          'C2PA Content Credentials are signed manifests embedded in a file that record which tool created or edited it. Adobe Firefly, OpenAI image tools, several cameras and editing apps write them.',
          'This checker reads the manifest, the signer and the validation state, and flags AI-generation declarations when present. A missing manifest is the normal case for most files online and does not indicate that content is human-made.'
        ]
      }
    ],
    faq: [
      { q: 'Is my file uploaded during C2PA verification?', a: 'No. C2PA verification runs client-side in your browser.' },
      { q: 'What does "Invalid" mean?', a: 'The manifest exists but its signature or hashes do not match the file, typically because the file was modified after signing.' }
    ]
  },
  'ai-video-detector': {
    slug: 'ai-video-detector',
    locale: 'en',
    alt: 'fr/detecteur-video-ia',
    title: 'AI Video Detector — Beta & AI Video Forensics | Atlas Forensics',
    metaDescription: 'Explore AI video detection methods and join our beta waitlist for synthetic video forensics.',
    h1: 'AI Video Forensics & Detector (Beta)',
    intro: 'Video forensic analysis is currently in private beta testing. Join the waitlist for early access.',
    toolType: 'video',
    sections: [
      {
        h2: 'How AI video detection works',
        p: [
          'Video detectors sample frames, score each for generation artifacts and check temporal consistency between frames. Results are noisier than for still images, which is why we are validating the feature before opening it.'
        ]
      }
    ],
    faq: [
      { q: 'Why is public video analysis restricted?', a: 'Frame-by-frame processing requires high computational power and temporal verification.' }
    ]
  },
  'deepfake-detector': {
    slug: 'deepfake-detector',
    locale: 'en',
    alt: 'fr/detecteur-deepfake',
    title: 'Deepfake Detector — Detection & Provenance Beta | Atlas Forensics',
    metaDescription: 'Understand facial manipulation signals and join our deepfake forensics beta list.',
    h1: 'Deepfake Detector & Facial Forensics',
    intro: 'Deepfake detection requires spatial artifact inspection and audio-visual synchronization analysis.',
    toolType: 'deepfake',
    sections: [
      {
        h2: 'Deepfakes vs. AI-generated images',
        p: [
          'A deepfake alters or swaps the identity of a real person, often in video. Fully generated images are a different problem. Deepfake detection scores each detected face and must be interpreted together with context and provenance.'
        ]
      }
    ],
    faq: [
      { q: 'How does deepfake detection differ from image detection?', a: 'Deepfake detection focuses on facial alignment and identity modification artifacts.' }
    ]
  },
  privacy: {
    slug: 'privacy',
    locale: 'en',
    alt: 'fr/confidentialite',
    title: 'Privacy Policy | Atlas Forensics',
    metaDescription: 'Privacy policy for Atlas Forensics.',
    h1: 'Privacy Policy',
    intro: 'We prioritize privacy and data minimization.',
    toolType: 'privacy',
    sections: [
      {
        h2: 'Content you analyze',
        p: [
          'Images and text submitted to the AI detectors are transmitted over HTTPS to our detection providers (Hive for images, Winston AI for text) to compute the result, then discarded by our application. We do not store submitted content in our own storage and do not use it for training.',
          'Content Credentials (C2PA) inspection runs entirely in your browser; the file is not uploaded for that check.'
        ]
      },
      {
        h2: 'Technical data',
        p: [
          'To prevent abuse we compute a salted, one-way hash of your IP address and keep short-lived counters (up to 24 hours). Raw IP addresses are not stored. Bot protection is provided by Cloudflare Turnstile. Aggregate, cookieless audience measurement is provided by Vercel Analytics.'
        ]
      },
      {
        h2: 'Waitlist',
        p: [
          'If you join a waitlist we store your email address and the product you selected, only to contact you about that product. You can request deletion at any time by emailing contact@atlaslab.io.'
        ]
      },
      {
        h2: 'Your rights',
        p: ['Under the GDPR and similar laws you may request access, rectification or deletion of your personal data by contacting contact@atlaslab.io.']
      }
    ],
    faq: []
  },
  terms: {
    slug: 'terms',
    locale: 'en',
    alt: 'fr/mentions-legales',
    title: 'Terms of Service | Atlas Forensics',
    metaDescription: 'Terms of service and legal disclaimer.',
    h1: 'Terms of Service & Legal Disclaimer',
    intro: 'Usage terms, probabilistic limitations, and legal disclaimers.',
    toolType: 'terms',
    sections: [
      {
        h2: 'Probabilistic results',
        p: [
          'All results are statistical estimates provided as-is, without warranty. They are not proof of authorship or origin and must not be used as the sole basis for disciplinary, employment, legal or financial decisions.'
        ]
      },
      {
        h2: 'Acceptable use',
        p: [
          'You must have the right to submit the content you analyze. Automated scraping, attempts to bypass rate limits or bot protection, and use of the service to develop detector-evasion tools are prohibited. Fair-use limits apply.'
        ]
      },
      {
        h2: 'Liability',
        p: ['To the extent permitted by law, Atlas Lab is not liable for decisions made on the basis of results produced by this service.']
      }
    ],
    faq: []
  },
  fr: {
    slug: 'fr',
    locale: 'fr',
    alt: '',
    title: 'Forensique IA — Analysez textes et images | Atlas Forensics',
    metaDescription: 'Forensique IA gratuite pour textes et images. Analysez les signaux de génération IA et les Content Credentials C2PA.',
    h1: 'Forensique IA & Provenance Gratuite',
    intro: 'Inspectez vos images et textes pour détecter les signaux de génération IA et vérifier la provenance.',
    toolType: 'hub',
    sections: [
      {
        h2: 'Ce que fait Atlas Forensics',
        p: [
          'Atlas Forensics combine un classifieur commercial de contenus générés par IA et l’inspection des Content Credentials (C2PA). Vous obtenez une estimation de probabilité IA, un niveau de fiabilité, le statut de provenance du fichier et les limites du résultat.',
          'Quand les indices sont faibles ou contradictoires, le résultat est INDÉTERMINÉ. Nous ne transformons jamais un score probabiliste en certitude.'
        ]
      },
      {
        h2: 'Comment lire un résultat',
        p: [
          'L’estimation IA est la probabilité fournie par le modèle de détection, pas un pourcentage de contenu IA. La fiabilité dépend de la qualité de l’entrée (longueur, compression) et de la cohérence des signaux.',
          'L’absence de Content Credentials ne prouve rien : la plupart des plateformes suppriment les métadonnées à l’import.'
        ]
      }
    ],
    faq: [
      { q: 'Un détecteur d’image IA peut-il se tromper ?', a: 'Oui. Toutes les méthodes de détection sont des estimations probabilistes.' },
      { q: 'L’absence de C2PA signifie-t-elle qu’une image est humaine ?', a: 'Non. Les Content Credentials sont souvent supprimés par les réseaux sociaux ou l’édition.' },
      { q: 'Conservez-vous mes fichiers ou textes ?', a: 'Non. Le contenu est transmis à notre prestataire de détection pour l’analyse et n’est pas conservé dans notre stockage.' }
    ]
  },
  'fr/detecteur-ia': {
    slug: 'fr/detecteur-ia',
    locale: 'fr',
    alt: 'ai-detector',
    title: 'Détecteur IA gratuit pour texte et image | Atlas Forensics',
    metaDescription: 'Analysez textes et images pour détecter les signaux de génération IA.',
    h1: 'Hub Détecteur IA',
    intro: 'Choisissez votre modalité pour analyser les signaux forensiques et contrôler la provenance.',
    toolType: 'hub',
    sections: [
      {
        h2: 'Un détecteur, trois vérifications',
        p: [
          'L’analyse d’image estime si une image a été produite par un modèle génératif et, si possible, de quelle famille de générateurs elle se rapproche. L’analyse de texte repère les motifs statistiques typiques des grands modèles de langage. Le vérificateur C2PA lit les Content Credentials localement dans votre navigateur.'
        ]
      }
    ],
    faq: [
      { q: 'Le service est-il gratuit ?', a: 'Oui. Les détecteurs publics sont gratuits, avec des limites d’usage raisonnable contre les abus.' }
    ]
  },
  'fr/detecteur-image-ia': {
    slug: 'fr/detecteur-image-ia',
    locale: 'fr',
    alt: 'ai-image-detector',
    title: 'Détecteur d’image IA gratuit | Atlas Forensics',
    metaDescription: 'Importez une image et analysez les signaux de génération IA ainsi que les Content Credentials.',
    h1: 'Détecteur d’Image IA & Forensique',
    intro: 'Importez une image (JPG, PNG, WEBP max 4 Mo) pour analyser les signaux synthétiques.',
    toolType: 'image',
    sections: [
      {
        h2: 'Ce que vérifie le détecteur d’image',
        p: [
          'Le classifieur recherche les artefacts laissés par les modèles de diffusion et les GAN, et estime le générateur connu le plus proche (Midjourney, DALL·E, Flux, Stable Diffusion, Firefly…). En parallèle, votre navigateur lit les Content Credentials C2PA éventuels.',
          'Importez le fichier original si possible : captures d’écran, recompression, redimensionnement et filtres effacent les signaux utilisés par les détecteurs.'
        ]
      }
    ],
    faq: [
      { q: 'La compression ou les captures d’écran faussent-elles la détection ?', a: 'Oui. Elles modifient la distribution des pixels et réduisent la fiabilité.' },
      { q: 'Quels formats sont acceptés ?', a: 'JPG, PNG et WEBP jusqu’à 4 Mo.' }
    ]
  },
  'fr/detecteur-ia-texte': {
    slug: 'fr/detecteur-ia-texte',
    locale: 'fr',
    alt: 'ai-text-detector',
    title: 'Détecteur IA texte gratuit | Atlas Forensics',
    metaDescription: 'Collez un texte pour analyser les signaux associés à la rédaction par IA.',
    h1: 'Détecteur de Texte IA',
    intro: 'Collez un texte (300 à 20 000 caractères) pour analyser la prédictibilité linguistique.',
    toolType: 'text',
    sections: [
      {
        h2: 'Fonctionnement du détecteur de texte',
        p: [
          'Le texte est découpé en segments d’environ 2 000 caractères, chacun évalué séparément, puis une estimation globale est calculée. Si les segments divergent, la fiabilité baisse et le résultat peut être INDÉTERMINÉ.',
          'Les textes courts, les listes, les écrits très normés (juridique, technique) et les textes de non-natifs sont les principales sources de faux positifs.'
        ]
      }
    ],
    faq: [
      { q: 'Un détecteur de texte IA peut-il produire des faux positifs ?', a: 'Oui, surtout sur des textes courts ou techniques.' },
      { q: 'Quelle longueur de texte soumettre ?', a: '300 caractères minimum ; au-delà de 1 500 caractères l’analyse est plus fiable.' }
    ]
  },
  'fr/verificateur-content-credentials': {
    slug: 'fr/verificateur-content-credentials',
    locale: 'fr',
    alt: 'content-credentials-checker',
    title: 'Vérificateur Content Credentials et C2PA | Atlas Forensics',
    metaDescription: 'Inspectez les Content Credentials C2PA directement dans votre navigateur.',
    h1: 'Vérificateur Content Credentials (C2PA)',
    intro: 'Inspectez les métadonnées C2PA directement dans votre navigateur.',
    toolType: 'c2pa',
    sections: [
      {
        h2: 'Que sont les Content Credentials ?',
        p: [
          'Les Content Credentials C2PA sont des manifestes signés intégrés au fichier, qui indiquent quel outil l’a créé ou modifié. Ce vérificateur lit le manifeste, le signataire et l’état de validation, et signale les déclarations de génération par IA.',
          'L’absence de manifeste est le cas normal pour la plupart des fichiers en ligne et n’indique pas qu’un contenu est d’origine humaine.'
        ]
      }
    ],
    faq: [
      { q: 'Mon fichier est-il envoyé à un serveur ?', a: 'Non. La vérification C2PA s’exécute dans votre navigateur.' }
    ]
  },
  'fr/detecteur-video-ia': {
    slug: 'fr/detecteur-video-ia',
    locale: 'fr',
    alt: 'ai-video-detector',
    title: 'Détecteur vidéo IA — Bêta | Atlas Forensics',
    metaDescription: 'Découvrez la détection vidéo IA et rejoignez la liste d’attente.',
    h1: 'Détecteur Vidéo IA (Bêta)',
    intro: 'L’analyse vidéo est actuellement réservée à la bêta privée.',
    toolType: 'video',
    sections: [
      {
        h2: 'Comment fonctionne la détection vidéo',
        p: ['Les détecteurs vidéo échantillonnent des images, évaluent chacune et contrôlent la cohérence temporelle. Les résultats sont plus bruités que pour les images fixes : nous validons la fonctionnalité avant de l’ouvrir.']
      }
    ],
    faq: [
      { q: 'Pourquoi l’analyse vidéo n’est-elle pas publique ?', a: 'Le traitement image par image demande beaucoup de calcul et une vérification temporelle.' }
    ]
  },
  'fr/detecteur-deepfake': {
    slug: 'fr/detecteur-deepfake',
    locale: 'fr',
    alt: 'deepfake-detector',
    title: 'Détecteur de deepfake — Bêta | Atlas Forensics',
    metaDescription: 'Comprenez la détection de manipulation faciale et inscrivez-vous à la bêta.',
    h1: 'Détecteur de Deepfake & Forensique',
    intro: 'La détection de deepfake se concentre sur les artéfacts d’alignement facial.',
    toolType: 'deepfake',
    sections: [
      {
        h2: 'Deepfake ou image générée ?',
        p: ['Un deepfake modifie ou remplace l’identité d’une personne réelle, souvent en vidéo. La détection évalue chaque visage détecté et doit être interprétée avec le contexte et la provenance.']
      }
    ],
    faq: []
  },
  'fr/confidentialite': {
    slug: 'fr/confidentialite',
    locale: 'fr',
    alt: 'privacy',
    title: 'Politique de Confidentialité | Atlas Forensics',
    metaDescription: 'Politique de confidentialité d’Atlas Forensics.',
    h1: 'Politique de Confidentialité',
    intro: 'Nous appliquons une politique stricte de minimisation des données.',
    toolType: 'privacy',
    sections: [
      {
        h2: 'Contenus analysés',
        p: [
          'Les images et textes soumis aux détecteurs sont transmis en HTTPS à nos prestataires de détection (Hive pour les images, Winston AI pour les textes) pour calculer le résultat, puis abandonnés par notre application. Nous ne les conservons pas et ne les utilisons pas pour de l’entraînement.',
          'L’inspection des Content Credentials (C2PA) s’exécute entièrement dans votre navigateur.'
        ]
      },
      {
        h2: 'Données techniques',
        p: ['Pour prévenir les abus, nous calculons une empreinte salée et irréversible de votre adresse IP et conservons des compteurs de courte durée (24 heures maximum). Les adresses IP brutes ne sont pas stockées. La protection anti-robots est fournie par Cloudflare Turnstile ; la mesure d’audience agrégée et sans cookie par Vercel Analytics.']
      },
      {
        h2: 'Liste d’attente',
        p: ['Si vous rejoignez une liste d’attente, nous conservons votre adresse email et le produit choisi, uniquement pour vous contacter à ce sujet. Suppression sur simple demande à contact@atlaslab.io.']
      },
      {
        h2: 'Vos droits',
        p: ['Conformément au RGPD, vous pouvez demander l’accès, la rectification ou la suppression de vos données en écrivant à contact@atlaslab.io.']
      }
    ],
    faq: []
  },
  'fr/mentions-legales': {
    slug: 'fr/mentions-legales',
    locale: 'fr',
    alt: 'terms',
    title: 'Mentions Légales | Atlas Forensics',
    metaDescription: 'Mentions légales et avertissement.',
    h1: 'Mentions Légales & Disclaimers',
    intro: 'Conditions d’utilisation et informations légales.',
    toolType: 'terms',
    sections: [
      {
        h2: 'Résultats probabilistes',
        p: ['Tous les résultats sont des estimations statistiques fournies en l’état, sans garantie. Ils ne constituent pas une preuve d’origine ou de paternité et ne doivent pas fonder seuls une décision disciplinaire, professionnelle, juridique ou financière.']
      },
      {
        h2: 'Usage autorisé',
        p: ['Vous devez disposer des droits sur les contenus soumis. Le scraping automatisé, le contournement des limites ou de la protection anti-robots et l’utilisation du service pour concevoir des outils d’évasion de détection sont interdits.']
      },
      {
        h2: 'Éditeur',
        p: ['Atlas Lab — contact : contact@atlaslab.io. Hébergement : Vercel Inc., 440 N Barranca Ave #4133, Covina, CA 91723, États-Unis.']
      }
    ],
    faq: []
  }
};

export function pathFor(key: string): string {
  return '/' + key;
}

export function getRoute(locale: Locale, slug?: string): RouteContent | undefined {
  const key = locale === 'fr' ? (slug ? `fr/${slug}` : 'fr') : slug || '';
  return ROUTE_MAP[key];
}

export function slugsFor(locale: Locale): string[] {
  return Object.values(ROUTE_MAP)
    .filter((r) => r.locale === locale && r.slug !== '' && r.slug !== 'fr')
    .map((r) => (locale === 'fr' ? r.slug.slice(3) : r.slug));
}
