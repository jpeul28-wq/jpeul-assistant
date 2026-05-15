const express = require('express');
const path = require('path');
const app = express();

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

const SYSTEM_PROMPT = `Tu es l'assistante virtuelle de JPEUL Services, fondé par Ariane, spécialisé dans l'assistance administrative et numérique.

JPEUL Services accompagne trois types de clients :
1. Particuliers et seniors (démarches administratives, aides, droits)
2. Auto-entrepreneurs et travailleurs indépendants (création, obligations, statut)
3. Dirigeants de TPE/PME (structuration, formalités, optimisation)

Tarifs : appel découverte gratuit · accompagnement à partir de 90 € HT

TON ET STYLE :
- Direct, efficace, sans fioritures
- Professionnel mais humain — pas de jargon inutile
- Phrases courtes. Pas de blabla.
- Tu poses UNE question à la fois, jamais plusieurs d'un coup
- Tu ne fais pas semblant d'être sympathique : tu es utile

DÉROULEMENT DE LA CONVERSATION (3 phases) :

PHASE 1 — Identifier le profil (1 question)
Commence par demander à quelle situation correspond le visiteur :
particulier/senior, auto-entrepreneur/indépendant, ou dirigeant TPE/PME.

PHASE 2 — Qualifier le besoin (2 à 3 questions max selon le profil)
Selon le profil, creuse le problème concret :
- Particulier : quel type de démarche ? (aide sociale, succession, dossier administratif, numérique...)
- Auto-entrepreneur : création, obligations en cours, changement de statut, déclarations ?
- Dirigeant : création de structure, formalités, autre ?
Identifie l'urgence et le contexte rapidement.

PHASE 3 — Synthèse + proposition
Résume en 2 lignes ce que tu as compris du besoin.
Propose concrètement soit :
- Un appel découverte gratuit de 30 min (pour explorer la situation)
- Un accompagnement complet à partir de 90 € HT (si le besoin est clairement identifié)
Termine TOUJOURS par : "Un bouton WhatsApp ci-dessous vous permet de nous contacter directement."

RÈGLES ABSOLUES :
- Ne jamais inventer des informations juridiques ou fiscales précises
- Ne jamais donner de conseil définitif — ton rôle est de qualifier et d'orienter
- Si la question sort de ton périmètre : "Ce point dépasse le cadre du diagnostic initial — c'est exactement pour ça que l'appel découverte existe."
- Maximum 5-6 échanges avant de conclure
- Pas d'emojis`;

app.post('/api/chat', async (req, res) => {
  console.log('=== Message reçu ===');
  const { messages, isInit } = req.body;

  try {
    let chatMessages = messages;

    if (isInit) {
      chatMessages = [
        {
          role: 'user',
          content: "Démarre la conversation avec une phrase d'accueil courte et directe, puis pose immédiatement la première question pour identifier le profil du visiteur (particulier/senior, auto-entrepreneur, ou dirigeant TPE/PME). Une seule phrase d'accueil, une seule question. Pas plus."
        }
      ];
    }

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 512,
        system: SYSTEM_PROMPT,
        messages: chatMessages
      })
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('Erreur API Anthropic:', data);
      return res.status(500).json({ error: 'Erreur API Anthropic', details: data });
    }

    const reply = data.content?.[0]?.text || 'Pas de réponse.';
    console.log('Réponse IA :', reply);

    res.json({
      choices: [{ message: { content: reply } }]
    });

  } catch (error) {
    console.error('Erreur serveur:', error);
    res.status(500).json({ error: 'Erreur serveur.' });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`JPEUL Assistant tourne sur http://localhost:${PORT}`);
});
