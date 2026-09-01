let globalPodaci = [];
let odabranoPutovanjeId = ""; 

let ErrorBackgroundColor = "#FE7D7D";
let OkBackgroundColor = "#DFF6D8";

let k1_preuzmi = () => {
  fetch(`https://wrd-api.fit.ba/Ispit20250920/GetNovePonude`)
    .then((res) => res.json())
    .then((body) => {
      globalPodaci = body.podaci;
      prikaziPonude(globalPodaci); 
    });
};
k1_preuzmi();

let prikaziPonude = (podaci) => {
  let destinacijeDiv = document.getElementById("destinacije");
  destinacijeDiv.innerHTML = "";
  for (let i = 0; i < podaci.length; i++) {
    let praviIndex = globalPodaci.indexOf(podaci[i]); 
    destinacijeDiv.innerHTML += `
      <div class="best-offer-wrapper">
        <div class="best-offer">
          <div class="offer-header">
            <h2 class="destinacija-counter">Destinacija ${praviIndex + 1}</h2>
            <div class="offer-details">
              <h2>${podaci[i].drzava}</h2>
              <div class="offer-date">
                <span>Datum polaska:</span>
                <span>${podaci[i].naredniPolazak.datumPol}</span>
              </div>
              <div class="offer-price">
                <span>Cijena:</span>
                <span>${podaci[i].naredniPolazak.cijenaPoOsobiEur}$</span>
              </div>
            </div>
          </div>
          <div class="offer-content-wrapper">
            <div class="offer-content">
              <img src="${podaci[i].slikaUrl}"/>
            </div>
            <button class="offer-button" onclick="k2_odaberiDestinaciju(${praviIndex})">K2 Odaberi ponudu</button>
          </div>
        </div>
      </div>`;
  }
};

let searchFunkcija = () => {
  let trazeniPojam = document.getElementById("searchbar-id").value.toLowerCase();
  
  let filtriraniPodaci = globalPodaci.filter(ponuda => {
    return ponuda.boravakGradovi.some(grad => 
      grad.nazivGrada.toLowerCase().includes(trazeniPojam)
    );
  });
  
  prikaziPonude(filtriraniPodaci);
};

let k2_odaberiDestinaciju = (rb) => {
  let nizPutovanja = globalPodaci[rb].planiranaPutovanja;
  document.getElementById("destinacijaInput").value = globalPodaci[rb].drzava;
  document.getElementById("putovanjaTabela").innerHTML = "";
  
  for (let i = 0; i < nizPutovanja.length; i++) {
    let brojMjesta = nizPutovanja[i].countSlobodnoMjesta;
    let stilZaRed = brojMjesta < 3 ? "background-color:#fe7d7d46;" : "";
    
    document.getElementById("putovanjaTabela").innerHTML += `
      <tr class="putovanje-red" id="putovanje-red-${i}" draggable="true" data-idputovanja="${nizPutovanja[i].idPutovanje}" data-drzava="${globalPodaci[rb].drzava}" style="${stilZaRed}">
        <td>${nizPutovanja[i].idPutovanje}</td>
        <td>${nizPutovanja[i].datumPol}</td>
        <td>${nizPutovanja[i].datumPov}</td>
        <td>${nizPutovanja[i].countSlobodnoMjesta}</td>
        <td>${nizPutovanja[i].cijenaPoOsobiEur}</td>
        <td><button onclick="k3_odaberiPutovanje('${nizPutovanja[i].idPutovanje}', '${globalPodaci[rb].drzava}', '${nizPutovanja[i].datumPol}', '${nizPutovanja[i].cijenaPoOsobiEur}')">K3 Odaberi</button></td>
      </tr>
      `;
  }
};

let k3_odaberiPutovanje = (id, drzava, datum, cijena) => {
  odabranoPutovanjeId = id;
  document.getElementById("destinacijaInput").value = drzava;
  document.getElementById("datumPolaskaInput").value = datum;
  document.getElementById("cijenaPoGostuInput").value = cijena;
  k4_promjenaBrojaGostiju();
};

let k4_promjenaBrojaGostiju = () => {
  let greska = provjeriBrojGostiju();
  let gostiDiv = document.querySelector(".gostiDiv");
  gostiDiv.innerHTML = "";

  if (greska !== "") return; 

  let brojGostiju = parseInt(document.getElementById("brojGostijuInput").value) || 0;
  let cijena = parseFloat(document.getElementById("cijenaPoGostuInput").value) || 0;
  let tipGosta = document.getElementById("tipGostaSelect").value;
  

  let ukupnaCijena = brojGostiju * cijena;
  if (tipGosta === "Djeca") {
    ukupnaCijena = ukupnaCijena - (ukupnaCijena * 0.30);
  }
  document.getElementById("ukupnaCijena").value = ukupnaCijena;


  for (let i = 0; i < brojGostiju; i++) {
    gostiDiv.innerHTML += `
      <input type="text" class="ime-gosta" placeholder="Ime gosta ${i + 1}" style="margin-bottom: 5px; display: block; width: 100%;">
    `;
  }
};

