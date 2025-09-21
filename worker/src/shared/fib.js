async function calculateFib(n, fibCacheState) {
  const maxIndex = fibCacheState["maxIndex"];
  const maxValue = fibCacheState[maxIndex];
  const maxMinusOneValue = fibCacheState[maxIndex - 1];

  const calculatedValues = {};
  let prev = maxMinusOneValue;
  let curr = maxValue;

  for (let i = maxIndex + 1; i <= n; i++) {
    const next = prev + curr;
    prev = curr;
    curr = next;
    calculatedValues[i] = curr;
  }

  return calculatedValues;
}

module.exports = { calculateFib };
