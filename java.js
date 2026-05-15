const formulario = document.querySelector("#perguntas");

formulario.addEventListener("submit", (e) => {
    e.preventDefault();

    const nome = document.querySelector("#nome").value;
    const email = document.querySelector("#email").value;
    const date = document.querySelector("#date").value;

    const candidato = [
        nome,
        email,
        date
    ];

    console.log(candidato);

    localStorage.setItem("candidato", JSON.stringify(candidato));
    formulario.reset()
});