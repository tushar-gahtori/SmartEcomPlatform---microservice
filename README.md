# 🛒 SmartEcommerce Platform — Windows Installer

![Java](https://img.shields.io/badge/Java-21-blue.svg)
![Spring Boot](https://img.shields.io/badge/Spring%20Boot-3.4.1-brightgreen.svg)
![Docker](https://img.shields.io/badge/Docker-Compose-2496ED.svg)
![Kafka](https://img.shields.io/badge/Kafka-Event%20Driven-black.svg)
![Redis](https://img.shields.io/badge/Redis-Caching-red.svg)
![MySQL](https://img.shields.io/badge/MySQL-8.0-blue.svg)
![Platform](https://img.shields.io/badge/Platform-Windows-0078D6.svg?logo=windows)
![License](https://img.shields.io/badge/License-MIT-yellow.svg)

A **one-click Windows launcher** for the SmartEcommerce Platform — a production-grade e-commerce backend built with Java Spring Boot microservices. The PowerShell launcher handles everything: building all services, starting infrastructure, and launching the React frontend — in a single command.

---

## 📖 What Is This Project?

Building a real-world e-commerce backend is not just about writing CRUD endpoints. At production scale, a monolithic application breaks down — a spike in product browsing should not slow down order processing, and a failed email delivery should never roll back a completed purchase. The solution is a **microservices architecture**, where each business domain runs as its own independent service with its own database, its own deployment lifecycle, and its own failure boundary.

This project is a **fully functional, production-patterned e-commerce backend** built with that philosophy. It is not a tutorial skeleton — it implements the same architectural patterns (API Gateway, Service Registry, Circuit Breaker, Saga, Event-Driven messaging) that engineering teams at companies like Amazon, Flipkart, and Zomato use in their actual systems.

The platform handles the complete lifecycle of an online store:
- A customer **registers and logs in** (User Service, JWT-secured).
- They **browse and search products** (Product Service, Redis-cached for speed).
- They **add items to a cart and place an order** (Order Service, with stock validation via Feign).
- An **email notification is sent asynchronously** after checkout (Notification Service, Kafka-powered).

All traffic flows through a **single API Gateway** that handles JWT validation and routing, so the individual services are never exposed directly.

---

## 🧩 Service Breakdown

**1. User Service (Port 8081)**
Handles customer registration and authentication. When a user logs in, this service generates a signed **JWT token** using Spring Security. Every subsequent request carries this token — the API Gateway validates it before the request ever reaches another service. No valid token means no access, regardless of which endpoint is called.

**2. Product Service (Port 8082)**
Manages the product catalogue and stock levels. Because product listings are read far more often than they are updated, every response is cached in **Redis**. When a customer browses products, the data is served from memory in microseconds rather than hitting MySQL on every request. When an admin updates a product, the cache is evicted immediately so stale data is never served.

**3. Order Service (Port 8083)**
The most complex service. When a customer checks out, the Order Service needs to:
- Verify that each item is actually in stock — it does this by calling the **Product Service via OpenFeign** (a declarative HTTP client).
- Reserve the stock so two customers cannot buy the same last item simultaneously.
- Persist the order to its own MySQL schema.
- Publish an `ORDER_PLACED` event to **Kafka** so the Notification Service can send a confirmation email asynchronously.

If stock validation fails, a **Saga rollback** reverses any stock that was already reserved, leaving the system in a consistent state. If the Product Service is unreachable, **Resilience4J** triggers a circuit breaker so the Order Service fails fast rather than hanging indefinitely.

**4. Notification Service (Port 8084)**
A pure Kafka consumer. It listens for `ORDER_PLACED` events and sends confirmation emails. Because it operates completely asynchronously, the customer's checkout response is never delayed by email delivery. If the email server is temporarily down, Kafka retains the event and the Notification Service processes it once the server recovers — **zero message loss, zero impact on the order flow**.

**5. API Gateway (Port 8080)**
The single entry point for every external request. No service is reachable directly from outside. The Gateway validates the JWT token, applies CORS rules, and routes the request to the correct downstream service. Authentication logic lives in exactly one place — not duplicated across six services.

**6. Eureka Server (Port 8761)**
The service registry. Instead of services knowing each other's hardcoded IPs and ports (which break the moment a container restarts), every service registers itself with Eureka on startup. When the Order Service needs to call the Product Service, it asks Eureka for the current address — making the entire system resilient to container restarts and horizontal scaling.

---

## 🔄 End-to-End Workflow

### 🔐 Workflow 1: User Registration & Login

```
Client
  │
  ▼
API Gateway (8080)
  │  No JWT required for /register and /login — these are public routes
  ▼
User Service (8081)
  │
  ├── POST /api/users/register
  │     → Validates request body (email format, password strength)
  │     → Hashes password with BCrypt
  │     → Saves user record to user_service MySQL schema
  │     → Returns 201 Created
  │
  └── POST /api/auth/login
        → Looks up user by email
        → Verifies BCrypt password hash
        → Generates signed JWT (contains userId, role, expiry)
        → Returns JWT token to client
```

The client stores this JWT and attaches it as `Authorization: Bearer <token>` on every subsequent request. The token is self-contained — no session state is stored on the server.

---

### 🛍️ Workflow 2: Browsing Products & Adding to Cart

```
Client  →  Authorization: Bearer <JWT>
  │
  ▼
API Gateway (8080)
  │  Validates JWT signature and expiry
  │  Extracts userId and role from token claims
  │  Routes to Product Service
  ▼
Product Service (8082)
  │
  ├── GET /api/products
  │     → Checks Redis cache for product list
  │     ├── Cache HIT  → Returns data from Redis instantly (sub-millisecond)
  │     └── Cache MISS → Queries MySQL → Stores result in Redis → Returns data
  │
  └── POST /api/products  (ADMIN role only)
        → Gateway enforces role check — non-admin gets 403 Forbidden
        → Saves new product to MySQL
        → Evicts Redis cache so next read reflects the new product

Client  →  POST /api/cart/add
  │
  ▼
API Gateway → Order Service (8083)
  └── Adds item + quantity to cart (stored in Order Service's own DB)
        → No stock is reserved yet — reservation happens only at checkout
```

**Why Redis?** Product reads happen thousands of times more often than writes. Without caching, every browsing request would hit MySQL directly. The cache-aside pattern means MySQL is only involved on a cache miss or after an admin update.

---

### 🧾 Workflow 3: Checkout & Order Placement

```
Client  →  POST /api/orders/checkout
  │
  ▼
API Gateway (8080)
  │  JWT validated → userId extracted → request forwarded
  ▼
Order Service (8083)
  │
  ├── Step 1: Fetch cart items for this userId from Order DB
  │
  ├── Step 2: Stock Validation via OpenFeign
  │     → Calls Product Service: "Is item X available in quantity Y?"
  │     ├── YES → Stock decremented and reserved in Product DB
  │     └── NO  → Order aborted → Returns 409 Conflict: "Item out of stock"
  │
  ├── Step 3: Circuit Breaker (Resilience4J)
  │     → If Product Service is slow or unreachable:
  │           → Circuit trips after threshold failures
  │           → Returns fast 503 fallback error
  │           → No thread left hanging waiting for a dead service
  │
  ├── Step 4: Persist Order
  │     → Saves order (userId, items, total, status=PLACED) to Order DB
  │     → Clears the user's cart
  │
  ├── Step 5: Publish Kafka Event
  │     → Publishes ORDER_PLACED event to Kafka topic
  │     → Payload: orderId, userId, email, items, total
  │     → Does NOT wait for email — returns 201 Created to client immediately
  │
  └── Step 6: Saga Rollback (if Step 4 or 5 fails)
        → If order save fails after stock was reserved:
              → Compensating call to Product Service reverses reservation
              → Customer not charged, system left in consistent state

                    (Async — happens independently of checkout response)
Kafka Topic: ORDER_PLACED
  │
  ▼
Notification Service (8084)
  │
  ├── Consumes ORDER_PLACED event
  ├── Idempotency Check
  │     → Already processed? → Silently discard (prevents duplicate emails)
  │     → New event?        → Mark processed, proceed
  └── Sends confirmation email
        → Email server down? Kafka retains event, retried automatically
```

**Why async email?** If email sending were part of the checkout response, a slow email server would delay every customer's purchase. By publishing to Kafka and returning immediately, checkout always completes in milliseconds regardless of email server state.

**Why idempotency?** Kafka can redeliver an event if the Notification Service crashes mid-processing. Without this check, a customer could receive multiple confirmation emails for the same order.

---

### 📊 Workflow 4: Monitoring

```
All Services (8080–8084)
  │  Each exposes /actuator/prometheus
  │  Metrics: request count, latency, JVM memory, Kafka lag, Redis hit ratio
  ▼
Prometheus (9090)
  │  Scrapes all /actuator/prometheus endpoints every 15 seconds
  ▼
Grafana (3001)
  └── Dashboards:
        → API Gateway request rates and error rates
        → Order Service checkout latency (p50, p95, p99)
        → Kafka consumer lag (is Notification Service keeping up?)
        → Redis cache hit ratio
        → JVM heap usage per service
```

---

## 🔍 Why This Architecture Matters

| Concern | How It's Addressed |
| :--- | :--- |
| A service crashes | Other services keep running; Eureka stops routing to the crashed instance |
| Product Service is slow or down | Circuit breaker trips; Order Service returns a fast error instead of hanging |
| Email server is down | Kafka retains the event; email is delivered when the server recovers |
| Two users buy the last item | Transactional stock reservation in Order Service prevents oversell |
| Same Kafka event delivered twice | Idempotency check via Redis + DB prevents duplicate emails |
| High product read traffic | Redis cache absorbs the load; MySQL only hit on cache miss or update |
| Auth logic spread across services | JWT validation lives only in the API Gateway — one place to audit |

---

## 🏗️ Architecture Diagram

```
API Gateway (8080) → Eureka Server (8761)
         ↓
┌─────────────────┬──────────────────────────┐
│  User Service   │  Product Service          │
│  (8081)         │  (8082) + Redis Cache     │
├─────────────────┼──────────────────────────┤
│  Order Service  │  Notification Service     │
│  (8083) + Feign │  (8084) Kafka Consumer    │
└─────────────────┴──────────────────────────┘
         ↓
   Kafka → MySQL → Prometheus → Grafana
```

---

## 🛠️ Tech Stack

| Layer | Technology |
| :--- | :--- |
| **Language** | Java 21 |
| **Framework** | Spring Boot 3.4.1 |
| **API Gateway** | Spring Cloud Gateway |
| **Service Discovery** | Netflix Eureka |
| **Inter-service Comm** | OpenFeign + Kafka |
| **Security** | Spring Security + JWT |
| **Database** | MySQL 8.0 (per-service schema) |
| **Cache** | Redis 7.2 |
| **Messaging** | Apache Kafka |
| **Monitoring** | Prometheus + Grafana |
| **Containerization** | Docker + Docker Compose |
| **DB Migration** | Flyway |

---

## 📦 What's In This Repository

| File / Folder | Purpose |
| :--- | :--- |
| `start-smartstore.ps1` | Builds all services, starts infrastructure and microservices, launches the React frontend |
| `installer/` | NSIS script for contributors who want to build a distributable `.exe` wizard (see note below) |

---

## ⚙️ Prerequisites

Make sure the following are installed and available on your system `PATH` before running the launcher:

- **Windows 10 / 11** (64-bit)
- **Java 21** — [Download Temurin JDK 21](https://adoptium.net/)
- **Maven 3.9+** — [Download here](https://maven.apache.org/download.cgi)
- **Node.js (LTS)** — [Download here](https://nodejs.org/)
- **Docker Desktop** with WSL2 backend enabled — [Download here](https://www.docker.com/products/docker-desktop/)

> 💡 The launcher checks all of the above on startup and will tell you exactly what is missing before attempting anything.

---

## 🚀 Running the Platform

1. Clone this repository and open **PowerShell as Administrator** in the project root.
2. Run:

```powershell
.\start-smartstore.ps1
```

The launcher will automatically:

- ✅ Verify Docker, Java, Maven, and Node.js are installed and Docker Desktop is running
- ✅ Build `common-lib` and all six microservices via Maven
- ✅ Start infrastructure containers (MySQL, Redis, Kafka, Zookeeper, Prometheus, Grafana)
- ✅ Wait for infrastructure to become healthy, then start all microservice containers
- ✅ Install npm dependencies and start the React frontend
- ✅ Open `http://localhost:3000` in your browser automatically

> ⏳ The full startup takes approximately **2–3 minutes** depending on your machine. The launcher waits 45 seconds for infrastructure and 60 seconds for microservices before proceeding — on slower machines you may see initial connection errors in logs that resolve on their own.

---

## 🌐 Services & Ports

| Service | URL | Notes |
| :--- | :--- | :--- |
| React Frontend | http://localhost:3000 | Opened automatically on launch |
| API Gateway | http://localhost:8080 | All API calls go through here |
| Eureka Dashboard | http://localhost:8761 | View all registered services |
| Prometheus | http://localhost:9090 | Raw metrics |
| Grafana | http://localhost:3001 | Dashboards — login: `admin / admin` |

---

## 🧪 API Endpoints

All requests except `/register` and `/login` require an `Authorization: Bearer <token>` header.

| Endpoint | Method | Description |
| :--- | :--- | :--- |
| `/api/users/register` | POST | Register a new user |
| `/api/auth/login` | POST | Login and receive a JWT token |
| `/api/products` | GET | List all products |
| `/api/products` | POST | Create a product *(Admin only)* |
| `/api/cart/add` | POST | Add an item to the cart |
| `/api/orders/checkout` | POST | Checkout the cart |
| `/api/orders/my-orders` | GET | View your order history |

---

## 🛑 Stopping the Platform

```powershell
docker-compose down
```

To also wipe all stored data (database volumes):

```powershell
docker-compose down -v
```

---

## 🔧 Troubleshooting

**Docker Desktop not detected even though it's installed?**
Make sure Docker Desktop is fully started (visible in the system tray) before running the launcher. The script checks that the Docker daemon is actively responding, not just that the application is installed.

**Port conflict error on startup?**
Ensure the following ports are free: `3000`, `8080`, `8081`, `8082`, `8083`, `8084`, `8761`, `3306`, `6379`, `9092`, `9090`, `3001`.

**PowerShell execution policy error?**
Run this once in an elevated PowerShell prompt, then retry:
```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

**Services start but can't connect to Kafka or MySQL?**
The 45-second infrastructure wait may not be enough on slower machines. Run `docker-compose logs kafka` and `docker-compose logs mysql-db` to check if they are fully healthy, then re-run the launcher.

**`mvn` not recognised?**
Maven must be on your system `PATH`. After installing, restart your terminal and verify with `mvn -v`.

---

## 📦 NSIS Installer (Contributors Only)

The `installer/` folder contains an NSIS script for building a distributable `SmartStore-Setup.exe` wizard. This is intended for contributors packaging a release, not for end users running from source.

> ⚠️ The installer copies source files rather than pre-built JARs. It requires pre-built `.jar` artifacts and a `SmartStore-Launcher.bat` to be present in the project before compiling. Running the installer on a machine without Maven and Docker will result in a broken installation.

To compile it:
1. Install [NSIS](https://nsis.sourceforge.io/Download).
2. Ensure `docs/icon.ico` and `LICENSE.txt` exist in the project root.
3. Run `setup.ps1` from the project root — this creates any missing files and calls `makensis` automatically.

---

## 📜 License

This project is licensed under the **MIT License**.

```
MIT License

Copyright (c) 2025 Tushar Gahtori

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

> **Why MIT?** MIT is the most permissive and widely recognised open-source license. It lets anyone use, modify, and distribute your code — including commercially — as long as they keep your copyright notice. It's the standard choice for portfolio and developer tools projects because it maximises visibility and reuse while protecting you from liability.

---

**Author**: Tushar Gahtori
