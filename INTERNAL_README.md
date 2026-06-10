# SmartEcommerce Platform — Internal Developer Reference

This document covers everything a developer needs to understand,
run, debug, extend, and maintain this system.
It is NOT the public README — it is your internal knowledge base.

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Repository Structure](#2-repository-structure)
3. [Architecture Deep Dive](#3-architecture-deep-dive)
4. [Service Breakdown](#4-service-breakdown)
5. [Data Flow Diagrams](#5-data-flow-diagrams)
6. [Database Schema](#6-database-schema)
7. [API Reference](#7-api-reference)
8. [Security Model](#8-security-model)
9. [Caching Strategy](#9-caching-strategy)
10. [Kafka Event Flow](#10-kafka-event-flow)
11. [Circuit Breaker Configuration](#11-circuit-breaker-configuration)
12. [Environment Variables](#12-environment-variables)
13. [Running Locally](#13-running-locally)
14. [Docker Reference](#14-docker-reference)
15. [Monitoring and Observability](#15-monitoring-and-observability)
16. [Common Errors and Fixes](#16-common-errors-and-fixes)
17. [Design Decisions](#17-design-decisions)
18. [Interview Talking Points](#18-interview-talking-points)

---

## 1. Project Overview

SmartEcommerce is a backend-only microservices platform that simulates
a real-world e-commerce system. It was built to demonstrate:

- Microservices architecture with Spring Boot
- Inter-service communication via OpenFeign (sync) and Kafka (async)
- JWT-based security at the API Gateway layer
- Redis caching with proper cache eviction
- Event-driven notifications with idempotency
- Circuit breaker pattern with Resilience4J
- Full observability with Prometheus and Grafana
- Docker Compose orchestration of 12 containers

---

## 2. Repository Structure

SmartEcommercePlatform-microservices/
│
├── common-lib/                  # Shared DTOs, events, exceptions
│   └── src/main/java/com/example/common/
│       ├── constants/           # KafkaTopics.java
│       ├── dto/                 # All shared request/response DTOs
│       ├── event/               # OrderPlacedEvent.java
│       ├── exception/           # Shared exceptions
│       └── response/            # ApiResponse.java
│
├── eureka-server/               # Service registry (port 8761)
├── api-gateway/                 # Entry point, JWT auth (port 8080)
├── user-service/                # Auth, users, JWT generation (port 8081)
├── product-service/             # Catalogue, stock, Redis (port 8082)
├── order-service/               # Cart, orders, Feign, Kafka (port 8083)
├── notification-service/        # Kafka consumer, email (port 8084)
│
├── prometheus.yml               # Prometheus scrape config
├── docker-compose.yml           # Full system orchestration
├── init.sql                     # Creates all 4 MySQL schemas
├── .env                         # Local secrets (never commit)
├── .gitignore
├── README.md                    # Public-facing README
└── INTERNAL_README.md           # This file

---

## 3. Architecture Deep Dive

┌─────────────────────────────────────┐
│           CLIENT (Postman/React)     │
└──────────────────┬──────────────────┘
│ HTTP :8080
┌──────────────────▼──────────────────┐
│            API GATEWAY               │
│  - JWT validation                    │
│  - Injects X-User-Email header       │
│  - Injects X-User-Role header        │
│  - Injects X-User-Id header          │
│  - Routes to lb://SERVICE-NAME       │
│  - Global CORS config                │
│  - Request/Response logging          │
└──┬──────────┬──────────┬────────────┘
│          │          │
┌───────────▼─┐  ┌─────▼──────┐  ┌▼────────────────┐
│ USER-SERVICE │  │PRODUCT-SVC │  │  ORDER-SERVICE  │
│   :8081      │  │   :8082    │  │     :8083       │
│              │  │            │  │                 │
│ - Register   │  │ - CRUD     │  │ - Cart CRUD     │
│ - Login      │  │ - Search   │  │ - Create Order  │
│ - JWT gen    │  │ - Category │  │ - Checkout      │
│ - User CRUD  │  │ - Stock    │  │ - Cancel Order  │
└──────┬───────┘  └─────┬──────┘  └────────┬────────┘
│                │                   │
┌──────▼───────┐  ┌─────▼──────┐           │ Feign
│  users_db    │  │products_db │  ┌─────────▼────────┐
│  (MySQL)     │  │(MySQL)     │  │  PRODUCT-SERVICE │
└──────────────┘  │+ Redis     │  │  deductStock()   │
│  Cache     │  └──────────────────┘
└────────────┘           │
│ Kafka
┌───────────▼──────────┐
│  NOTIFICATION-SVC    │
│     :8084            │
│                      │
│ - Consumes events    │
│ - Idempotency check  │
│ - Sends emails       │
│ - Logs to DB         │
└──────────────────────┘

                    ┌─────────────────────────────────────┐
                    │         EUREKA SERVER :8761          │
                    │   All services register here         │
                    │   Gateway resolves lb:// via Eureka  │
                    └─────────────────────────────────────┘

                    ┌─────────────────────────────────────┐
                    │   PROMETHEUS :9090 + GRAFANA :3001   │
                    │   Scrapes /actuator/prometheus       │
                    │   from all 5 services every 15s      │
                    └─────────────────────────────────────┘

---

## 4. Service Breakdown

### common-lib
- **Type:** Plain Maven JAR (no Spring Boot)
- **Purpose:** Shared code imported by all services
- **Contents:**
    - `ApiResponse<T>` — standard response wrapper
    - All shared DTOs (UserResponseDTO, ProductResponseDTO etc.)
    - `OrderPlacedEvent` — Kafka message payload
    - `KafkaTopics` — topic name constants
    - Custom exceptions (ResourceNotFoundException, BadRequestException,
      ServiceUnavailableException)
- **Install command:** `mvn clean install -DskipTests`
- **Note:** Must be installed BEFORE building any service

---

### eureka-server
- **Port:** 8761
- **Purpose:** Service registry — all services register on startup
- **Key config:**
    - `register-with-eureka: false` — doesn't register itself
    - `enable-self-preservation: false` — dev mode
    - `eviction-interval: 15000ms` — removes dead services faster
- **Dashboard:** http://localhost:8761
- **Health:** http://localhost:8761/actuator/health

---

### api-gateway
- **Port:** 8080
- **Purpose:** Single entry point for all external traffic
- **Framework:** Spring Cloud Gateway (WebFlux — REACTIVE, not MVC)
- **Key responsibilities:**
    - Validates JWT on every protected request
    - Extracts email, role, userId from token claims
    - Injects X-User-Email, X-User-Role, X-User-Id headers
    - Routes to downstream services via Eureka (lb://)
    - Global CORS configuration
    - Request/Response logging via GlobalFilter
- **Public endpoints (no JWT required):**
    - /api/auth/login
    - /api/users/register
    - /actuator/**
    - /v3/api-docs/**
    - /swagger-ui/**
- **Important:** Uses WebFlux, NOT WebMVC.
  Do NOT add spring-boot-starter-web.
  Do NOT add springdoc-openapi-starter-webmvc-ui.

---

### user-service
- **Port:** 8081
- **Database:** users_db
- **Purpose:** Owns all user identity and authentication
- **Key responsibilities:**
    - User registration with BCrypt password encoding
    - Login — validates credentials, generates JWT
    - JWT contains: email (subject), role (claim), userId (claim)
    - User CRUD (get, update, delete)
    - Internal endpoint /api/users/internal/by-email for Feign callers
- **JWT generation:** ONLY this service generates tokens
- **Security:** Full Spring Security + JwtAuthenticationFilter
  Also accepts X-User-Email from Gateway for already-validated requests
- **Swagger:** http://localhost:8081/swagger-ui/index.html

---

### product-service
- **Port:** 8082
- **Database:** products_db
- **Cache:** Redis (TTL 10 minutes)
- **Purpose:** Owns all product data and stock management
- **Key responsibilities:**
    - Product CRUD (ADMIN only for write operations)
    - Paginated product listing and search
    - Category filtering
    - Stock deduction via guarded UPDATE query (prevents overselling)
    - Stock rollback on order cancellation
    - Redis caching on all read operations
    - Cache eviction on all write operations
- **Internal endpoints (Feign only):**
    - POST /api/products/internal/deduct-stock
    - POST /api/products/internal/rollback-stock
- **Security:** GatewayAuthFilter — trusts X-User-Email/X-User-Role headers
  Does NOT validate JWT itself
- **Swagger:** http://localhost:8082/swagger-ui/index.html

---

### order-service
- **Port:** 8083
- **Database:** orders_db (orders, order_items, carts, cart_items)
- **Purpose:** Owns cart and order lifecycle
- **Key responsibilities:**
    - Cart CRUD (add, remove, view, clear)
    - Order creation (direct or from cart checkout)
    - Calls Product Service via Feign for stock deduction
    - Saga compensation — rolls back stock if order fails mid-way
    - Publishes OrderPlacedEvent to Kafka after DB commit
    - Order cancellation with stock rollback
- **Feign clients:**
    - ProductServiceClient — getProductById, deductStock, rollbackStock
    - UserServiceClient — getUserByEmail (rarely used)
- **Circuit breaker:** Resilience4J on ProductServiceClient
  Fallback throws ServiceUnavailableException → 503 response
- **Kafka:** Publishes to order.placed topic after transaction commits
- **Security:** GatewayAuthFilter — trusts Gateway headers
- **Swagger:** http://localhost:8083/swagger-ui/index.html

---

### notification-service
- **Port:** 8084
- **Database:** notifications_db
- **Cache:** Redis (idempotency keys, TTL 24h)
- **Purpose:** Purely event-driven — no HTTP endpoints for business logic
- **Key responsibilities:**
    - Consumes order.placed Kafka topic
    - Two-layer idempotency: Redis (fast) + DB unique constraint (fallback)
    - Renders HTML email via Thymeleaf template
    - Sends email via JavaMailSender (Gmail SMTP)
    - Logs every event (SENT/FAILED/SKIPPED) to notification_logs table
    - Manual Kafka offset acknowledgment — prevents message loss
    - @Async email sending — frees consumer thread immediately
- **Retry:** FAILED notifications can be replayed via retryFailedNotifications()
- **No Swagger** — no REST controllers

---

## 5. Data Flow Diagrams

### User Registration Flow

Client
→ POST /api/users/register
→ Gateway (public endpoint, no JWT check)
→ User Service
→ Check email not duplicate
→ BCrypt encode password
→ Save to users_db
→ Return UserResponseDTO
→ 201 Created

### Login Flow
Client
→ POST /api/auth/login {email, password}
→ Gateway (public endpoint)
→ User Service
→ Find user by email
→ Verify BCrypt password
→ Generate JWT {sub:email, role:ADMIN, userId:1}
→ Return {token, email, role}
→ 200 OK with JWT token

### Add to Cart Flow
Client
→ POST /api/cart/add?productId=1&quantity=2
→ Gateway
→ Validate JWT
→ Inject X-User-Email, X-User-Role, X-User-Id
→ Order Service
→ GatewayAuthFilter builds SecurityContext from headers
→ Feign call → Product Service → GET /api/products/1
→ Check stock >= quantity
→ Get or create Cart for userId
→ Check if product already in cart (increment) or add new CartItem
→ Recalculate totalCartPrice
→ Save cart
→ Return CartResponseDTO

### Checkout Flow
Client
→ POST /api/orders/checkout
→ Gateway → Order Service
→ Load cart for userId
→ For each cart item:
→ Feign → Product Service → GET product (get price + name)
→ Feign → Product Service → POST deduct-stock
→ Product Service runs: UPDATE products SET stock = stock - qty
WHERE id = ? AND stock >= qty
→ If rowsAffected = 0 → throw BadRequestException
→ Create Order entity with status CONFIRMED
→ Save order to orders_db
→ Clear cart
→ Register afterCommit hook:
→ After TX commits → publish OrderPlacedEvent to Kafka
→ Return OrderResponseDTO
↓
Kafka
↓
Notification Service
→ Receive OrderPlacedEvent
→ Redis SETNX check (idempotency)
→ Send HTML email via Gmail SMTP
→ Log to notification_logs (status=SENT)
→ Acknowledge Kafka offset

### Order Failure / Saga Compensation Flow
Order Service
→ Deduct stock for product A ✓
→ Deduct stock for product B ✗ (insufficient stock)
→ Exception caught in catch block
→ Rollback stock for product A
→ Feign → Product Service → POST rollback-stock
→ Re-throw exception
→ @Transactional rolls back DB writes
→ Return 400 Bad Request

---

## 6. Database Schema

### users_db.users
```sql
id          BIGINT PK AUTO_INCREMENT
name        VARCHAR(255) NOT NULL
email       VARCHAR(255) NOT NULL UNIQUE
password    VARCHAR(255) NOT NULL  -- BCrypt encoded
role        VARCHAR(50) NOT NULL   -- USER or ADMIN
created_at  DATETIME
updated_at  DATETIME
```

### products_db.products
```sql
id          BIGINT PK AUTO_INCREMENT
name        VARCHAR(255) NOT NULL
description VARCHAR(1000)
category    VARCHAR(100) NOT NULL
image_url   VARCHAR(500)
price       DECIMAL(10,2) NOT NULL
stock       INT NOT NULL DEFAULT 0
created_at  DATETIME
updated_at  DATETIME
```

### orders_db.orders
```sql
id           BIGINT PK AUTO_INCREMENT
user_id      BIGINT NOT NULL
user_email   VARCHAR(255) NOT NULL
total_amount DECIMAL(10,2) NOT NULL
status       VARCHAR(50) NOT NULL  -- PENDING/CONFIRMED/SHIPPED/DELIVERED/CANCELLED
created_at   DATETIME
```

### orders_db.order_items
```sql
id                BIGINT PK AUTO_INCREMENT
order_id          BIGINT FK → orders.id
product_id        BIGINT NOT NULL
product_name      VARCHAR(255) NOT NULL
quantity          INT NOT NULL
price_at_purchase DECIMAL(10,2) NOT NULL  -- Locked at time of purchase
```

### orders_db.carts
```sql
id               BIGINT PK AUTO_INCREMENT
user_id          BIGINT NOT NULL UNIQUE
user_email       VARCHAR(255) NOT NULL
total_cart_price DECIMAL(10,2) NOT NULL DEFAULT 0.00
```

### orders_db.cart_items
```sql
id           BIGINT PK AUTO_INCREMENT
cart_id      BIGINT FK → carts.id
product_id   BIGINT NOT NULL
product_name VARCHAR(255) NOT NULL
quantity     INT NOT NULL
unit_price   DECIMAL(10,2) NOT NULL
UNIQUE KEY uq_cart_product (cart_id, product_id)
```

### notifications_db.notification_logs
```sql
id              BIGINT PK AUTO_INCREMENT
event_id        VARCHAR(255) NOT NULL UNIQUE  -- UUID for idempotency
order_id        BIGINT NOT NULL
recipient_email VARCHAR(255) NOT NULL
subject         VARCHAR(500) NOT NULL
status          VARCHAR(50) NOT NULL  -- SENT/FAILED/SKIPPED
failure_reason  VARCHAR(1000)
kafka_partition INT NOT NULL
kafka_offset    BIGINT NOT NULL
processed_at    DATETIME
```

---

## 7. API Reference

### All requests go through Gateway → http://localhost:8080

### Auth Endpoints (no token required)
POST /api/users/register
Body: { name, email, password }
Response: 201 { id, name, email, role }
POST /api/auth/login
Body: { email, password }
Response: 200 { token, email, role }

### User Endpoints (token required)
GET  /api/users              → ADMIN only — list all users
GET  /api/users/{id}         → get user by id
PUT  /api/users/{id}         → update name/email
DELETE /api/users/{id}       → ADMIN only — delete user

### Product Endpoints (token required)
GET  /api/products                          → paginated list
GET  /api/products/{id}                     → single product
GET  /api/products/search?name=mac          → search by name
GET  /api/products/category/{category}      → filter by category
POST /api/products                          → ADMIN only — create
PUT  /api/products/{id}                     → ADMIN only — update
DELETE /api/products/{id}                   → ADMIN only — delete

### Cart Endpoints (token required)
GET    /api/cart                            → view cart
POST   /api/cart/add?productId=1&quantity=2 → add item
DELETE /api/cart/remove?productId=1         → remove item
DELETE /api/cart/clear                      → empty cart

### Order Endpoints (token required)
POST /api/orders                → create order directly
POST /api/orders/checkout       → convert cart to order
GET  /api/orders/my-orders      → list my orders
GET  /api/orders/{orderId}      → get order by id
PUT  /api/orders/{orderId}/cancel → cancel order

---

## 8. Security Model

### JWT Structure
```json
Header: { "alg": "HS256" }
Payload: {
  "sub": "tushar@test.com",
  "role": "ADMIN",
  "userId": 1,
  "iat": 1234567890,
  "exp": 1234571490
}
```

### Request Authentication Flow

Client sends: Authorization: Bearer <token>
Gateway JwtAuthenticationFilter:
a. Checks Authorization header exists
b. Verifies "Bearer " prefix
c. Validates token signature and expiry
d. Extracts email, role, userId from claims
e. Adds headers to forwarded request:
X-User-Email: tushar@test.com
X-User-Role: ADMIN
X-User-Id: 1
Downstream service GatewayAuthFilter:
a. Reads X-User-Email and X-User-Role headers
b. Builds UsernamePasswordAuthenticationToken
c. Sets in SecurityContextHolder
@PreAuthorize("hasRole('ADMIN')") works on the SecurityContext


### Why Services Don't Validate JWT
Downstream services trust the Gateway completely.
The Gateway is the trust boundary — it is the only service
that has the JWT secret and validates tokens.
This avoids every service needing the JWT library and secret,
and avoids double validation on every request.

---

## 9. Caching Strategy

### What is cached
- `products::all` — full product list, key = "all"
- `products::{id}` — individual product, key = product id

### Cache operations
Read:   @Cacheable(value="products", key="#id")
→ checks Redis first
→ on miss: queries DB, stores in Redis
→ TTL: 10 minutes
Write:  @Caching(evict = {
@CacheEvict(value="products", key="#id"),
@CacheEvict(value="products", key="'all'")
})
→ evicts both individual AND list cache
→ next read repopulates from DB

### Redis key format
products::all          → full list
products::1            → product id 1
products::2            → product id 2
notification:processed:{eventId}  → idempotency key (TTL 24h)

### Verify caching is working
```bash
docker exec -it smart-ecommerce-redis redis-cli
KEYS *
TTL products::1        # Shows seconds remaining
GET products::1        # Shows cached JSON
```

---

## 10. Kafka Event Flow

### Topic: order.placed

**Producer** (Order Service):
```java
// After DB transaction commits (afterCommit hook):
kafkaTemplate.send("order.placed", orderId.toString(), event)
// Key = orderId → guarantees ordering per order
// Idempotent producer → no duplicate messages on retry
// acks=all → waits for all replicas before confirming
```

**Event payload** (OrderPlacedEvent):
```json
{
  "eventId": "uuid-v4",
  "orderId": 1,
  "userEmail": "tushar@test.com",
  "userName": "Tushar",
  "totalAmount": 1999.99,
  "status": "ORDER_PLACED",
  "occurredAt": "2025-01-01T10:00:00"
}
```

**Consumer** (Notification Service):

Receive message
Redis SETNX on eventId (fast idempotency)
DB check on eventId (fallback after Redis TTL)
Send HTML email via Gmail SMTP (@Async)
Log to notification_logs
acknowledgment.acknowledge() → commit offset


### Kafka Commands (debug)
```bash
# List topics
docker exec smart-ecommerce-kafka kafka-topics \
  --bootstrap-server localhost:9092 --list

# Consume messages from beginning
docker exec smart-ecommerce-kafka kafka-console-consumer \
  --bootstrap-server localhost:9092 \
  --topic order.placed \
  --from-beginning

# Check consumer group lag
docker exec smart-ecommerce-kafka kafka-consumer-groups \
  --bootstrap-server localhost:9092 \
  --describe --group notification-service-group
```

---

## 11. Circuit Breaker Configuration

Applied on Order Service → Product Service Feign calls.

```yaml
resilience4j:
  circuitbreaker:
    instances:
      PRODUCT-SERVICE:
        failure-rate-threshold: 50      # Open after 50% failures
        minimum-number-of-calls: 10     # Need 10 calls to calculate rate
        wait-duration-in-open-state: 10s # Try again after 10s
        permitted-number-of-calls-in-half-open-state: 3
        sliding-window-size: 10
```

### Circuit Breaker States
CLOSED → normal operation, all calls go through
OPEN   → product service is down, fallback fires immediately
(no calls made, instant ServiceUnavailableException)
HALF-OPEN → 3 test calls allowed, if they pass → CLOSED
if they fail → OPEN again

### Check circuit breaker state
GET http://localhost:8083/actuator/health
Look for: "circuitBreakers": { "PRODUCT-SERVICE": { "state": "CLOSED" } }

---

## 12. Environment Variables

### `.env` file (never commit)
```env
JWT_SECRET=5367566B59703373367639792F423F4528482B4D6251655468576D5A71347437
JWT_EXPIRATION_MS=3600000
DB_USERNAME=root
DB_PASSWORD=1234
MAIL_USERNAME=your-email@gmail.com
MAIL_PASSWORD=your-gmail-app-password
REDIS_HOST=redis-cache
REDIS_PORT=6379
KAFKA_BOOTSTRAP_SERVERS=kafka:9092
EUREKA_URI=http://eureka-server:8761/eureka/
```

### Per-service environment (set in docker-compose)
user-service:
DB_URL=jdbc:mysql://mysql-db:3306/users_db
JWT_SECRET, JWT_EXPIRATION_MS, EUREKA_URI
product-service:
DB_URL=jdbc:mysql://mysql-db:3306/products_db
REDIS_HOST, REDIS_PORT, EUREKA_URI
order-service:
DB_URL=jdbc:mysql://mysql-db:3306/orders_db
KAFKA_BOOTSTRAP_SERVERS, EUREKA_URI
notification-service:
DB_URL=jdbc:mysql://mysql-db:3306/notifications_db
KAFKA_BOOTSTRAP_SERVERS, REDIS_HOST, REDIS_PORT
MAIL_USERNAME, MAIL_PASSWORD, EUREKA_URI

---

## 13. Running Locally

### Prerequisites
Java 21      → java -version
Maven 3.9+   → mvn -version
Docker       → docker -version (Docker Desktop must be running)

### Full startup sequence
```powershell
# Step 1 — Build common library (do this once, or after changes)
cd common-lib
mvn clean install -DskipTests

# Step 2 — Build all service jars
cd ..\eureka-server     && mvn clean package -DskipTests
cd ..\api-gateway       && mvn clean package -DskipTests
cd ..\user-service      && mvn clean package -DskipTests
cd ..\product-service   && mvn clean package -DskipTests
cd ..\order-service     && mvn clean package -DskipTests
cd ..\notification-service && mvn clean package -DskipTests

# Step 3 — Start infrastructure (Terminal 1)
cd ..
docker-compose up mysql-db redis-cache zookeeper kafka prometheus grafana

# Step 4 — Wait 60 seconds for MySQL to initialize, then start services (Terminal 2)
docker-compose up eureka-server api-gateway user-service product-service order-service notification-service
```

### Verify startup
http://localhost:8761              → Eureka (all 4 services registered)
http://localhost:8081/actuator/health → {"status":"UP"}
http://localhost:8082/actuator/health → {"status":"UP"}
http://localhost:8083/actuator/health → {"status":"UP"}
http://localhost:8084/actuator/health → {"status":"UP"}
http://localhost:9090/targets      → All targets UP
http://localhost:3001              → Grafana dashboard

### Rebuilding a single service after code change
```powershell
cd order-service
mvn clean package -DskipTests
cd ..
docker-compose up --build order-service
```

---

## 14. Docker Reference

### Container names
smart-ecommerce-mysql
smart-ecommerce-redis
smart-ecommerce-zookeeper
smart-ecommerce-kafka
smart-ecommerce-prometheus
smart-ecommerce-grafana
smart-ecommerce-eureka
smart-ecommerce-gateway
smart-ecommerce-user
smart-ecommerce-product
smart-ecommerce-order
smart-ecommerce-notification

### Useful commands
```bash
# See all containers and status
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"

# Live logs for a service
docker logs smart-ecommerce-order -f

# Last 50 lines
docker logs smart-ecommerce-user --tail=50

# Restart one service
docker-compose restart order-service

# Rebuild and restart one service
docker-compose up --build order-service

# Stop everything (keeps volumes)
docker-compose down

# Stop everything and wipe all data (fresh start)
docker-compose down -v

# Access MySQL
docker exec -it smart-ecommerce-mysql mysql -uroot -p1234

# Access Redis CLI
docker exec -it smart-ecommerce-redis redis-cli

# Access Kafka CLI
docker exec -it smart-ecommerce-kafka bash
```

### Dockerfile pattern (all services)
```dockerfile
FROM eclipse-temurin:21-jre
WORKDIR /app
COPY target/*.jar app.jar
ENTRYPOINT ["java", "-jar", "app.jar"]
```

Note: Jars are built locally with Maven.
Docker only copies the pre-built jar.
This avoids Maven-inside-Docker complexity.

---

## 15. Monitoring and Observability

### Prometheus
- URL: http://localhost:9090
- Scrapes /actuator/prometheus every 15 seconds
- Targets: user-service, product-service, order-service,
  notification-service, api-gateway

### Useful Prometheus queries
HTTP request rate per service
rate(http_server_requests_seconds_count[5m])
Error rate (5xx responses)
rate(http_server_requests_seconds_count{status=~"5.."}[5m])
JVM memory used
jvm_memory_used_bytes{area="heap"}
Active DB connections
hikaricp_connections_active
Kafka consumer lag
kafka_consumer_fetch_manager_records_lag

### Grafana
- URL: http://localhost:3001
- Login: admin / admin
- Data source: Prometheus → http://prometheus:9090
- Recommended dashboards:
    - 4701 → JVM Micrometer (Spring Boot metrics)
    - 7362 → Spring Boot Statistics
    - 11378 → Spring Boot 3.x Dashboard

### Service logs
```bash
# Gateway — see all incoming requests
docker logs smart-ecommerce-gateway -f

# Order service — see Feign calls and Kafka publishing
docker logs smart-ecommerce-order -f

# Notification — see Kafka consumption and email sending
docker logs smart-ecommerce-notification -f
```

---

## 16. Common Errors and Fixes

### Container name conflict
Error: The container name "/smart-ecommerce-mysql" is already in use
Fix:  docker-compose down -v && docker container prune -f

### Flyway schema validation error
Error: Schema-validation: wrong column type encountered in column [price]
found [decimal] but expecting [float]
Fix:  Add columnDefinition = "DECIMAL(10,2)" to @Column on price fields
Then: docker-compose down -v && docker-compose up --build

### Services not registering with Eureka
Error: Cannot execute request on any known server
Cause: Services started before Eureka was ready
Fix:  Start infrastructure first, wait 30s, then start services
OR add depends_on with service_healthy condition in docker-compose

### Prometheus targets DOWN (no such host)
Error: dial tcp: lookup user-service: no such host
Cause: Prometheus started before service containers existed
Fix:  Once services are running, Prometheus auto-resolves on next scrape
Wait 15 seconds and refresh /targets

### Springdoc 500 error on Swagger UI
Error: NoSuchMethodError: ControllerAdviceBean.<init>(Object)
Cause: springdoc-openapi 2.3.0 incompatible with Spring Boot 3.4.x
Fix:  Upgrade to springdoc-openapi-starter-webmvc-ui 2.8.0

### mvn not recognized
Error: 'mvn' is not recognized
Fix:  Download Maven from maven.apache.org
Set MAVEN_HOME env var
Add %MAVEN_HOME%\bin to PATH
Restart PowerShell

### PowerShell script execution blocked
Error: cannot be loaded because running scripts is disabled
Fix:  powershell -ExecutionPolicy Bypass -File .\script.ps1
OR: Set-ExecutionPolicy -Scope CurrentUser -ExecutionPolicy RemoteSigned

---

## 17. Design Decisions

### Why one DB per service?
Each service owns its data exclusively. No service reads another
service's DB directly. Order Service never touches the products table —
it calls Product Service via Feign. This enforces bounded context and
allows each service to evolve its schema independently.

### Why Feign for product calls, Kafka for notifications?
Feign (sync) for stock deduction because the order creation process
NEEDS to know if stock deduction succeeded or failed before continuing.
This is a query that requires an immediate answer.

Kafka (async) for notifications because the user doesn't need to wait
for the email to be sent before getting their order confirmation.
Decoupling these also means email server downtime doesn't affect orders.

### Why afterCommit hook for Kafka?
If Kafka publish happens INSIDE the transaction and the DB commit fails,
the email is sent but no order exists. The afterCommit hook guarantees
the DB write succeeded before the event fires.

### Why GatewayAuthFilter instead of JWT in each service?
Each service validating JWT means: each service needs the JWT secret,
each service needs the JWT library, every request gets double-validated.
GatewayAuthFilter trusts the headers the Gateway injects. The Gateway
is the trust boundary — downstream services are inside the perimeter.

### Why manual Kafka acknowledgment?
With auto-commit, if the consumer crashes after receiving the message
but before processing it, the offset is already committed and the message
is lost. Manual ack commits the offset only after processing succeeds.
Combined with idempotency this gives at-least-once with no duplicates.

### Why two-layer idempotency (Redis + DB)?
Redis is fast (sub-millisecond) but has TTL — after 24h the key expires.
DB unique constraint on eventId is the permanent fallback. Together they
handle both high-frequency duplicates (Redis) and rare late duplicates
after Redis TTL (DB).

### Why price_at_purchase in order_items?
If a product price changes after an order is placed, historical orders
should still show the original purchase price. Storing the live price
from the products table would show wrong amounts for old orders.

---

## 18. Interview Talking Points

### "Tell me about this project"
"I built a microservices e-commerce platform with 6 Spring Boot services.
Each service owns its own database, they communicate synchronously via
OpenFeign for queries that need immediate answers like stock deduction,
and asynchronously via Kafka for fire-and-forget operations like email
notifications. The API Gateway validates JWT once and injects user
context as headers — downstream services trust these headers rather than
re-validating the token. I implemented the Saga pattern for distributed
transactions — if stock deduction fails for any product in an order,
we roll back the stock we already deducted from previous products."

### "What happens if Product Service is down during checkout?"
"The Feign client has a Resilience4J circuit breaker. After 50% failure
rate over 10 calls, the circuit opens. The fallback throws a
ServiceUnavailableException which the GlobalExceptionHandler maps to
a clean 503 response. The circuit stays open for 10 seconds, then
enters half-open state to test if the service recovered."

### "How do you prevent duplicate emails?"
"Two layers. First, Redis SETNX — set if not exists. If the key already
exists, the event was already processed and we skip it. Redis TTL is
24 hours. After that expires, we fall back to checking the DB — the
notification_logs table has a unique constraint on eventId. So even
if Kafka delivers a message twice and Redis has expired, the DB insert
will throw a unique constraint violation which we catch and log as SKIPPED."

### "How does the JWT flow work?"
"User Service generates the JWT on login, embedding email, role, and
userId as claims. The Gateway has the same secret so it can validate
and parse the token. It then injects X-User-Email, X-User-Role, and
X-User-Id as headers into the forwarded request. Downstream services
read these headers and build their SecurityContext from them. No service
other than User Service and Gateway ever touches JWT."

### "Why did you use Flyway?"
"Flyway gives you reproducible, versioned DB schema changes. When a new
container starts with an empty DB, Flyway runs all migrations in order
and gets the schema to the right state. Without it, you'd need to
manually run SQL scripts. In production, Flyway also gives you an
audit trail of every schema change ever applied."

### "How is your caching implemented?"
"Cache-aside pattern with Redis. Product reads check Redis first.
On a cache miss they query MySQL and populate Redis with a 10-minute TTL.
Any write operation — create, update, delete — evicts both the individual
product key and the all-products list key using @CacheEvict with @Caching.
This ensures consistency. I also use @JsonTypeInfo in the Redis serializer
configuration so LocalDateTime fields deserialize correctly."

### "What would you improve in production?"
"Several things. First, an outbox pattern for the Kafka publishing —
instead of relying on the afterCommit hook, write the event to an outbox
table in the same transaction, then a separate process polls and publishes.
This guarantees exactly-once publishing even if the app crashes between
commit and Kafka send. Second, Kubernetes instead of Docker Compose for
auto-scaling and self-healing. Third, distributed tracing with Micrometer
and Zipkin to track requests across services. Fourth, API versioning on
all endpoints."