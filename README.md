# Cachetron 🚀

**The Intelligent, Multi-Store Caching Solution for Node.js**

![TypeScript](https://img.shields.io/badge/language-TypeScript-3178C6.svg)
![Redis](https://img.shields.io/badge/support-Redis-red.svg)
![Memcached](https://img.shields.io/badge/support-Memcached-green.svg)

Cachetron is not just another cache wrapper. It is a **smart, adaptive caching layer** that abstracts away the complexity of Redis and Memcached while adding powerful features like **ML-powered TTL prediction**, **dynamic hot-swapping** of cache backends, and a **real-time monitoring dashboard**.

---

## ✨ Key Features

- **🔌 Multi-Store Support**: Seamlessly switch between **Redis** and **Memcached** with zero code changes.
- **🧠 AI-Powered Smart TTL**: Uses a Linear Regression model to predict the optimal Time-To-Live (TTL) for your cache keys based on hit/miss ratios and data volatility.
- **🔄 Dynamic Hot-Swapping**: Change your cache backend (e.g., from Redis to Memcached) in real-time by simply editing `cachetron.json`. Cachetron handles the **live migration** of data automatically!
- **📊 Real-Time Dashboard**: A beautiful React-based dashboard to monitor cache performance, hit rates, and ML predictions.
- **🛠️ CLI Tooling**: Built-in CLI for easy initialization and management.
- **📝 TypeScript Native**: Written in TypeScript for type safety and great developer experience.

---

## 📦 Installation

Install Cachetron via npm:

```bash
npm install cachetron
```

---

## 🚀 Quick Start

### 1. Initialize Configuration

Run the init command to generate a `cachetron.json` file in your project root:

```bash
npx cachetron init
```

This will create a default configuration:

```json
{
  "type": "redis",
  "url": "redis://localhost:6379",
  "autoTTL": true
}
```

### 2. Use in Your Code

Import `cachetron` and start caching!

```typescript
import { cachetron } from 'cachetron';

async function main() {
  const cache = cachetron();

  // Set a value (TTL is optional, or auto-calculated if autoTTL is on)
  await cache.set('user:123', { name: 'Alice', role: 'admin' });

  // Get a value
  const user = await cache.get('user:123');
  console.log(user); // { name: 'Alice', role: 'admin' }

  // Delete a value
  await cache.del('user:123');
}

main();
```

---

## ⚙️ Configuration

The `cachetron.json` file controls the behavior of the cache.

| Option | Type | Description |
| :--- | :--- | :--- |
| `type` | `string` | The cache backend to use. Options: `"redis"` or `"memcache"`. |
| `url` | `string` | Connection string. E.g., `redis://127.0.0.1:6379` or `127.0.0.1:11211`. |
| `autoTTL` | `boolean` | If `true`, enables the ML-based smart TTL prediction. |

### Dynamic Reconfiguration & Migration
One of Cachetron's most powerful features is **Hot Reloading**.
If you edit `cachetron.json` while your application is running (e.g., changing `type` from `redis` to `memcache`), Cachetron will:
1. Detect the change.
2. Initialize the new cache connection.
3. **Migrate** existing keys from the old cache to the new one.
4. Seamlessly switch traffic to the new cache.
5. Disconnect the old cache.

---

## 🧠 Smart Caching (ML-Powered)

When `autoTTL` is enabled, Cachetron uses an internal **Linear Regression Model** to calculate the ideal TTL for your data.

The model considers:
- **Hit Ratio**: High hit ratios suggest popular data (longer TTL).
- **Miss Ratio**: High miss ratios suggest churning data.
- **Cache Size**: Prevents memory overflow by adjusting TTL.
- **Data Change Rate**: Volatile data gets shorter TTLs.

*Formula:*
`TTL = (1501.18 × HitRatio) - (1501.18 × MissRatio) + (0.3 × Size) - (399.21 × ChangeRate)`

---

## 📊 Dashboard

Cachetron comes with a built-in dashboard to visualize your cache's performance.

To start the dashboard:

```bash
 cachetron dashboard
```

Visit `http://localhost:3000` to see:
- Real-time Hit/Miss rates.
- Memory usage.
- Active cache backend status.
- ML Prediction metrics.

---

## 🛠️ CLI Reference

| Command | Description |
| :--- | :--- |
| `cachetron init` | Creates a default `cachetron.json` config file. |
| `cachetron dashboard` | Starts the web-based monitoring dashboard. |
| `cachetron help` | Shows the help menu. |

---

## 🏗️ Development

If you want to contribute or build Cachetron locally:

1. **Clone the repository**:
   ```bash
   git clone https://github.com/yourusername/cachetron.git
   cd cachetron
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Build the project**:
   ```bash
   npm run build
   ```
   *This compiles the TypeScript code and builds the React dashboard.*

4. **Run locally**:
   ```bash
   # Link the binary globally for testing
   npm run link
   
   # Run the CLI
   cachetron help
   ```

5. **Docker Support**:
   Use Docker to spin up Redis and Memcached instances for testing:
   ```bash
   docker compose up -d
   ```

---

## 📄 License

MIT License. See [LICENSE](LICENSE) for details.
