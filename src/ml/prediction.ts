// ŷ = β₀ + 1501.178899·x₁ - 1501.178899·x₂ + 0.297697·x₃ - 399.212876·x₄
// y = 1501.178899 × hit_ratio - 1501.178899 × miss_ratio + 0.297697 × cache_size - 399.212876 × data_change_rate + intercept
export interface MLCacheMetrics {
  hitRatioLifetime: number;
  missRatioLifetime: number;
  cacheSize: number;
  dataChangeRate: number;
}

interface ModelCoefficients {
  hit_ratio: number;
  miss_ratio: number;
  cache_size: number;
  data_change_rate: number;
  intercept?: number;
  ttl?: number;
}

// Model coefficients
const coefficients: ModelCoefficients = {
  hit_ratio: 1501.178899,
  miss_ratio: -1501.178899,
  cache_size: 0.297697,
  data_change_rate: -399.212876,
  intercept: 0,
};

function predictLinearRegression(metrics: MLCacheMetrics): number {
  console.log("Predicting with metrics:", metrics);
  let prediction =
    coefficients.hit_ratio * metrics.hitRatioLifetime +
    coefficients.miss_ratio * metrics.missRatioLifetime +
    coefficients.cache_size * metrics.cacheSize +
    coefficients.data_change_rate * metrics.dataChangeRate +
    (coefficients.intercept || 0);
  if (!isFinite(prediction) || prediction <= 0) {
    prediction = Math.abs(prediction);
    if (prediction < 60) prediction = 60;
  }
  prediction = Math.round(prediction);

  console.log(`[ML][Prediction] Predicted TTL (adjusted): ${prediction}`);
  return prediction;
}

export { predictLinearRegression };
