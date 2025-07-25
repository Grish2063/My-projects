function launchConfetti() {
  confetti({
    particleCount: 120,
    spread: 100,
    origin: { y: 0.6 }
  });
}

setTimeout(() => {
  const message = document.getElementById("birthdayMessage");
  message.classList.remove("hidden");

  // Confetti burst sequence
  launchConfetti();
  setTimeout(launchConfetti, 500);
  setTimeout(launchConfetti, 1000);

  // Show "Congratulations" text after a delay
  setTimeout(() => {
    const congrats = document.getElementById("congrats");
    congrats.classList.remove("hidden");
  }, 800);
}, 2500);