let provjeriBrojGostiju = () => { 
  let brGostiju = parseInt(document.getElementById("brojGostijuInput").value);
  let el = document.getElementById("brojGostijuInput");
  if(isNaN(brGostiju) || brGostiju < 2 || brGostiju > 5) {
    el.style.backgroundColor = ErrorBackgroundColor;
    return "Broj gostiju mora biti između 2 i 5.<br>";
  } else {
    el.style.backgroundColor = OkBackgroundColor;
    return "";
  }
};

let provjeriBrojPasosa = () => { 
  let pasos = document.getElementById("brojPasosaInput").value;
  let el = document.getElementById("brojPasosaInput");
  let regex = /^[A-Z][0-3]-?[a-g]{3}[0-9]{2}-[A-F]{2}$/; 
  if(!regex.test(pasos)) {
    el.style.backgroundColor = ErrorBackgroundColor;
    return "Neispravan broj pasoša.<br>";
  } else {
    el.style.backgroundColor = OkBackgroundColor;
    return "";
  }
};

let provjeriEmail = () => {
  let email = document.getElementById("emailInput").value;
  let el = document.getElementById("emailInput");
  let regex = /^[a-z]+[._]?[a-z]+@[a-z]+(\.[a-z]+)?\.[a-z]{2,}$/;
  if(!regex.test(email)) {
    el.style.backgroundColor = ErrorBackgroundColor;
    return "Neispravna email adresa.<br>";
  } else {
    el.style.backgroundColor = OkBackgroundColor;
    return "";
  }
}

let provjeriBrojTelefona = () => {
  if (!/^\d{3}-\d{3}-\d{3}$/.test(document.getElementById("phoneInput").value)) {
    document.getElementById("phoneInput").style.backgroundColor = ErrorBackgroundColor;
    return "Neispravan broj telefona<br>";
  } else {
    document.getElementById("phoneInput").style.backgroundColor = OkBackgroundColor;
    return "";
  }
};

let k5_posalji = () => {
  let frontendGreskeValidacije = ""; 

  frontendGreskeValidacije += provjeriBrojGostiju();
  frontendGreskeValidacije += provjeriBrojPasosa();
  frontendGreskeValidacije += provjeriEmail();
  frontendGreskeValidacije += provjeriBrojTelefona();
  
  if (odabranoPutovanjeId === "") {
    frontendGreskeValidacije += "Morate odabrati putovanje (K3).<br>";
  }

  if (frontendGreskeValidacije != "") {
    messageDanger("Frontend validacija: <br/><br/>" + frontendGreskeValidacije); 
    return;
  }


  let imena = [];
  let poljaGosti = document.querySelectorAll(".ime-gosta");
  poljaGosti.forEach(polje => imena.push(polje.value));

  let obj = {
    putovanjeBroj: odabranoPutovanjeId.toString(),
    destinacijaDrzava: document.getElementById("destinacijaInput").value,
    datumPolaska: document.getElementById("datumPolaskaInput").value,
    cijenaUkupno: parseFloat(document.getElementById("ukupnaCijena").value) || 0,
    imenaGostiju: imena,
    brojPasosa: document.getElementById("brojPasosaInput").value,
    tipGosta: document.getElementById("tipGostaSelect").value
  };

  fetch("https://wrd-api.fit.ba/Ispit20250920/Dodaj", {
    method: "POST",
    body: JSON.stringify(obj),
    headers: {
      "Content-Type": "application/json",
    },
  }).then((res) => {
    res.json().then((body) => {
      dialogSuccess("Uspješno kreirana rezervacija sa brojem : " + body.idRezervacije);
    });
  });
};

document.addEventListener("dragstart", (e) => {
  if (e.target.classList.contains("putovanje-red")) {
    e.dataTransfer.setData("text/plain", e.target.id);
  }
});

document.addEventListener("dragover", (e) => {
  e.preventDefault();
});

document.addEventListener("drop", (e) => {
  e.preventDefault();
  let rowId = e.dataTransfer.getData("text/plain");
  let row = document.getElementById(rowId);
  if (row) {
    let cells = row.getElementsByTagName("td");
    
    odabranoPutovanjeId = row.getAttribute("data-idputovanja");
    document.getElementById("destinacijaInput").value = row.getAttribute("data-drzava");
    document.getElementById("datumPolaskaInput").value = cells[1].innerText;
    document.getElementById("cijenaPoGostuInput").value = cells[4].innerText;
    
    k4_promjenaBrojaGostiju(); 

    bounceInput("datumPolaskaInput");
    bounceInput("cijenaPoGostuInput");
  }
});

function bounceInput(id) {
  let el = document.getElementById(id);
  el.classList.remove("bounce");
  void el.offsetWidth;
  el.classList.add("bounce");
  setTimeout(() => el.classList.remove("bounce"), 600);
}
