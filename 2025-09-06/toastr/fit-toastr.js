document.querySelector(
  "body"
).innerHTML += `<div id="message-wrapper"></div>`;
var kontenjer = document.getElementById("message-wrapper");
var brojac = 0;

var messageDanger = (poruka) => {
  const style = document.createElement("style");
  style.textContent = `
   #message-wrapper {
        position: fixed;
        right: 0;
        bottom: 0;
      }
      .toastr-message {
        padding: 5px;
        background-color: red;
        color: white;
        width: 520px;
        text-align: left;
      }
`;
  document.head.appendChild(style);
  brojac++;
  let lb = brojac;
  kontenjer.innerHTML += `<div class="toastr-message" id="box-${lb}">
        <h3>Greška</h3>
        <p>${poruka}</p>
      </div>`;
  setTimeout(() => {
    document.getElementById(`box-${lb}`).remove();
  }, 5000);
};
