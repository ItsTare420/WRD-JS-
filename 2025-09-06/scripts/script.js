let globalPodaci = [];
let trenutnoPrikazaniPodaci = [];
let odabranoPutovanje = null;

let ErrorBackgroundColor = "#FE7D7D";
let OkBackgroundColor = "#DFF6D8";

let k1_preuzmi = () => {
  fetch("https://wrd-api.fit.ba/Ispit20250712/GetNovePonude")
    .then((res) => res.json())
    .then((body) => {
      globalPodaci = body.podaci;
      trenutnoPrikazaniPodaci = globalPodaci;
      renderPodaci(trenutnoPrikazaniPodaci);
    });
};
k1_preuzmi();

let renderPodaci = (niz) => {
  trenutnoPrikazaniPodaci = niz;
  let container = document.getElementById("destinacije");
  container.innerHTML = "";

  for (let i = 0; i < niz.length; i++) {
    container.innerHTML += `
      <div class="best-offer-wrapper">
        <div class="best-offer">
          <div class="offer-header">
            <h2 class="destinacija-counter">Destinacija ${i + 1}</h2>
            <div class="offer-details">
              <h2>${niz[i].drzava}</h2>
              <div class="offer-date">
                <span>Datum polaska:</span>
                <span>${niz[i].naredniPolazak.datumPol}</span>
              </div>
              <div class="offer-price">
                <span>Cijena:</span>
                <span>${niz[i].naredniPolazak.cijenaPoOsobiEur}$</span>
              </div>
            </div>
          </div>
          <div class="offer-content-wrapper">
            <div class="offer-content">
              <img />
            </div>
            <div class="offer-button" onclick="k2_odaberiDestinaciju(${i})">K2 Odaberi ponudu</div>
          </div>
        </div>
      </div>`;
  }
};

let k2_odaberiDestinaciju = (rb) => {
  let odabranaPonuda = trenutnoPrikazaniPodaci[rb];
  let nizPutovanja = odabranaPonuda.planiranaPutovanja;

  document.getElementById("destinacija").value = odabranaPonuda.drzava;
  let tbody = document.getElementById("putovanjaTabela");
  tbody.innerHTML = "";

  for (let i = 0; i < nizPutovanja.length; i++) {
    tbody.innerHTML += `
      <tr class="putovanje-red" id="putovanje-red-${i}">
        <td>${nizPutovanja[i].idPutovanje}</td>
        <td>${nizPutovanja[i].datumPol}</td>
        <td>${nizPutovanja[i].datumPov}</td>
        <td>${nizPutovanja[i].countSlobodnoMjesta}</td>
        <td>${nizPutovanja[i].cijenaPoOsobiEur}</td>
        <td>
          <button onclick="k3_odaberiPutovanje('${nizPutovanja[i].datumPol}', ${nizPutovanja[i].cijenaPoOsobiEur}, ${nizPutovanja[i].idPutovanje})">
            K3 Odaberi
          </button>
        </td>
      </tr>
    `;
  }
};

let pretraga = () => {
  let text = document.getElementById("pretraga-pojam").value.toLowerCase();
  let filtriraniPodaci = globalPodaci.filter((ponuda) =>
    ponuda.drzava.toLowerCase().includes(text)
  );
  renderPodaci(filtriraniPodaci);
};

let k3_odaberiPutovanje = (datumpolaska, cijenapogostu, idPutovanje) => {
  document.getElementById("datumPolaska").value = datumpolaska;
  document.getElementById("cijenaPoGostu").value = cijenapogostu;
  odabranoPutovanje = idPutovanje;

  k4_promjenaBrojaGostiju();
};

