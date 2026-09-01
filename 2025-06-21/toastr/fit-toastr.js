document.querySelector(".main").innerHTML += `<div id="message-wrapper"></div>`;
var kontenjer = document.getElementById("message-wrapper");
var brojac = 0;

messageSuccess = (poruka) => {
  const style = document.createElement("style");
  style.textContent = `
   #message-wrapper {
        position: absolute;
        right: 0;
        bottom: 0;
      }
      .toastr-message {
        background-color: red;
        color: white;
        width: 250px;
        text-align: center;
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
  }, 3000);
};
