// js/game.js (en haut)
import { login, register } from "./api.js";

function createAuthUI() {
  const container = document.getElementById("ui-container");
  container.innerHTML = `
    <div id="auth-forms">
      <h2>S'inscrire</h2>
      <input id="reg-email"    placeholder="Email">
      <input id="reg-password" type="password" placeholder="Mot de passe">
      <input id="reg-codename" placeholder="Pseudo">
      <button id="btn-register">S'inscrire</button>

      <h2>Se connecter</h2>
      <input id="log-email"    placeholder="Email">
      <input id="log-password" type="password" placeholder="Mot de passe">
      <button id="btn-login">Connexion</button>
    </div>
  `;

  document.getElementById("btn-register").onclick = async () => {
    try {
      await register({
        email: document.getElementById("reg-email").value,
        password: document.getElementById("reg-password").value,
        codename: document.getElementById("reg-codename").value,
      });
      alert("Inscription réussie ! Vous pouvez maintenant vous connecter.");
    } catch (e) {
      alert("Erreur inscription : " + e.message);
    }
  };

  document.getElementById("btn-login").onclick = async () => {
    try {
      await login({
        email: document.getElementById("log-email").value,
        password: document.getElementById("log-password").value,
      });
      container.style.display = "none"; // cacher les formulaires
      startGame(); // ta fonction pour lancer Phaser
    } catch (e) {
      alert("Erreur login : " + e.message);
    }
  };
}

// Appelle cette UI avant de lancer Phaser
createAuthUI();
