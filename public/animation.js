/* ==========================================================
   AEGIS SENTINEL - Dashboard Animations
   ========================================================== */


/* ==========================================================
   1) HORLOGE TEMPS REEL
   ========================================================== */

function updateClock(){

    const now = new Date();

    const heure =
        now.toLocaleTimeString("fr-FR");


    const date =
        now.toLocaleDateString("fr-FR",
        {
            weekday:"long",
            year:"numeric",
            month:"long",
            day:"numeric"
        });


    const clock =
        document.getElementById("heure");


    const dateBox =
        document.getElementById("date");


    if(clock)
        clock.textContent = heure;


    if(dateBox)
        dateBox.textContent = date;

}


setInterval(updateClock,1000);

updateClock();



/* ==========================================================
   2) ANIMATION DES COMPTEURS
   ========================================================== */


function animateCounter(element,target){

    let current = 0;


    const duration = 1500;


    const step =
        target / (duration / 20);



    const timer =
    setInterval(()=>{


        current += step;


        if(current >= target){

            element.textContent =
            target;

            clearInterval(timer);

        }

        else{

            element.textContent =
            Math.floor(current);

        }


    },20);


}



function startCounters(){


    const counters =
    document.querySelectorAll(".valeur");


    counters.forEach(counter=>{


        const value =
        parseInt(counter.textContent);



        if(!isNaN(value)){


            counter.textContent="0";


            animateCounter(
                counter,
                value
            );


        }


    });


}





/* ==========================================================
   3) APPARITION DES CARTES
   ========================================================== */


function revealCards(){


    const cards =
    document.querySelectorAll(
        ".stat-box,.panel"
    );


    cards.forEach((card,index)=>{


        card.style.opacity="0";


        card.style.transform=
        "translateY(40px)";



        setTimeout(()=>{


            card.style.transition=
            "all .6s ease";


            card.style.opacity="1";


            card.style.transform=
            "translateY(0)";



        },index*150);



    });



}





/* ==========================================================
   4) MODE SCAN EN COURS
   ========================================================== */


function startScanAnimation(){


    const button =
    document.querySelector("button");


    if(!button)
        return;



    button.innerHTML =
    `
    <span class="scan-dot"></span>
    Analyse en cours...
    `;



    button.disabled=true;



    button.style.opacity=".7";



}





function stopScanAnimation(){


    const button =
    document.querySelector("button");


    if(!button)
        return;



    button.innerHTML =
    `
    ▶ Lancer l'analyse
    `;


    button.disabled=false;


    button.style.opacity="1";


}




/* ==========================================================
   5) EFFET ALERTE ROUGE
   ========================================================== */


function alertPulse(){


    const alerts =
    document.querySelectorAll(
        ".alerte"
    );


    alerts.forEach(alert=>{


        alert.style.animation=
        "dangerPulse 1s infinite";


    });


}





/* ==========================================================
   6) INITIALISATION
   ========================================================== */


window.addEventListener(
"DOMContentLoaded",
()=>{


    revealCards();


    startCounters();


    alertPulse();


});