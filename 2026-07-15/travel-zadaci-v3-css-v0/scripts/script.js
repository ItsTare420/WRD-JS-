/* -------------------------------------------------------------------------- */
/* API putanje su pripremljene                                                 */
/* -------------------------------------------------------------------------- */

const API_PONUDE = "https://wrd-api.fit.ba/Ispit20250712/GetNovePonude";
const API_REZERVACIJE = "https://wrd-api.fit.ba/Ispit20250712/Dodaj";

let globalPodaci = [];
let odabranoPutovanje = null;

const ErrorBackgroundColor = "#FE7D7D";
const OkBackgroundColor = "#DFF6D8";

/* -------------------------------------------------------------------------- */
/* Pripremljene poruke                                                         */
/* -------------------------------------------------------------------------- */

function prikaziPoruku(tip, naslov, tekst, trajanje = 5500) {
  let container = document.getElementById("app-poruke");

  if (!container) {
    container = document.createElement("div");
    container.id = "app-poruke";
    container.className = "app-messages";
    container.setAttribute("aria-live", "polite");
    document.body.appendChild(container);
  }

  const poruka = document.createElement("div");
  poruka.className = `app-message app-message-${tip}`;
  poruka.innerHTML = `
    <div>
      <strong>${naslov}</strong>
      <p>${tekst}</p>
    </div>
    <button type="button" aria-label="Zatvori poruku">×</button>
  `;

  function ukloniPoruku() {
    poruka.classList.add("is-hiding");
    window.setTimeout(function () {
      poruka.remove();
    }, 220);
  }

  poruka.querySelector("button").addEventListener("click", ukloniPoruku);
  container.appendChild(poruka);

  if (trajanje > 0) window.setTimeout(ukloniPoruku, trajanje);
}

function messageDanger(htmlPoruka) {
  prikaziPoruku("error", "Greška", htmlPoruka);
}

function dialogSuccess(htmlPoruka) {
  prikaziPoruku("success", "Rezervacija je evidentirana", htmlPoruka, 7500);
}

function postaviApiPoruku(html) {
  if (document.getElementById("poruke")) {
    document.getElementById("poruke").innerHTML = html;
  }
}

/* -------------------------------------------------------------------------- */
/* Pripremljeno: preuzimanje i osnovni prikaz ponuda                          */
/* -------------------------------------------------------------------------- */

async function k1_preuzmi() {
  const destinacije = document.getElementById("destinacije");
  if (!destinacije) return;

  globalPodaci = [];
  odabranoPutovanje = null;
  postaviApiPoruku("");

  destinacije.innerHTML = `
    <div class="loading-card">
      <span class="loading-spinner" aria-hidden="true"></span>
      <div>
        <strong>Učitavanje ponuda...</strong>
        <p>Podaci se preuzimaju sa WRD API-ja.</p>
      </div>
    </div>
  `;

  try {
    const odgovor = await fetch(API_PONUDE, { cache: "no-store" });
    if (!odgovor.ok) throw new Error(`API status ${odgovor.status}`);

    const body = await odgovor.json();
    globalPodaci = Array.isArray(body.podaci) ? body.podaci : [];

    if (globalPodaci.length === 0) {
      destinacije.innerHTML = `
        <div class="empty-state">
          <strong>Trenutno nema dostupnih ponuda.</strong>
          <p>API nije vratio nijednu destinaciju.</p>
        </div>
      `;
      return;
    }

    prikaziDestinacije(globalPodaci);
    azurirajBrojRezultata(globalPodaci.length);
    postaviApiPoruku(`
      <div class="api-status api-status-success">
        <span></span>
        Učitano je ${globalPodaci.length} ponuda sa API-ja.
      </div>
    `);
  } catch (greska) {
    console.error("Greška pri preuzimanju ponuda:", greska);
    destinacije.innerHTML = `
      <div class="empty-state error-state">
        <strong>Ponude nisu učitane.</strong>
        <p>Provjeri internet konekciju i pokreni stranicu preko Live Servera.</p>
        <button type="button" onclick="k1_preuzmi()">Pokušaj ponovo</button>
      </div>
    `;
    postaviApiPoruku(
      '<div class="api-status api-status-error">API trenutno nije dostupan.</div>',
    );
    messageDanger("Greška pri učitavanju ponuda sa API-ja.");
  }
}

