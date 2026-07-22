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
app.use(express.static('public'));  //Sert le fichier index.html

//Parse une ligne de log en repérant simplement les mots-clés
function parserLigne(ligne) {
    if (!ligne.includes('sshd[')) return null;
    
}
