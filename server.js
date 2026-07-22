// server.js
// ---------------------------------------------
// Serveur web local qui sert l'interface graphique
// et expose une API pour lancer l'analyse des logs.
// ---------------------------------------------

const express = require('express');
const fs = require('fs');
const readline = require('readline');

const app = express();
const PORT = 3000;

app.use(express.json());
app.use(express.static('public')); // sert le fichier index.html

/**
 * Parse une ligne de log en repérant simplement les mots-clés,
 * plutôt qu'avec une seule grosse regex fragile. Beaucoup plus robuste
 * face aux petites variations d'espacement.
 */
function parserLigne(ligne) {
  if (!ligne.includes('sshd[')) return null;

  const estEchec = ligne.includes('Failed password');
  const estSucces = ligne.includes('Accepted password');
  if (!estEchec && !estSucces) return null;

  const matchIP = ligne.match(/from\s+(\d{1,3}(?:\.\d{1,3}){3})/);
  const matchUser = ligne.match(/password for (?:invalid user )?(\S+)/);
  if (!matchIP || !matchUser) return null;

  return {
    succes: estSucces,
    utilisateur: matchUser[1],
    ip: matchIP[1],
  };
}

/**
 * Lit le fichier de log ligne par ligne et calcule les statistiques.
 */
async function analyserLog(cheminFichier) {
  const flux = fs.createReadStream(cheminFichier);
  const rl = readline.createInterface({ input: flux, crlfDelay: Infinity });

  const tentativesParIP = new Map();
  const tentativesParUtilisateur = new Map();

  let totalLignes = 0;
  let totalEchecs = 0;
  let lignesIgnorees = 0;

  for await (const ligne of rl) {
    if (!ligne.trim()) continue;
    totalLignes++;

    const info = parserLigne(ligne);
    if (!info) { lignesIgnorees++; continue; }
    if (info.succes) continue;

    totalEchecs++;
    tentativesParIP.set(info.ip, (tentativesParIP.get(info.ip) || 0) + 1);
    tentativesParUtilisateur.set(
      info.utilisateur,
      (tentativesParUtilisateur.get(info.utilisateur) || 0) + 1
    );
  }

  return { totalLignes, totalEchecs, lignesIgnorees, tentativesParIP, tentativesParUtilisateur };
}

function detecterAnomalies(tentativesParIP, seuil) {
  const suspectes = [];
  for (const [ip, count] of tentativesParIP) {
    if (count >= seuil) suspectes.push({ ip, tentatives: count });
  }
  return suspectes.sort((a, b) => b.tentatives - a.tentatives);
}

// --- Route API appelée par le bouton de l'interface ---
app.post('/api/analyser', async (req, res) => {
  try {
    const seuil = parseInt(req.body.seuil) || 5;
    const cheminLog = 'logs/auth_test.log';

    const stats = await analyserLog(cheminLog);
    const suspectes = detecterAnomalies(stats.tentativesParIP, seuil);

    const topUtilisateurs = [...stats.tentativesParUtilisateur.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([utilisateur, tentatives]) => ({ utilisateur, tentatives }));

    // Sauvegarde du rapport CSV comme avant
    const csv = 'ip,tentatives_echouees\n' +
      suspectes.map(s => `${s.ip},${s.tentatives}`).join('\n') + '\n';
    fs.writeFileSync('rapports/rapport.csv', csv);

    res.json({
      totalLignes: stats.totalLignes,
      totalEchecs: stats.totalEchecs,
      lignesIgnorees: stats.lignesIgnorees,
      nbIPDistinctes: stats.tentativesParIP.size,
      suspectes,
      topUtilisateurs,
      seuil,
    });
  } catch (err) {
    res.status(500).json({ erreur: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`Serveur lancé : http://localhost:${PORT}`);
});