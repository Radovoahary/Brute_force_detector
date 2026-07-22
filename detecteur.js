// detecteur.js
// ---------------------------------------------
// Détecteur de brute force par analyse de logs SSH
// ---------------------------------------------

const fs = require('fs');
const readline = require('readline');

// Configuration (les "paramètres utilisateur" demandés dans le cahier des charges)
const CONFIG = {
  fichierLog: 'logs/auth_test.log',
  seuilAlerte: 5,        // nombre de tentatives échouées avant alerte
  fichierRapport: 'rapports/rapport.csv',
};

// Expression régulière pour extraire les infos d'une ligne de log.
// On capture : la date, l'action (Failed/Accepted), l'utilisateur, l'IP
// Exemple de ligne : "Jul 21 09:15:32 server sshd[1234]: Failed password for root from 192.168.1.50 port 54321 ssh2"
const REGEX_LOG = /^(\w{3}\s+\d+\s+\d{2}:\d{2}:\d{2}).*sshd\[\d+\]:\s+(Failed|Accepted)\s+password\s+for\s+(?:invalid user\s+)?(\S+)\s+from\s+(\d{1,3}(?:\.\d{1,3}){3})/;

/**
 * Parse une ligne de log et retourne un objet structuré, ou null si la
 * ligne ne correspond pas au format attendu.
 */
function parserLigne(ligne) {
  const match = ligne.match(REGEX_LOG);
  if (!match) return null;

  const [, date, action, utilisateur, ip] = match;
  return {
    date,
    succes: action === 'Accepted',
    utilisateur,
    ip,
  };
}

/**
 * Lit le fichier ligne par ligne (utile pour de gros fichiers,
 * on ne charge pas tout en mémoire d'un coup) et retourne les
 * statistiques de tentatives échouées.
 */
async function analyserLog(cheminFichier) {
  const flux = fs.createReadStream(cheminFichier);
  const rl = readline.createInterface({ input: flux, crlfDelay: Infinity });

  const tentativesParIP = new Map();       // ip -> nombre d'échecs
  const tentativesParUtilisateur = new Map(); // utilisateur -> nombre d'échecs
  const detailParIP = new Map();           // ip -> liste des tentatives (pour le rapport)

  let totalLignes = 0;
  let totalEchecs = 0;

  for await (const ligne of rl) {
    totalLignes++;
    const info = parserLigne(ligne);
    if (!info) continue;       // ligne ignorée (format non reconnu)
    if (info.succes) continue; // on ne compte que les échecs

    totalEchecs++;

    tentativesParIP.set(info.ip, (tentativesParIP.get(info.ip) || 0) + 1);
    tentativesParUtilisateur.set(
      info.utilisateur,
      (tentativesParUtilisateur.get(info.utilisateur) || 0) + 1
    );

    if (!detailParIP.has(info.ip)) detailParIP.set(info.ip, []);
    detailParIP.get(info.ip).push(info);
  }

  return { totalLignes, totalEchecs, tentativesParIP, tentativesParUtilisateur, detailParIP };
}

/**
 * Compare les compteurs au seuil et retourne la liste des IP suspectes,
 * triée de la plus dangereuse à la moins dangereuse.
 */
function detecterAnomalies(tentativesParIP, seuil) {
  const suspectes = [];
  for (const [ip, count] of tentativesParIP) {
    if (count >= seuil) {
      suspectes.push({ ip, tentatives: count });
    }
  }
  suspectes.sort((a, b) => b.tentatives - a.tentatives);
  return suspectes;
}

/**
 * Affiche un rapport lisible dans la console.
 */
function afficherRapport(stats, suspectes) {
  console.log('\n========== RAPPORT D\'ANALYSE ==========');
  console.log(`Lignes analysées      : ${stats.totalLignes}`);
  console.log(`Tentatives échouées   : ${stats.totalEchecs}`);
  console.log(`IP distinctes en échec: ${stats.tentativesParIP.size}`);
  console.log(`Seuil de détection    : ${CONFIG.seuilAlerte} tentatives\n`);

  if (suspectes.length === 0) {
    console.log('Aucune IP suspecte détectée.');
  } else {
    console.log(`⚠️  ${suspectes.length} IP(s) suspecte(s) détectée(s) :\n`);
    for (const s of suspectes) {
      console.log(`  - ${s.ip.padEnd(16)} → ${s.tentatives} tentatives échouées`);
    }
  }

  console.log('\n--- Top 10 utilisateurs ciblés ---');
  const topUtilisateurs = [...stats.tentativesParUtilisateur.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10);
  for (const [user, count] of topUtilisateurs) {
    console.log(`  - ${user.padEnd(16)} → ${count} tentatives`);
  }
  console.log('=========================================\n');
}

/**
 * Sauvegarde le rapport au format CSV.
 */
function sauvegarderRapportCSV(suspectes, cheminSortie) {
  const entetes = 'ip,tentatives_echouees\n';
  const lignes = suspectes.map(s => `${s.ip},${s.tentatives}`).join('\n');
  fs.writeFileSync(cheminSortie, entetes + lignes + '\n');
  console.log(`Rapport CSV sauvegardé dans : ${cheminSortie}`);
}

// --- Programme principal ---
async function main() {
  console.log(`Analyse du fichier : ${CONFIG.fichierLog}`);
  const stats = await analyserLog(CONFIG.fichierLog);
  const suspectes = detecterAnomalies(stats.tentativesParIP, CONFIG.seuilAlerte);

  afficherRapport(stats, suspectes);
  sauvegarderRapportCSV(suspectes, CONFIG.fichierRapport);
}

main().catch(err => console.error('Erreur :', err));