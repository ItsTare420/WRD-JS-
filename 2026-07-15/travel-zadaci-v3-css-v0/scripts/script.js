/* -------------------------------------------------------------------------- */
/* API putanje i globalne varijable                                           */
/* -------------------------------------------------------------------------- */

const API_PONUDE = "https://wrd-api.fit.ba/Ispit20250712/GetNovePonude";
const API_REZERVACIJE = "https://wrd-api.fit.ba/Ispit20250712/Dodaj";

let globalPodaci = [];
let odabranoPutovanje = null;

let ErrorBackgroundColor = "#FE7D7D";
let OkBackgroundColor = "#DFF6D8";

/* -------------------------------------------------------------------------- */
/* Pripremljene poruke                                                        */
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

  let poruka = document.createElement("div");
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
  let destinacije = document.getElementById("destinacije");
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
    let odgovor = await fetch(API_PONUDE, { cache: "no-store" });
    if (!odgovor.ok) throw new Error(`API status ${odgovor.status}`);

    let body = await odgovor.json();
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
    postaviApiPoruku('<div class="api-status api-status-error">API trenutno nije dostupan.</div>');
    messageDanger("Greška pri učitavanju ponuda sa API-ja.");
  }
}

function prikaziDestinacije(podaci) {
  let destinacije = document.getElementById("destinacije");
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

  let htmlIspis = "";

  for (let i = 0; i < podaci.length; i++) {
    let ponuda = podaci[i];
    let originalIndex = globalPodaci.indexOf(ponuda);
    let naredniPolazak = ponuda.naredniPolazak || {};
    let gradovi = Array.isArray(ponuda.boravakGradovi) ? ponuda.boravakGradovi : [];

    let ukupnoNocenja = 0;
    let gradoviHtml = "";

    for (let j = 0; j < gradovi.length; j++) {
      ukupnoNocenja += Number(gradovi[j].brojNocenja);
      gradoviHtml += `
        <span class="city-chip">
          ${gradovi[j].nazivGrada} · ${gradovi[j].brojNocenja} noći
        </span>
      `;
    }

    let akcijaHtml = ponuda.akcijaPoruka ? `<span class="offer-sale">${ponuda.akcijaPoruka}</span>` : "";
    let cijenaFix = Number(naredniPolazak.cijenaPoOsobiEur).toFixed(2);

    htmlIspis += `
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
              <strong>${cijenaFix} €</strong>
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
  }

  destinacije.innerHTML = htmlIspis;
}

/* -------------------------------------------------------------------------- */
/* Z1 — filtriranje ponuda                                                    */
/* -------------------------------------------------------------------------- */

function primijeniFiltere() {
  let trazeniPojam = document.getElementById("pretraga-pojam").value.toLowerCase();
  let minNocenja = parseInt(document.getElementById("filterNocenja").value) || 0;

  let filtriraniPodaci = globalPodaci.filter(ponuda => {
    let sumNocenja = 0;
    let matchTekst = false;
    
    // Sabiranje noćenja i provjera naziva gradova
    for (let i = 0; i < ponuda.boravakGradovi.length; i++) {
      sumNocenja += ponuda.boravakGradovi[i].brojNocenja;
      if (ponuda.boravakGradovi[i].nazivGrada.toLowerCase().includes(trazeniPojam)) {
        matchTekst = true;
      }
    }

    // Provjera države i opisa
    if (ponuda.drzava.toLowerCase().includes(trazeniPojam)) matchTekst = true;
    if (ponuda.opisPonude.toLowerCase().includes(trazeniPojam)) matchTekst = true;
    
    // Ako je pretraga prazna, preskačemo tekstualni filter
    if (trazeniPojam === "") matchTekst = true;

    return matchTekst && sumNocenja >= minNocenja;
  });

  prikaziDestinacije(filtriraniPodaci);
  azurirajBrojRezultata(filtriraniPodaci.length);
}

function azurirajBrojRezultata(broj) {
  let text = broj === 1 ? "1 ponuda" : broj + " ponuda";
  document.getElementById("rezultatiBroj").innerHTML = text;
}

/* -------------------------------------------------------------------------- */
/* Z2 — Prikaz tabele termina, računanje trajanja (Z2) i odabir               */
/* -------------------------------------------------------------------------- */

function k2_odaberiDestinaciju(indexPonude) {
  let ponuda = globalPodaci[indexPonude];
  let tabela = document.getElementById("putovanjaTabela");

  if (!ponuda || !tabela) {
    messageDanger("Odabrana ponuda nije pronađena.");
    return;
  }

  odabranoPutovanje = null;

  // Ukloni staru selekciju na karticama
  let kartice = document.querySelectorAll(".destination-card");
  for (let i = 0; i < kartice.length; i++) {
    kartice[i].classList.remove("selected-card");
  }
  
  // Oznaci kliknutu karticu
  let odabranaKartica = document.querySelector(`[data-destination-index="${indexPonude}"]`);
  if (odabranaKartica) odabranaKartica.classList.add("selected-card");

  // Reset inputa na desnoj strani
  document.getElementById("brojOdraslih").value = "";
  document.getElementById("brojDjece").value = "0";
  document.getElementById("ukupnoPutnika").value = "";
  document.getElementById("ukupnaCijena").value = "";
  document.getElementById("gosti").innerHTML =
    '<div class="guest-info">Odaberi termin, zatim unesi broj odraslih i djece.</div>';

  let putovanja = Array.isArray(ponuda.planiranaPutovanja) ? ponuda.planiranaPutovanja : [];

  if (putovanja.length === 0) {
    tabela.innerHTML = '<tr><td colspan="7">Za ovu destinaciju nema planiranih putovanja.</td></tr>';
    return;
  }

  let htmlRedovi = "";

  for (let i = 0; i < putovanja.length; i++) {
    let putovanje = putovanja[i];
    let slobodnaMjesta = Number(putovanje.countSlobodnoMjesta);
    let popunjeno = slobodnaMjesta <= 0;

    // Izračun trajanja putovanja (Z2)
    let trajanje = "—";
    if (putovanje.datumPol && putovanje.datumPov) {
      let pPol = putovanje.datumPol.split('.');
      let pPov = putovanje.datumPov.split('.');
      
      if (pPol.length === 3 && pPov.length === 3) {
        let dPol = new Date(pPol[2], pPol[1] - 1, pPol[0]);
        let dPov = new Date(pPov[2], pPov[1] - 1, pPov[0]);
        let diffDana = Math.round((dPov - dPol) / (1000 * 60 * 60 * 24));
        if (diffDana > 0) trajanje = diffDana + " dana";
      }
    }

    let cijenaFormat = Number(putovanje.cijenaPoOsobiEur).toFixed(2);
    let disabledAttr = popunjeno ? "disabled" : "";
    let btnText = popunjeno ? "Popunjeno" : "Odaberi";
    let soldOutClass = popunjeno ? "sold-out" : "";

    htmlRedovi += `
      <tr id="putovanje-red-${i}">
        <td><strong>#${putovanje.idPutovanje}</strong></td>
        <td>${putovanje.datumPol}</td>
        <td>${putovanje.datumPov}</td>
        <td>${trajanje}</td>
        <td>
          <span class="seats-badge ${soldOutClass}">${slobodnaMjesta}</span>
        </td>
        <td><strong>${cijenaFormat} €</strong></td>
        <td>
          <button type="button" ${disabledAttr} onclick="k3_odaberiPutovanje(${indexPonude}, ${i})">${btnText}</button>
        </td>
      </tr>
    `;
  }

  tabela.innerHTML = htmlRedovi;
}

function k3_odaberiPutovanje(indexPonude, indexPutovanja) {
  odabranoPutovanje = globalPodaci[indexPonude].planiranaPutovanja[indexPutovanja];

  // Sklanjanje markera sa svih redova
  let sviRedovi = document.querySelectorAll("#putovanjaTabela tr");
  for (let i = 0; i < sviRedovi.length; i++) {
    sviRedovi[i].style.backgroundColor = "";
  }

  // Postavljanje markera na odabrani
  document.getElementById("putovanje-red-" + indexPutovanja).style.backgroundColor = OkBackgroundColor;

  // Osvežavanje unosa putnika za novu cijenu
  k4_promjenaPutnika();
}

/* -------------------------------------------------------------------------- */
/* Z3 — Odrasli, djeca, dinamička polja i cijena                              */
/* -------------------------------------------------------------------------- */

function provjeriBrojPutnika() {
  if (!odabranoPutovanje) return "Odaberi termin iz tabele.<br>";

  let brojOdraslih = parseInt(document.getElementById("brojOdraslih").value);
  let brojDjece = parseInt(document.getElementById("brojDjece").value);

  if (isNaN(brojOdraslih) || brojOdraslih < 1) return "Mora postojati barem 1 odrasla osoba.<br>";
  if (isNaN(brojDjece) || brojDjece < 0) return "Broj djece ne može biti negativan.<br>";

  let ukupno = brojOdraslih + brojDjece;
  if (ukupno < 2 || ukupno > 5) return "Ukupan broj putnika mora biti od 2 do 5.<br>";
  if (ukupno > odabranoPutovanje.countSlobodnoMjesta) return "Nema dovoljno slobodnih mjesta.<br>";

  return "";
}

function k4_promjenaPutnika() {
  let greska = provjeriBrojPutnika();
  let gostiDiv = document.getElementById("gosti");

  if (greska !== "") {
    document.getElementById("ukupnoPutnika").value = "";
    document.getElementById("ukupnaCijena").value = "";
    gostiDiv.innerHTML = `<div style="color:red; font-weight:bold;">${greska}</div>`;
    return;
  }

  let brojOdraslih = parseInt(document.getElementById("brojOdraslih").value);
  let brojDjece = parseInt(document.getElementById("brojDjece").value);
  
  document.getElementById("ukupnoPutnika").value = brojOdraslih + brojDjece;

  // Cijena: odrasli 100%, djeca 70%
  let cijenaPoOsobi = Number(odabranoPutovanje.cijenaPoOsobiEur);
  let ukupnaCijena = (brojOdraslih * cijenaPoOsobi) + (brojDjece * cijenaPoOsobi * 0.7);
  document.getElementById("ukupnaCijena").value = ukupnaCijena.toFixed(2) + " €";

  // Spasavanje starih vrijednosti iz inputa
  let stareVrijednosti = {};
  let trenutniInputi = document.querySelectorAll(".ime-putnika");
  for (let i = 0; i < trenutniInputi.length; i++) {
    stareVrijednosti[trenutniInputi[i].id] = trenutniInputi[i].value;
  }

  gostiDiv.innerHTML = ""; // Brisanje i ponovno iscrtavanje

  // Iscrtavanje odraslih
  for (let i = 1; i <= brojOdraslih; i++) {
    let id = "odrasli-" + i;
    let vrijednost = stareVrijednosti[id] || "";
    gostiDiv.innerHTML += `
      <div style="background-color: #eefaf6; padding: 10px; margin-bottom: 10px; border-radius: 8px; border: 1px solid #c2e5d9; display: flex; align-items: center;">
        <div style="background:#0f2742; color:#fff; width:36px; height:36px; display:flex; align-items:center; justify-content:center; border-radius:6px; margin-right:10px; font-weight:bold;">O</div>
        <div style="flex-grow:1;">
          <strong style="color: #173a5e; font-size:12px;">Odrasla osoba ${i}</strong>
          <input type="text" id="${id}" class="ime-putnika" value="${vrijednost}" placeholder="Ime i prezime" style="width:100%; margin-top:4px; padding:8px; border:1px solid #dfe6eb; border-radius:6px;">
        </div>
      </div>
    `;
  }

  // Iscrtavanje djece
  for (let i = 1; i <= brojDjece; i++) {
    let id = "dijete-" + i;
    let vrijednost = stareVrijednosti[id] || "";
    gostiDiv.innerHTML += `
      <div style="background-color: #fff5eb; padding: 10px; margin-bottom: 10px; border-radius: 8px; border: 1px solid #fce3d0; display: flex; align-items: center;">
        <div style="background:#ff8a4c; color:#fff; width:36px; height:36px; display:flex; align-items:center; justify-content:center; border-radius:6px; margin-right:10px; font-weight:bold;">D</div>
        <div style="flex-grow:1;">
          <strong style="color: #ff8a4c; font-size:12px;">Dijete ${i}</strong>
          <input type="text" id="${id}" class="ime-putnika" value="${vrijednost}" placeholder="Ime i prezime" style="width:100%; margin-top:4px; padding:8px; border:1px solid #dfe6eb; border-radius:6px;">
        </div>
      </div>
    `;
  }
}

/* -------------------------------------------------------------------------- */
/* Z4 — Frontend validacija                                                   */
/* -------------------------------------------------------------------------- */

function provjeriPasos() {
  let pasosInput = document.getElementById("brojPasosa");
  let regex = /^BIH-\d{6}-[A-F]$/;
  
  if (!regex.test(pasosInput.value)) {
    pasosInput.style.backgroundColor = ErrorBackgroundColor;
    return "Identifikacioni dokument mora biti u formatu BIH-123456-A<br>";
  } else {
    pasosInput.style.backgroundColor = OkBackgroundColor;
    return "";
  }
}

function provjeriEmail() {
  let emailInput = document.getElementById("email");
  let regex = /^[a-z]{2,}\.[a-z]{2,}\d{0,2}@(travel\.ba|fit\.ba)$/;
  
  if (!regex.test(emailInput.value)) {
    emailInput.style.backgroundColor = ErrorBackgroundColor;
    return "Neispravna email adresa (potrebno ime.prezime12@travel.ba ili fit.ba).<br>";
  } else {
    emailInput.style.backgroundColor = OkBackgroundColor;
    return "";
  }
}

/* -------------------------------------------------------------------------- */
/* Z5 — Kreiranje objekta i slanje rezervacije                                */
/* -------------------------------------------------------------------------- */

function kreirajObjekatRezervacije() {
  let imenaGostijuNiz = [];
  let sviInputi = document.querySelectorAll(".ime-putnika");
  
  for (let i = 0; i < sviInputi.length; i++) {
    let tip = sviInputi[i].id.includes("odrasli") ? "Odrasla osoba" : "Dijete";
    imenaGostijuNiz.push({
      imePrezime: sviInputi[i].value,
      tipPutnika: tip
    });
  }

  let obj = {
    idPutovanje: odabranoPutovanje ? odabranoPutovanje.idPutovanje : null,
    brojPasosa: document.getElementById("brojPasosa").value,
    email: document.getElementById("email").value,
    telefon: document.getElementById("phone").value,
    brojOdraslih: parseInt(document.getElementById("brojOdraslih").value) || 0,
    brojDjece: parseInt(document.getElementById("brojDjece").value) || 0,
    cijenaTotal: parseFloat(document.getElementById("ukupnaCijena").value) || 0,
    gosti: imenaGostijuNiz
  };
  
  return obj;
}

function k5_posalji() {
  let greske = "";
  
  greske += provjeriBrojPutnika();
  greske += provjeriPasos();
  greske += provjeriEmail();

  if (greske !== "") {
    messageDanger("Frontend validacija:<br><br>" + greske);
    return;
  }

  let jsObjekat = kreirajObjekatRezervacije();

  fetch(API_REZERVACIJE, {
    method: "POST",
    body: JSON.stringify(jsObjekat),
    headers: {
      "Content-Type": "application/json",
    },
  })
    .then(res => res.json())
    .then(body => {
      if (body.brojGresaka === 0) {
        dialogSuccess("Uspješno kreirana rezervacija sa brojem: " + body.idRezervacije);
      } else {
        let textGreske = Array.isArray(body.spisakGresaka) ? body.spisakGresaka.join("<br>") : "API je odbio podatke.";
        messageDanger("Backend greške:<br>" + textGreske);
      }
    })
    .catch(() => {
      messageDanger("Greška pri slanju rezervacije. Provjerite internet konekciju.");
    });
}

// Pokretanje učitavanja pri pokretanju stranice
document.addEventListener("DOMContentLoaded", k1_preuzmi);