let k4_promjenaBrojaGostiju = () => {
  let gostiDiv = document.getElementById("gosti");
  gostiDiv.innerHTML = "";

  let greska = provjeriBrojGostiju();
  if (greska !== "") {
    return;
  }

  let br = parseInt(document.getElementById("brojGostiju").value) || 0;
  let cijena = parseFloat(document.getElementById("cijenaPoGostu").value) || 0;
  document.getElementById("ukupnaCijena").value = br * cijena;

  for (let i = 0; i < br; i++) {
    gostiDiv.innerHTML += `
      <input class="ime-gosta" placeholder="Ime gosta ${i + 1}" style="margin-bottom:10px; display:block;">
    `;
  }
};

let provjeriBrojGostiju = () => {
  let brojputnika = parseInt(document.getElementById("brojGostiju").value);
  let el = document.getElementById("brojGostiju");

  if (isNaN(brojputnika) || brojputnika < 2 || brojputnika > 5) {
    el.style.backgroundColor = ErrorBackgroundColor;
    return "Broj gostiju mora biti između 2 i 5!<br/>";
  } else {
    el.style.backgroundColor = OkBackgroundColor;
    return "";
  }
};

let provjeriPasos = () => {
  let pasosinput = document.getElementById("brojPasosa").value;
  let pasosregex = /^[A-Z][0-3][-]?[a-g]{3}[0-9]{2}-[A-F]{2}$/;
  let el = document.getElementById("brojPasosa");

  if (!pasosregex.test(pasosinput)) {
    el.style.backgroundColor = ErrorBackgroundColor;
    return "Uneseni broj pasoša nije validan!<br/>";
  } else {
    el.style.backgroundColor = OkBackgroundColor;
    return "";
  }
};

let provjeriEmail = () => {
  let emailinput = document.getElementById("email").value;
  let emailregex = /^[a-z]+[._]?[a-z]+@[a-z]+(\.[a-z]+)?\.[a-z]{2,}$/;
  let el = document.getElementById("email");

  if (!emailregex.test(emailinput)) {
    el.style.backgroundColor = ErrorBackgroundColor;
    return "Unesena e-mail adresa nije validna!<br/>";
  } else {
    el.style.backgroundColor = OkBackgroundColor;
    return "";
  }
};

let k5_posalji = () => {
  let frontendGreskeValidacije = "";
  frontendGreskeValidacije += provjeriBrojGostiju();
  frontendGreskeValidacije += provjeriPasos();
  frontendGreskeValidacije += provjeriEmail();

  if (odabranoPutovanje === null) {
    frontendGreskeValidacije += "Morate prvo odabrati putovanje!<br/>";
  }

  if (frontendGreskeValidacije !== "") {
    messageDanger("Frontend validacija:<br/><br/>" + frontendGreskeValidacije);
    return;
  }

  let imena = [];
  let nizGostiju = document.getElementsByClassName("ime-gosta");
  for (let i = 0; i < nizGostiju.length; i++) {
    imena.push(nizGostiju[i].value);
  }

  let obj = {
    putovanjeBroj: Number(odabranoPutovanje),
    destinacijaDrzava: document.getElementById("destinacija").value,
    datumPolaska: document.getElementById("datumPolaska").value,
    cijenaUkupno: Number(document.getElementById("ukupnaCijena").value),
    imenaGostiju: imena,
    brojPasosa: document.getElementById("brojPasosa").value,
    emailAdresa: document.getElementById("email").value,
  };

  fetch("https://wrd-api.fit.ba/Ispit20250906/Dodaj", {
    method: "POST",
    body: JSON.stringify(obj),
    headers: {
      "Content-Type": "application/json",
    },
  }).then((res) => {
    res.json().then((body) => {
      if (body.brojGresaka == 0) {
        dialogSuccess(
          "Uspješno kreirana rezervacija sa brojem : " + body.idRezervacije
        );
      } else {
        let backendGreskeValidacije = body.spisakGresaka.join("<br/>");
        messageDanger(
          "Backend validacija: Poslati json podaci nisu ispravni.<br/><br/>" +
            backendGreskeValidacije
        );
      }
    });
  });
};