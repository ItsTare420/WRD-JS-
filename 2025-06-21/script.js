let globalPodaci = [];
let odabranoPutovanjeId = null;

let ErrorBackgroundColor = '#FE7D7D';
let OkBackgroundColor = '#DFF6D8';

// -- A: Preuzimanje i inicijalni render --
let k1_preuzmi = () => {
  fetch(`https://wrd-api.fit.ba/Ispit20250621/GetNovePonude`).then((res) => {
    res.json().then((body) => {
      globalPodaci = body.podaci;
      renderDestinacije(globalPodaci);
    });
  });
};
k1_preuzmi();

let renderDestinacije = (niz) => {
  document.getElementById('destinacije').innerHTML = '';
  for (let i = 0; i < niz.length; i++) {
    // Čuvamo stvarni index iz originalnog niza kako bi k2 ispravno radio
    let stvarniIndex = globalPodaci.indexOf(niz[i]); 
    
    document.getElementById('destinacije').innerHTML += `
      <div class="best-offer-wrapper" id="offer-${stvarniIndex}">
        <div class="offer-akcija">${niz[i].akcijaPoruka}</div>
        <div class="best-offer">
          <div class="offer-header">
            <img src="${niz[i].slikaUrl}"/>
          </div>
          <div class="offer-content-wrapper">
          <div class="offer-content">
            <h2 class="offer-header">${niz[i].drzava}</h2>
            <p>${niz[i].opisPonude}</p>
            <div class="offer-date">
              <div>Datum polaska:</div>
              <div>${niz[i].naredniPolazak.datumPol}</div>
            </div>
            <div class="offer-price">
              <div>Cijena:</div>
              <div>${niz[i].naredniPolazak.cijenaPoOsobiEur}$</div>
            </div>
          </div>
          <div class="offer-button" onclick="k2_odaberiDestinaciju(${stvarniIndex}); zutiOkvir(${stvarniIndex})">K2 Odaberi ponudu</div>
          </div>
        </div>
      </div>`;
  }
};

// -- A: Funkcionalnost pretrage (Case insensitive) --
document.addEventListener("DOMContentLoaded", () => {
    const searchInput = document.querySelector(".search-bar input");
    if (searchInput) {
        searchInput.addEventListener("input", (e) => {
            let term = e.target.value.toLowerCase();
            let filtrirano = globalPodaci.filter(p => p.drzava.toLowerCase().includes(term));
            renderDestinacije(filtrirano);
        });
    }
});

function zutiOkvir(selectedIndex) {
    const allOffers = document.querySelectorAll('.best-offer-wrapper'); 
    allOffers.forEach((offerElement) => {
        if (offerElement.id === `offer-${selectedIndex}`) {
            offerElement.style.border = '3px solid yellow';
            offerElement.style.boxSizing = 'border-box';
        } else {
            offerElement.style.border = 'none'; 
        }
    });
}

// -- B: Odabir destinacije i tabele --
let k2_odaberiDestinaciju = (rb) => {
  let nizPutovanja = globalPodaci[rb].planiranaPutovanja;
  document.getElementById('destinacija').value = globalPodaci[rb].drzava;
  document.getElementById('putovanjaTabela').innerHTML = '';
  
  for (let i = 0; i < nizPutovanja.length; i++) {
    document.getElementById('putovanjaTabela').innerHTML += `
    <tr class="putovanje-red" id="putovanje-red-${i}" draggable="true" 
        data-idputovanja="${nizPutovanja[i].idPutovanje}" 
        data-drzava="${globalPodaci[rb].drzava}"
        data-datumpol="${nizPutovanja[i].datumPol}"
        data-cijena="${nizPutovanja[i].cijenaPoOsobiEur}">
      <td>${nizPutovanja[i].idPutovanje}</td>
      <td>${nizPutovanja[i].datumPol}</td>
      <td>${nizPutovanja[i].datumPov}</td>
      <td>${nizPutovanja[i].countSlobodnoMjesta}</td>
      <td>${nizPutovanja[i].cijenaPoOsobiEur}</td>
      <td><button onclick="k3_odaberiPutovanje('${nizPutovanja[i].idPutovanje}', '${globalPodaci[rb].drzava}', '${nizPutovanja[i].datumPol}', ${nizPutovanja[i].cijenaPoOsobiEur})">K3 Odaberi</button></td>
    </tr>
    `;
  }
};

// -- B: Odabir samog putovanja (Upisuje vrijednosti u text inpute) --
let k3_odaberiPutovanje = (idPutovanja, drzava, datumPol, cijena) => {
    odabranoPutovanjeId = idPutovanja;
    document.getElementById('destinacija').value = drzava;
    document.getElementById('datumPolaska').value = datumPol;
    document.getElementById('cijenaPoGostu').value = cijena;
    
    k4_promjenaBrojaGostiju(); 
};

// -- F: Drag and Drop --
document.addEventListener("dragstart", (e) => {
    if(e.target.classList.contains("putovanje-red")) {
        e.dataTransfer.setData("idPutovanja", e.target.getAttribute("data-idputovanja"));
        e.dataTransfer.setData("drzava", e.target.getAttribute("data-drzava"));
        e.dataTransfer.setData("datumPol", e.target.getAttribute("data-datumpol"));
        e.dataTransfer.setData("cijena", e.target.getAttribute("data-cijena"));
    }
});
let dragoverHandler = (e) => {
    e.preventDefault();
};
let dropHandler = (e) => {
    e.preventDefault();
    let idPutovanja = e.dataTransfer.getData("idPutovanja");
    let drzava = e.dataTransfer.getData("drzava");
    let datumPol = e.dataTransfer.getData("datumPol");
    let cijena = parseFloat(e.dataTransfer.getData("cijena"));
    if(idPutovanja) {
        k3_odaberiPutovanje(idPutovanja, drzava, datumPol, cijena);
    }
};

