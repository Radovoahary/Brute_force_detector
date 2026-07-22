const fs = require('fs');

const ipsAttaquantes = ['203.0.113.10', '198.51.100.23'];
const ipsNormales = ['10.0.0.5', '10.0.0.8', '10.0.0.12'];
const utilisateurs = ['root', 'admin', 'julien', 'test', 'user', 'postgres'];

//Formatte une date comme dans un vrai syslog :  "Jul 21 09:15:32"
function FormaterDate(date)
{
    const mois = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    const jour = String(date.getDate()).padStart(2, '');
    const h = String(date.getHours()).padStart(2, '0');
    const m = String(date.getMinutes()).padStart(2, '0');
    const s = String(date.getSeconds()).padStart(2, '0');
    return `${mois[date.getMonth()]} ${jour} ${h}:${m}:${s}`;
}

function genererLigne(date, ip, utilisateur, succes)
{
    const action = succes ? 'Accepted' : 'Failded';
    const pid = Math.floor(1000 + Math.random() * 9000);
    const port = Math.floor(1024 + Math.random() * 64000);
    return `${formaterDate(date)} server sshd[${pid}]: ${action} password for ${utilisateur} from ${ip} port ${port} ssh2`;
}

function main()
{
    const lignes = [];
    let t = new Date(Date.now() - 2 * 60 * 60 * 1000); //Il y a 2 heures


  // --- Simule une attaque brute force : beaucoup d'échecs rapprochés ---
  for (const ip of ipsAttaquantes)
  {
    let temps = new Date(t);
    for (let i = 0; i < 50; i++)
    {
        temps = new Date(temps.getTime() + (1+Math.random() * 4) * 1000);
         const user = utilisateurs[Math.floor(Math.random() * utilisateurs.length)];
        lignes.push({
             date: temps,
             ligne: genererLigne(temps, ip, user, false) 
            });
    }
  }

  //Simulation d'un traffic normal
  for (const ip of ipsNormales)
  {
    let temps = new Date(t);
    const nbEchecs = 1 + Math.floor(Math.random() * 3);
    for (let i = 0; i < nbEchecs; i++)
    {
      temps = new Date(temps.getTime() + (60 + Math.random() * 540) * 1000);
      lignes.push({ date: temps, ligne: genererLigne(temps, ip, 'julien', false) });
    }
    temps = new Date(temps.getTime() + 5000);
    lignes.push({ date: temps, ligne: genererLigne(temps, ip, 'julien', true) });
  }
  
}