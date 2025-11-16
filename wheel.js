const wheelCanvas = document.getElementById("wheelCanvas");
const spinButton = document.getElementById("spinButton");
const spinSound = document.getElementById("spinSound");   // ticking sound
const flapperSound = document.getElementById("flapperSound"); // final click
const ctx = wheelCanvas.getContext("2d");

const NUM_WEDGES = 20;

// Special wedges
const SPECIAL_WEDGES = {
    2: "🪙",
    10: "👥",
    17: "💰"
};
let index=1;

let wheelRotation = 0;
let spinning = false;

// Tick control for speed–based ticking
let lastTickAngle = 0;
const TICK_INTERVAL_ANGLE = (2 * Math.PI) / NUM_WEDGES / 4; // play tick approx 4× per wedge

function drawWheel() {
    const radius = wheelCanvas.width / 2;
    const center = radius;
    const wedgeAngle = (2 * Math.PI) / NUM_WEDGES;

    ctx.clearRect(0, 0, wheelCanvas.width, wheelCanvas.height);

    for (let i = 0; i < NUM_WEDGES; i++) {
        const startAngle = i * wedgeAngle + wheelRotation;
        const endAngle = startAngle + wedgeAngle;

        let color = SPECIAL_WEDGES[i] ? "#0099ff" : (i % 2 === 0 ? "#ffce00" : "#ff5733");

        // Draw wedge
        ctx.beginPath();
        ctx.moveTo(center, center);
        ctx.arc(center, center, radius, startAngle, endAngle);
        ctx.closePath();
        ctx.fillStyle = color;
        ctx.fill();

        // Label
        ctx.save();
        ctx.translate(center, center);
        ctx.rotate(startAngle + wedgeAngle / 2);
        ctx.textAlign = "right";
        ctx.fillStyle = "black";
        ctx.font = "bold 18px sans-serif";
        ctx.fillText(SPECIAL_WEDGES[i] || i+1, radius - 10, 8);
        ctx.restore();
    }
}

drawWheel();

/* -----------------------------------------------
   SPEED–BASED TICKING SOUND
   ----------------------------------------------- */

function maybePlayTick(rotationIncrement) {
    lastTickAngle += Math.abs(rotationIncrement);

    if (lastTickAngle >= TICK_INTERVAL_ANGLE) {
        lastTickAngle = 0;
        spinSound.currentTime = 0;
        spinSound.play();
    }
}

/* -----------------------------------------------
   SPIN LOGIC
   ----------------------------------------------- */

function spinWheel() {
    if (spinning) return;

    spinning = true;
    lastTickAngle = 0;

    const spinTime = 3000 + Math.random() * 2000;
    const startRotation = wheelRotation;

    // Big spin + random end angle
    const finalRotation = startRotation + Math.PI * 8 + Math.random() * Math.PI * 2;

    const startTime = performance.now();

    function animateWheel(t) {
        const progress = Math.min((t - startTime) / spinTime, 1);
        const easing = 1 - Math.pow(1 - progress, 3);

        const newRotation = startRotation + (finalRotation - startRotation) * easing;
        const rotationIncrement = newRotation - wheelRotation;

        wheelRotation = newRotation;

        maybePlayTick(rotationIncrement);
        drawWheel();

        if (progress < 1) {
            requestAnimationFrame(animateWheel);
        } else {
            spinning = false;
            playFlapperClick();
            landOnWedge();
        }
    }

    requestAnimationFrame(animateWheel);
}

/* -----------------------------------------------
   FINAL FLAPPER CLICK
   ----------------------------------------------- */
function playFlapperClick() {
    flapperSound.currentTime = 0;
    flapperSound.play();
}

/* -----------------------------------------------
   EVENT LISTENER
   ----------------------------------------------- */
spinButton.addEventListener("click", spinWheel);

/* -----------------------------------------------
   DETERMINE WINNING WEDGE
   ----------------------------------------------- */
function mod(n, m) {
  return ((n % m) + m) % m;
}

function landOnWedge() {
  const wedgeAngle = (2 * Math.PI) / NUM_WEDGES;

  // Fixed pointer angle at 12 o'clock (canvas coordinate system).
  const pointerAngle = -Math.PI / 2;

  // Normalize wheelRotation into 0..2π for stable math
  const rot = (wheelRotation % (2 * Math.PI) + 2 * Math.PI) % (2 * Math.PI);

  // Compute the raw index: which wedge covers the pointer after removing rotation.
  // Explanation: we want i such that i*wedgeAngle + wheelRotation <= pointerAngle < (i+1)*wedgeAngle + wheelRotation
  // Rearranged: i = floor((pointerAngle - wheelRotation) / wedgeAngle)
  let rawIndex = Math.floor((pointerAngle - rot) / wedgeAngle);

  // Normalize to 0..NUM_WEDGES-1
  const landedIndex = mod(rawIndex, NUM_WEDGES);

  // Debug (optional) — helps verify visually
  console.log({
    wheelRotation: wheelRotation,
    rot,
    pointerAngle,
    wedgeAngle,
    rawIndex,
    landedIndex
  });

  // Handle special wedges or reveal topic
  if (SPECIAL_WEDGES[landedIndex]) {
    revealSpecial(SPECIAL_WEDGES[landedIndex]);
    return;
  }

  const randomTopic = topics[Math.floor(Math.random() * topics.length)];
  revealTopic(randomTopic);
}