// -- C & D: Kreiranje inputa za goste i preračun cijene --
let k4_promjenaBrojaGostiju = () => {
    provjeriBrojGostiju(); 
    let gostiContainer = document.getElementById('gosti');
    gostiContainer.innerHTML = '';
    
    let elBroj = document.getElementById('brojGostiju');
    let brGostiju = parseInt(elBroj.value);
    let cijenaPoGostu = parseFloat(document.getElementById('cijenaPoGostu').value);
    
    if(!isNaN(brGostiju) && !isNaN(cijenaPoGostu)) {
        document.getElementById('ukupnaCijena').value = (brGostiju * cijenaPoGostu).toFixed(2);
    }

    if (!isNaN(brGostiju) && brGostiju > 0 && brGostiju <= 5) {
        for (let i = 0; i < brGostiju; i++) {
            gostiContainer.innerHTML += `
                <div style="margin-bottom: 5px;">
                    <label>Ime i prezime gosta ${i+1}:</label>
                    <input type="text" class="ime-gosta" placeholder="Unesite ime i prezime" style="width:100%" oninput="provjeriImenaGostiju()" />
                </div>
            `;
        }
    }
    provjeriImenaGostiju();
};

// -- D: Validacije --
let validateRegex = (element, regex) => {
    if (regex.test(element.value)) {
        element.style.backgroundColor = OkBackgroundColor;
        return true;
    } else {
        element.style.backgroundColor = ErrorBackgroundColor;
        return false;
    }
};

let provjeriBrojGostiju = () => {
    let el = document.getElementById('brojGostiju');
    let val = parseInt(el.value);
    if (val >= 2 && val <= 5) { // Pravilo iz zadatka D.1
        el.style.backgroundColor = OkBackgroundColor;
        return true;
    } else {
        el.style.backgroundColor = ErrorBackgroundColor;
        return false;
    }
};

let provjeriImenaGostiju = () => {
    let inputs = document.querySelectorAll('.ime-gosta');
    let allValid = true;
    // Dvije riječi A-Z, početno veliko, minimalno tri slova -> Zadatk D.2
    let regex = /^[A-Z][a-zA-Z]{2,}\s[A-Z][a-zA-Z]{2,}$/; 
    
    if(inputs.length === 0) return false;

    inputs.forEach(el => {
        if(!validateRegex(el, regex)) allValid = false;
    });
    return allValid;
};

let provjeriPasos = () => {
    let el = document.getElementById('brojPasosa');
    // Regex zadatak D.3
    return validateRegex(el, /^[A-Z]{3}[0-9][A-D]{2}[0-9]-[1-5]$/);
};

let provjeriEmail = () => {
    let el = document.getElementById('email');
    // Regex zadatak D.4
    return validateRegex(el, /^[a-zA-Z]+[._][a-zA-Z]+@(gmail\.com|edu\.fit\.ba)$/);
};


// -- E: Slanje na server --
let k5_posalji = () => {
  let greske = [];
  
  if (!provjeriBrojGostiju()) greske.push("Broj gostiju mora biti između 2 i 5.");
  if (!provjeriImenaGostiju()) greske.push("Ime i prezime putnika nije u validnom formatu.");
  if (!provjeriPasos()) greske.push("Broj pasoša nije validan.");
  if (!provjeriEmail()) greske.push("Email adresa nije validna.");
  if (!odabranoPutovanjeId) greske.push("Niste odabrali putovanje iz tabele (Kliknite 'K3 Odaberi' ili iskoristite Drag&Drop).");

  if (greske.length > 0) {
      alert("Sljedeći podaci nisu ispravni:\n\n- " + greske.join("\n- "));
      return;
  }

  let imena = [];
  document.querySelectorAll('.ime-gosta').forEach(input => imena.push(input.value));

  let jsObjekat = {
    "putovanjeID": odabranoPutovanjeId.toString(),
    "drzavaNaziv": document.getElementById('destinacija').value,
    "brojTelefona": document.getElementById('phone').value || "", 
    "datumPolaska": document.getElementById('datumPolaska').value,
    "cijenaUkupno": parseFloat(document.getElementById('ukupnaCijena').value) || 0,
    "gostiPutovanja": imena,
    "brojPasosa": document.getElementById('brojPasosa').value,
    "emailAdresa": document.getElementById('email').value,
    "datumVazenjaPasosa": document.getElementById('datumVazenjaPasosa').value || ""
  };

  fetch('https://wrd-api.fit.ba/Ispit20250621/Dodaj', {
    method: 'POST',
    body: JSON.stringify(jsObjekat), 
    headers: {
      'Content-Type': 'application/json',
    },
  }).then((res) => {
    res.json().then((body) => {
        if(body.idRezervacije) {
           dialogSuccess('Uspješno kreirana rezervacija sa brojem : ' + body.idRezervacije); 
        } else {
            alert("Došlo je do greške na serveru prilikom kreiranja rezervacije.");
        }
    });
  }).catch(err => alert("Mrežna greška."));
};