function prikaziDestinacije(podaci) {
  const destinacije = document.getElementById("destinacije");
  if (!destinacije) return;

  if (!Array.isArray(podaci) || podaci.length === 0) {
    destinacije.innerHTML = `
      <div class="empty-state">
        <strong>Nema ponuda koje odgovaraju pretrazi.</strong>
        <p>Promijeni tekstualni pojam ili minimalan broj noćenja.</p>
      </div>
    `;
    return;
  }

  destinacije.innerHTML = podaci
    .map(function (ponuda) {
      const originalIndex = globalPodaci.indexOf(ponuda);
      const naredniPolazak = ponuda.naredniPolazak || {};
      const gradovi = Array.isArray(ponuda.boravakGradovi)
        ? ponuda.boravakGradovi
        : [];

      let ukupnoNocenja = 0;
      let gradoviHtml = "";

      for (let i = 0; i < gradovi.length; i++) {
        ukupnoNocenja += Number(gradovi[i].brojNocenja);
        gradoviHtml += `
          <span class="city-chip">
            ${gradovi[i].nazivGrada} · ${gradovi[i].brojNocenja} noći
          </span>
        `;
      }

      const akcijaHtml = ponuda.akcijaPoruka
        ? `<span class="offer-sale">${ponuda.akcijaPoruka}</span>`
        : "";

      return `
        <article class="destination-card" data-destination-index="${originalIndex}">
          <div class="destination-image-wrap">
            <img
              src="${ponuda.slikaUrl}"
              alt="${ponuda.drzava}"
              loading="lazy"
              onerror="this.closest('.destination-image-wrap').classList.add('image-error'); this.remove();"
            />
            ${akcijaHtml}
          </div>

          <div class="destination-content">
            <div class="destination-title-row">
              <div>
                <span class="destination-kicker">Ponuda #${ponuda.id}</span>
                <h3>${ponuda.drzava}</h3>
              </div>
              <span class="destination-arrow">↗</span>
            </div>

            <p class="destination-description">${ponuda.opisPonude}</p>
            <div class="offer-cities">${gradoviHtml}</div>

            <div class="offer-info-grid four-items">
              <div>
                <span>Polazak</span>
                <strong>${naredniPolazak.datumPol || "Nije objavljeno"}</strong>
              </div>
              <div>
                <span>Slobodna mjesta</span>
                <strong>${naredniPolazak.countSlobodnoMjesta ?? 0}</strong>
              </div>
              <div>
                <span>Ukupno noćenja</span>
                <strong>${ukupnoNocenja}</strong>
              </div>
              <div>
                <span>Cijena po osobi</span>
                <strong>${Number(naredniPolazak.cijenaPoOsobiEur).toFixed(2)} €</strong>
              </div>
            </div>

            <button
              class="choose-offer-button"
              type="button"
              onclick="k2_odaberiDestinaciju(${originalIndex})"
            >
              Prikaži termine
              <span>→</span>
            </button>
          </div>
        </article>
      `;
    })
    .join("");
}

/* -------------------------------------------------------------------------- */
/* Z1 — filtriranje ponuda                                                     */
/* -------------------------------------------------------------------------- */

function primijeniFiltere() {
  let trazeniPojam = document.getElementById("pretraga-pojam").value.toLowerCase();
  let minNocenja = parseInt(document.getElementById("filterNocenja").value);

  var filtriraniPodaci = globalPodaci.filter(ponuda=>{
    let sumNocenja=0;
    let matchTekst = false;

    for(let i = 0;i<ponuda.boravakGradovi.length;i++){
      sumNocenja+=ponuda.boravakGradovi[i].brojNocenja;
      if(ponuda.boravakGradovi[i].nazivGrada.toLowerCase().includes(trazeniPojam))
        matchTekst=true;
    }
    if(ponuda.drzava.toLowerCase().includes(trazeniPojam))matchTekst=true;
    if(ponuda.opisPonude.toLowerCase().incniPojludes(trazeam))matchTekst=true;
    if(trazeniPojam==="") matchTekst=true;
    return matchTekst && sumNocenja>=minNocenja;
  });
  prikaziDestinacije(filtriraniPodaci);
  azurirajBrojRezultata(filtriraniPodaci.length);
}

