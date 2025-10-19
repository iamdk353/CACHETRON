import * as ort from 'onnxruntime-node';

const modelPath = './linear_regression_ttl.onnx';

export default async function predictTTL(inputData: number[]): Promise<number | undefined> {
  try {
    // [hitRatio, missRatio, cacheSize, dataChangeRate]

    const session: ort.InferenceSession = await ort.InferenceSession.create(modelPath);
    const inputTensor = new ort.Tensor('float32', Float32Array.from(inputData), [1, 4]);
    const feeds: Record<string, ort.Tensor> = { float_input: inputTensor };
    const results: Record<string, ort.Tensor> = await session.run(feeds);
    const outputKey = Object.keys(results)[0];
    return results[outputKey].data[0] as number;
  } catch (err) {
    console.error('Error running ONNX model:', err);
    return undefined;
  }
}

(async () => {
  const input = [0.8, 0.2, 1024, 0.05]; // [hit_ratio, miss_ratio, cache_size, data_change_rate]
  const ttlPrediction = await predictTTL(input);
  console.log('Predicted TTL:', ttlPrediction);
})();