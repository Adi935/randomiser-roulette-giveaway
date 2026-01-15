document.addEventListener("DOMContentLoaded", () => {

  /*****  FIREBASE INIT *****/
  const firebaseConfig = {
    apiKey: "AIzaSyB3XY6y-r3qR3GOqTdhCrIXeaFkHYah98c",
    authDomain: "roulette-randomiser-lollasquad.firebaseapp.com",
    projectId: "roulette-randomiser-lollasquad"
  };

  firebase.initializeApp(firebaseConfig);

  const db = firebase.firestore();
  const lockRef = db.collection("giveaway").doc("lock");

  /*****  ADMIN AUTH (UI ONLY) *****/
  const adminLoginBtn = document.getElementById("adminLogin");
  const adminResetBtn = document.getElementById("adminReset");

  if (!adminLoginBtn || !adminResetBtn) {
    console.error("Admin buttons missing in HTML");
    return;
  }

  adminLoginBtn.onclick = () => {
    firebase.auth().signInWithPopup(
      new firebase.auth.GoogleAuthProvider()
    );
  };

  firebase.auth().onAuthStateChanged(user => {
    if (user) {
      adminResetBtn.style.display = "inline-block";
    } else {
      adminResetBtn.style.display = "none";
    }
  });

  /*****  ADMIN RESET *****/
  adminResetBtn.onclick = async () => {
    if (!confirm("Reset giveaway? This will archive the current winner.")) return;

    const snap = await lockRef.get();
    if (!snap.exists) return;

    const data = snap.data();

    await db.collection("giveaway")
      .collection("history")
      .add({
        ...data,
        resetAt: firebase.firestore.FieldValue.serverTimestamp()
      });

    await lockRef.delete();
    location.reload();
  };

  /*****  CANVAS SETUP *****/
  const canvas = document.getElementById("wheel");
  const ctx = canvas.getContext("2d");
  const spinBtn = document.getElementById("spinBtn");
  const resultDiv = document.getElementById("result");

  let users = [];
  let weightedPool = [];
  let angle = 0;

  /*****  LOAD CSV *****/
  fetch("data.csv")
    .then(res => res.text())
    .then(text => {
      const rows = text.trim().split("\n").slice(1);

      rows.forEach(row => {
        const [name, points] = row.split(",");
        if (!name || !points) return;

        users.push(name.trim());

        const weight = Number(points) === 20 ? 2 : 1;
        for (let i = 0; i < weight; i++) {
          weightedPool.push(name.trim());
        }
      });

      drawWheel();
      checkLock();
    });

  /***** CHECK LOCK *****/
  function checkLock() {
    lockRef.get().then(doc => {
      if (doc.exists) {
        const data = doc.data();
        spinBtn.disabled = true;
        resultDiv.innerHTML =
          `🏆 WINNER (LOCKED): <strong>${data.winner}</strong><br>
           🔑 Seed: ${data.seed}`;
      }
    });
  }

  /*****  DRAW WHEEL *****/
  function drawWheel() {
    const slice = (2 * Math.PI) / users.length;

    users.forEach((user, i) => {
      const start = i * slice;
      const end = start + slice;

      ctx.beginPath();
      ctx.moveTo(250, 250);
      ctx.arc(250, 250, 250, start, end);
      ctx.fillStyle = i % 2 ? "#ff0055" : "#222";
      ctx.fill();

      ctx.save();
      ctx.translate(250, 250);
      ctx.rotate(start + slice / 2);
      ctx.textAlign = "right";
      ctx.fillStyle = "white";
      ctx.font = "13px Arial";
      ctx.fillText(user, 230, 5);
      ctx.restore();
    });
  }

  /*****  SPIN *****/
  spinBtn.onclick = async () => {

  document.body.classList.add("spinning");
  spinBtn.disabled = true;

  const snap = await lockRef.get();
  if (snap.exists) return;

  const seed = Date.now();
  const rand =
    Math.floor(seededRandom(seed) * weightedPool.length);

  const winner = weightedPool[rand];

  await lockRef.set({
    winner,
    seed,
    timestamp: firebase.firestore.FieldValue.serverTimestamp()
  });

  const index = users.indexOf(winner);
  const slice = (2 * Math.PI) / users.length;

  const targetAngle =
    (3 * Math.PI) / 2 - (index * slice + slice / 2);

  const fullRotations = 8;
  const finalAngle =
    targetAngle + fullRotations * 2 * Math.PI;

  animateSpin(finalAngle, winner, seed);
};

  /*****  ANIMATION *****/

  
  function animateSpin(finalAngle, winner, seed) {
  const startAngle = angle;
  const delta = finalAngle - startAngle;
  const duration = 6500; // 6.5 seconds (sweet spot)
  let startTime = null;

  function frame(time) {
    if (!startTime) startTime = time;

    const elapsed = time - startTime;
    const progress = Math.min(elapsed / duration, 1);

    // 🔥 Ease-out cubic (fast → slow)
    const eased = 1 - Math.pow(1 - progress, 3);

    angle = startAngle + delta * eased;

    ctx.clearRect(0, 0, 500, 500);
    ctx.save();
    ctx.translate(250, 250);
    ctx.rotate(angle);
    ctx.translate(-250, -250);
    drawWheel();
    ctx.restore();

    if (progress < 1) {
      requestAnimationFrame(frame);
    } else {
  angle = finalAngle % (2 * Math.PI);
  confettiBurst();

  angle += Math.sin(progress * 30) * 0.002;
  document.body.classList.remove("spinning");

  resultDiv.innerHTML =
    `🏆 WINNER: <strong>${winner}</strong><br>
     🔑 Seed: ${seed}`;
}

  }

  requestAnimationFrame(frame);
}


  function seededRandom(seed) {
    let x = Math.sin(seed) * 10000;
    return x - Math.floor(x);
  }

  function confettiBurst() {
    for (let i = 0; i < 120; i++) {
      const c = document.createElement("div");
      c.style.position = "fixed";
      c.style.left = Math.random() * 100 + "vw";
      c.style.top = "-10px";
      c.style.width = "6px";
      c.style.height = "12px";
      c.style.background =
        ["#ff0055", "#00ffcc", "#fff"][Math.floor(Math.random() * 3)];
      c.style.zIndex = 9999;
      document.body.appendChild(c);

      c.animate(
        [{ transform: "translateY(0)" },
         { transform: `translateY(${window.innerHeight}px)` }],
        { duration: 2500 + Math.random() * 1000 }
      );

      setTimeout(() => c.remove(), 3500);
    }
  }

});