function azurirajBrojRezultata(broj) {
    let text = broj + " ponuda";
    document.getElementById("rezultatiBroj").innerHTML=text;

}

/* -------------------------------------------------------------------------- */
/* Pripremljeno: osnovni prikaz termina                                        */
/* -------------------------------------------------------------------------- */

function k2_odaberiDestinaciju(indexPonude) {
  const ponuda = globalPodaci[indexPonude];
  const tabela = document.getElementById("putovanjaTabela");

  if (!ponuda || !tabela) {
    messageDanger("Odabrana ponuda nije pronađena.");
    return;
  }

  odabranoPutovanje = null;

  document.querySelectorAll(".destination-card").forEach(function (kartica) {
    kartica.classList.remove("selected-card");
  });
  document
    .querySelector(`[data-destination-index="${indexPonude}"]`)
    ?.classList.add("selected-card");

  document.getElementById("brojOdraslih").value = "";
  document.getElementById("brojDjece").value = "0";
  document.getElementById("ukupnoPutnika").value = "";
  document.getElementById("ukupnaCijena").value = "";
  document.getElementById("gosti").innerHTML =
    '<div class="guest-info">Odaberi termin, zatim unesi broj odraslih i djece.</div>';

  const putovanja = Array.isArray(ponuda.planiranaPutovanja)
    ? ponuda.planiranaPutovanja
    : [];

  if (putovanja.length === 0) {
    tabela.innerHTML =
      '<tr><td colspan="7">Za ovu destinaciju nema planiranih putovanja.</td></tr>';
    return;
  }

  tabela.innerHTML = putovanja
    .map(function (putovanje, indexPutovanja) {
      const slobodnaMjesta = Number(putovanje.countSlobodnoMjesta);
      const popunjeno = slobodnaMjesta <= 0;
      
      let pol = putovanje.datumPol.split('.');
      let pov = putovanje.datumPov.split('.');
      let datumPolaska = new Date(pol[2],pol[1]-1,pol[0]);
      let datumPovratka = new Date(pov[2],pov[1]-1,pov[0]);
      let brojDana = Math.round((datumPovratka-datumPolaska)/(1000*60*60*24));
      let trajanje = brojDana+ " dana";


      return `
        <tr id="putovanje-red-${indexPutovanja}">
          <td><strong>#${putovanje.idPutovanje}</strong></td>
          <td>${putovanje.datumPol}</td>
          <td>${putovanje.datumPov}</td>
          <td>${trajanje}</td>
          <td>
            <span class="seats-badge ${popunjeno ? "sold-out" : ""}">
              ${slobodnaMjesta}
            </span>
          </td>
          <td><strong>${Number(putovanje.cijenaPoOsobiEur).toFixed(2)} €</strong></td>
          <td>
            <button
              type="button"
              ${popunjeno ? "disabled" : ""}
              onclick="k3_odaberiPutovanje(${indexPonude}, ${indexPutovanja})"
            >${popunjeno ? "Popunjeno" : "Odaberi"}</button>
          </td>
        </tr>
      `;
    })
    .join("");


}

/* -------------------------------------------------------------------------- */
/* Z2 — trajanje i odabir termina                                              */
/* -------------------------------------------------------------------------- */



function k3_odaberiPutovanje(indexPonude, indexPutovanja) {
  odabranoPutovanje = globalPodaci[indexPonude].planiranaPutovanja[indexPutovanja];
  let sviRedovi =document.querySelectorAll("#putovanjaTabela tr");
  for(let i =0;i<sviRedovi.length;i++){
    sviRedovi[i].style.backgroundColor="";
  }
  let kliknutiRed = document.getElementById("putovanje-red-" + indexPutovanja);
  kliknutiRed.style.backgroundColor=OkBackgroundColor;  


}

