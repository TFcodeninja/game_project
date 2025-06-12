// js/game.js
// import Phaser from "phaser";
import { fetchScores, login, postScore, register } from "./api.js";

let game;
let player, cursors, platforms, enemies, bullets, boosts, shootKey;
let maxPlatformY, lastPlatformX;
let lives, score, bestScore, kills;
let scoreText, bestText, livesText, killsText;
let gameOver, gameOverText, restartText;
let bgm;

const MIN_V_GAP = 50;
const MAX_V_GAP = 80;
const HORIZ_GAP = 120;
const V_BUFFER = window.innerHeight;
const BOOST_CHANCE = 0.1;

//
// 1) AUTH UI
//
function createAuthUI() {
  const container = document.getElementById("ui-container");
  container.innerHTML = `
    <div id="auth-forms">
      <h2>S'inscrire</h2>
      <input id="reg-email"    placeholder="Email"><br>
      <input id="reg-password" type="password" placeholder="Mot de passe"><br>
      <input id="reg-codename" placeholder="Pseudo"><br>
      <button id="btn-register">S'inscrire</button>
      <hr>
      <h2>Se connecter</h2>
      <input id="log-email"    placeholder="Email"><br>
      <input id="log-password" type="password" placeholder="Mot de passe"><br>
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
      alert("Erreur inscription : " + (e.message || e));
    }
  };

  document.getElementById("btn-login").onclick = async () => {
    try {
      await login({
        email: document.getElementById("log-email").value,
        password: document.getElementById("log-password").value,
      });
      container.style.display = "none";
      startGame();
    } catch (e) {
      alert("Erreur login : " + (e.message || e));
    }
  };
}

// lancer l'UI d'abord
createAuthUI();

//
// 2) Phaser config & startGame()
//
const config = {
  type: Phaser.AUTO,
  width: window.innerWidth,
  height: window.innerHeight,
  parent: "game-container",
  physics: {
    default: "arcade",
    arcade: { gravity: { y: 600 }, debug: false },
  },
  scene: { preload, create, update },
};

export function startGame() {
  game = new Phaser.Game(config);
}

//
// 3) preload, create, update
//
function preload() {
  this.load.image("player", "assets/images/player.png");
  this.load.image("enemy", "assets/images/enemy.png");
  this.load.image("platform", "assets/images/platform.png");
  this.load.image("boost", "assets/images/boost.png");
  this.load.audio("bgm", "assets/audio/bgm.mp3");
  this.load.audio("jump", "assets/audio/jump.wav");
  this.load.audio("shoot", "assets/audio/shoot.wav");
  this.load.audio("boost_sfx", "assets/audio/boost.wav");
  this.load.audio("gameover", "assets/audio/gameover.wav");
}

function create() {
  // reset state
  gameOver = false;
  lives = 3;
  score = 0;
  kills = 0;
  bestScore = parseInt(localStorage.getItem("bestScore")) || 0;

  // music
  bgm = this.sound.add("bgm", { loop: true, volume: 0.5 });
  bgm.play();

  // world bounds & camera
  this.physics.world.setBounds(0, -10000, config.width, 10000 + config.height);
  this.cameras.main.setBounds(0, -10000, config.width, 10000 + config.height);

  // groups
  platforms = this.physics.add.staticGroup();
  enemies = this.physics.add.group({ allowGravity: false });
  bullets = this.physics.add.group({ allowGravity: false });
  boosts = this.physics.add.group({ allowGravity: false });

  // initial platforms
  maxPlatformY = config.height - 50;
  lastPlatformX = config.width / 2;
  while (maxPlatformY > this.cameras.main.worldView.y - V_BUFFER) {
    spawnPlatformAndExtras.call(this, maxPlatformY);
    maxPlatformY -= Phaser.Math.Between(MIN_V_GAP, MAX_V_GAP);
  }

  // player
  player = this.physics.add
    .sprite(config.width / 2, config.height - 100, "player")
    .setDisplaySize(40, 40)
    .setBounce(0.2)
    .setCollideWorldBounds(true);
  player.body.setGravityY(600);

  // UI text
  scoreText = this.add
    .text(16, 16, `Score : 0`, { fontSize: "20px", fill: "#fff" })
    .setScrollFactor(0);
  bestText = this.add
    .text(16, 40, `Meilleur : ${bestScore}`, { fontSize: "20px", fill: "#fff" })
    .setScrollFactor(0);
  livesText = this.add
    .text(16, 64, `Vies : ${lives}`, { fontSize: "20px", fill: "#fff" })
    .setScrollFactor(0);
  killsText = this.add
    .text(16, 88, `Tués : ${kills}`, { fontSize: "20px", fill: "#fff" })
    .setScrollFactor(0);

  // game over UI
  gameOverText = this.add
    .text(config.width / 2, config.height / 2 - 40, "GAME OVER", {
      fontSize: "48px",
      fill: "#f00",
    })
    .setOrigin(0.5)
    .setScrollFactor(0)
    .setVisible(false);
  restartText = this.add
    .text(config.width / 2, config.height / 2 + 20, "Cliquez pour rejouer", {
      fontSize: "24px",
      fill: "#fff",
    })
    .setOrigin(0.5)
    .setScrollFactor(0)
    .setVisible(false);

  // camera follow
  this.cameras.main.startFollow(player, false, 0.5, 0.5);

  // colliders/overlaps
  this.physics.add.collider(player, platforms);
  this.physics.add.overlap(player, enemies, onPlayerHit, null, this);
  this.physics.add.overlap(bullets, enemies, onBulletHit, null, this);
  this.physics.add.overlap(player, boosts, onBoostPickup, null, this);

  // controls
  cursors = this.input.keyboard.createCursorKeys();
  shootKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
  this.input.off("pointerdown");
  this.input.on(
    "pointerdown",
    (pointer) => {
      if (gameOver) this.scene.restart();
      else shoot.call(this);
    },
    this
  );
}

function update() {
  if (gameOver) return;

  // left/right
  if (cursors.left.isDown) player.setVelocityX(-160);
  else if (cursors.right.isDown) player.setVelocityX(160);
  else player.setVelocityX(0);

  // auto-jump
  const onGround = player.body.blocked.down || player.body.touching.down;
  if (onGround) {
    player.setVelocityY(-700);
    this.sound.play("jump");
  }

  // shoot via keyboard
  if (Phaser.Input.Keyboard.JustDown(shootKey)) {
    this.sound.play("shoot");
    shoot.call(this);
  }

  // spawn more platforms
  const camTopY = this.cameras.main.worldView.y;
  while (maxPlatformY > camTopY - V_BUFFER) {
    spawnPlatformAndExtras.call(this, maxPlatformY);
    maxPlatformY -= Phaser.Math.Between(MIN_V_GAP, MAX_V_GAP);
  }

  // cleanup off-screen
  platforms.getChildren().forEach((p) => {
    if (p.y > camTopY + config.height + 50) platforms.remove(p, true, true);
  });
  enemies.getChildren().forEach((e) => {
    if (e.y > camTopY + config.height + 50) enemies.remove(e, true, true);
  });
  bullets.getChildren().forEach((b) => {
    if (b.y < camTopY - 50) b.destroy();
  });
  boosts.getChildren().forEach((b) => {
    if (b.y > camTopY + config.height + 50) boosts.remove(b, true, true);
  });

  // update score
  const currentScore = Math.floor((config.height - player.y) / 10);
  if (currentScore > score) {
    score = currentScore;
    scoreText.setText("Score : " + score);
  }

  // fall = game over
  if (player.y > camTopY + config.height) {
    triggerGameOver.call(this);
  }
}

//
// 4) Helpers
//
function spawnPlatformAndExtras(y) {
  const minX = 50,
    maxX = config.width - 50;
  const x = Phaser.Math.Clamp(
    lastPlatformX + Phaser.Math.Between(-HORIZ_GAP, HORIZ_GAP),
    minX,
    maxX
  );
  lastPlatformX = x;

  const p = platforms
    .create(x, y, "platform")
    .setDisplaySize(150, 20)
    .refreshBody();
  p.body.checkCollision.down = false;

  if (Phaser.Math.FloatBetween(0, 1) < 0.3) {
    enemies.create(x, y - 30, "enemy").setDisplaySize(30, 30);
  }
  if (Phaser.Math.FloatBetween(0, 1) < BOOST_CHANCE) {
    const b = boosts.create(x, y - 60, "boost").setDisplaySize(20, 20);
    b.body.setAllowGravity(false);
  }
}

function onBoostPickup(playerObj, boost) {
  boost.destroy();
  this.sound.play("boost_sfx");
  player.setVelocityY(-1200);
}

function shoot() {
  const b = bullets
    .create(player.x, player.y - 20, "player")
    .setDisplaySize(10, 20);
  b.body.setAllowGravity(false);
  b.setVelocityY(-400);
}

function onBulletHit(bullet, enemy) {
  bullet.destroy();
  enemy.destroy();
  this.sound.play("shoot");
  kills++;
  killsText.setText("Tués : " + kills);
}

function onPlayerHit(playerObj, enemy) {
  enemy.destroy();
  if (!gameOver) {
    lives = Math.max(0, lives - 1);
    livesText.setText("Vies : " + lives);
    if (lives === 0) triggerGameOver.call(this);
  }
}

async function triggerGameOver() {
  gameOver = true;
  bgm.stop();
  this.sound.play("gameover");
  this.physics.world.pause();
  gameOverText.setVisible(true);
  restartText.setVisible(true);

  // envoyer le score puis afficher le top
  try {
    await postScore({ value: score, kills });
    const allScores = await fetchScores();
    displayLeaderboard(allScores);
  } catch (err) {
    console.error("Erreur API score:", err);
  }
}

function displayLeaderboard(scores) {
  const container = document.getElementById("ui-container");
  const top5 = scores.slice(0, 5);
  let html = "<h3>Top 5 Scores</h3><ol>";
  top5.forEach((s) => {
    html += `<li>${s.value} pts – ${s.kills} kills</li>`;
  });
  html += "</ol>";
  container.style.display = "block";
  container.innerHTML = html;
}
