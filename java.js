const menuMobile = document.getElementById("menu-mobile");
const menuDesktop = document.getElementById("menu-desktop");

// Evita erro quando a página não tem o menu mobile (ex: index.html)
if (menuMobile && menuDesktop) {
    const icon = menuMobile.querySelector("i");

    if (icon) {
        menuMobile.addEventListener("click", () => {
            menuDesktop.classList.toggle("active");

            // troca ícone ☰ ↔ ✖
            if (menuDesktop.classList.contains("active")) {
                icon.classList.remove("bi-list");
                icon.classList.add("bi-x-lg");
            } else {
                icon.classList.remove("bi-x-lg");
                icon.classList.add("bi-list");
            }
        });
    }
}