/* -------------------------------------------------------------------------- */
/* Z3 — odrasli, djeca, dinamička polja i cijena                              */
/* -------------------------------------------------------------------------- */

function k4_promjenaPutnika() {
  let greska = provjeriBrojPutnika();
  if(greska!==""){
    document.getElementById("ukupnoPutnika").value="";
    document.getElementById("ukupnaCijena").value="";
    gosti.innerHTML="";
    return;
  }
  let brojOdraslih=parseInt(document.getElementById("brojOdraslih").value);
  let brojDjece =parseInt(document.getElementById("brojDjece").value);
  document.getElementById("ukupnoPutnika").value=brojOdraslih+brojDjece;
  //Cijena: odrasli 100%, djeca 70%
  let cijenaPoOsobi = Number(odabranoPutovanje.cijenaPoOsobiEur);
  let ukupnaCijena = (brojOdraslih*cijenaPoOsobi)+(brojDjece*cijenaPoOsobi*0.7);
  document.getElementById("ukupnaCijena").value = ukupnaCijena.toFixed(2)+ " €";
  let stareVrijednosti = {};
  let trenutniInputi = document.querySelectorAll(".ime-putnika");
  for(let i =0;i<trenutniInputi.length;i++){
    stareVrijednosti[trenutniInputi[i].id]=trenutniInputi[i].value;
  }
  gosti.innerHTML="";
  for(let i =1;i<=brojOdraslih;i++){
    let id = "odrasli-"+i;
    let vrijednost = stareVrijednosti[id] || "";
    gosti.innerHTML+=`<input type="text" placeholder = "Odrasla osoba ${i}" class="ime-putnika"
    id="${id}" value="${vrijednost}" style="width:100%;margin-top:5px;border:1px solid ">`
  }
  for(let i =1;i<=brojDjece;i++){
    let id = "dijete"+i;
    let vrijednost = stareVrijednosti[id] || "";
    gosti.innerHTML+=`<input type="text" placeholder = "Dijete ${i}" class="ime-putnika"
    id="${id}" value="${vrijednost}" style="width:100%;margin-top:5px;border:1px solid ">`
  }
  

}

function provjeriBrojPutnika() {
  let brojOdraslih=parseInt(document.getElementById("brojOdraslih").value);
  let brojDjece =parseInt(document.getElementById("brojDjece").value);

  if(isNaN(brojOdraslih)||brojOdraslih<1)return "Mora postojati barem jedna odrasla osoba!";
  if(isNaN(brojDjece)||brojDjece < 0 )return "Broj djece ne može biti negativan.";
  let ukupno = brojOdraslih+brojDjece;
  if(ukupno<2||ukupno>5)return "Ukupan broj putnika mora biti od 2 do 5.";
  if(ukupno>odabranoPutovanje.countSlobodnoMjesta)return "Nema dovoljno slobodnih mjesta.";
  return "";
}


/* -------------------------------------------------------------------------- */
/* Z4 — frontend validacija                                                    */
/* -------------------------------------------------------------------------- */

function provjeriPasos() {
  var idInput = document.getElementById("brojPasosa");
  var idTekst = idInput.value;
  var idRegex = /^BIH-\d{6}-[A-F]$/;
  if(!idRegex.test(idTekst)){
    idInput.style.backgroundColor=ErrorBackgroundColor;
    return "Validacija ID-a nije ispravna. Format ID-a treba biti formata BIH-123456-A <br>";

  }else{
    idInput.style.backgroundColor=OkBackgroundColor;
    return "";
  }
}

function provjeriEmail() {
  var emailInput = document.getElementById("email");
  var emailTekst = emailInput.value;
  var emailRegex = /^[a-z]{2,}\.[a-z]{2,}\d{0,2}@(travel\.ba|fit\.ba)$/;
  if(!emailRegex.test(emailTekst)){
    emailInput.style.backgroundColor=ErrorBackgroundColor;
    return "Validacija email-a nije ispravna. Format email-a treba biti ime.prezime@travel.ba ili ime.prezime12@fit.ba <br>";

  }else{
    emailInput.style.backgroundColor=OkBackgroundColor;
    return "";
  }
}

