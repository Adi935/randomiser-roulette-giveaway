let weightedPool = [];
let displayNames = [];

// Load CSV
fetch("data.csv")
  .then(res => res.text())
  .then(text => {
    const rows = text.trim().split("\n").slice(1);
    rows.forEach(row => {
      const [name, points] = row.split(",");
      const weight = points === "20" ? 2 : 1;

      // For probability
      for (let i = 0; i < weight; i++) {
        weightedPool.push(name);
      }

      displayNames.push(name);
    });

    document.getElementById("roulette").innerText =
      displayNames.join("  |  ");
  });

document.getElementById("spinBtn").onclick = () => {
  const roulette = document.getElementById("roulette");

  // Pick winner (TRUE weighted randomness)
  const winner =
    weightedPool[Math.floor(Math.random() * weightedPool.length)];

  // Animation
  roulette.style.transition = "transform 4s ease-out";
  roulette.style.transform = `translateX(-${Math.random() * 800}px)`;

  setTimeout(() => {
    roulette.style.transition = "none";
    roulette.style.transform = "translateX(0)";
    roulette.innerText = `🏆 WINNER: ${winner}`;
  }, 4000);
};
