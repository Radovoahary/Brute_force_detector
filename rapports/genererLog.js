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