// DODANO U VERZIJI ZA VJEŽBU — ovaj primjer nije bio u starter projektu
// korištenom na ispitu 15.07.2026. Primjer pokazuje upotrebu regexa i .test().
//
// function provjeriBrojTelefona() {
//   let phone = document.getElementById("phone");
//
//   if (!/^\+387 6[0-9] \d{3} \d{3}$/.test(phone.value)) {
//     phone.style.backgroundColor = ErrorBackgroundColor;
//     return "Telefon mora biti u formatu: +387 61 123 456\n";
//   } else {
//     phone.style.backgroundColor = OkBackgroundColor;
//     return "";
//   }
// }

/* -------------------------------------------------------------------------- */
/* Z5 — kreiranje objekta i slanje rezervacije                                */
/* -------------------------------------------------------------------------- */

function kreirajObjekatRezervacije() {
  let imenaGostijuNiz = [];
  let tipoviPutnikaNiz = [];
  let sviInputi = document.querySelectorAll(".ime-putnika");
  
  for(let i = 0; i < sviInputi.length; i++){
    imenaGostijuNiz.push(sviInputi[i].value);
    let tip = sviInputi[i].id.includes("odrasli") ? "Odrasla osoba" : "Dijete";
    tipoviPutnikaNiz.push(tip); 
  }
  let offerNaslov = document.querySelector(".selected-card h3");
  let nazivDestinacije = offerNaslov.innerText;


  let obj = {
    putovanjeId: odabranoPutovanje.idPutovanje.toString(),
    destinacijaNaziv:nazivDestinacije,
    datumPolazak: odabranoPutovanje.datumPol,
    cijenaTotal: parseInt(document.getElementById("ukupnaCijena").value),
    imenaGostiju: imenaGostijuNiz,
    brojPasos: document.getElementById("brojPasosa").value,
    emailAdress:document.getElementById("email").value,
    telefon: document.getElementById("phone").value,
    brojOdraslih: parseInt(document.getElementById("brojOdraslih").value),
    tipoviPutnika: tipoviPutnikaNiz
  }
  return obj;
}

function k5_posalji() {
  let frontendGreskeValidacije = "";
  frontendGreskeValidacije+=provjeriBrojPutnika();
  frontendGreskeValidacije+=provjeriPasos();
  frontendGreskeValidacije+=provjeriEmail();

  // TODO Z5:
  // - pozvati sve frontend validacije;
  // - spojiti njihove poruke u frontendGreskeValidacije;
  // - blokirati POST ako postoji barem jedna greška.

  if (frontendGreskeValidacije !== "") {
    messageDanger(
      "Frontend validacija:<br><br>" +
        frontendGreskeValidacije.replace(/\n/g, "<br>"),
    );
    return;
  }

  const jsObjekat = kreirajObjekatRezervacije();

  fetch(API_REZERVACIJE, {
    method: "POST",
    body: JSON.stringify(jsObjekat),
    headers: {
      "Content-Type": "application/json",
    },
  })
    .then(function (res) {
      return res.json();
    })
    .then(function (body) {
      if (body.brojGresaka === 0) {
        dialogSuccess(
          "Uspješno kreirana rezervacija sa brojem: " + body.idRezervacije,
        );
      } else {
        const backendGreskeValidacije = Array.isArray(body.spisakGresaka)
          ? body.spisakGresaka.join("<br>")
          : "API je odbio poslane podatke.";

        messageDanger(
          "Backend validacija: Poslati JSON podaci nisu ispravni.<br><br>" +
            backendGreskeValidacije,
        );
      }
    })
    .catch(function () {
      messageDanger("Greška pri slanju rezervacije.");
    });
}

document.addEventListener("DOMContentLoaded", k1_preuzmi);
