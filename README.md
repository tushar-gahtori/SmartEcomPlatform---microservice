# SmartEcommerce Platform — Microservices Architecture

A production-grade e-commerce backend built with Java Spring Boot microservices.

## Architecture

API Gateway (8080) → Eureka Server (8761)
↓
┌────────────────────────────────────────┐
│  User Service  │ Product Service       │
│  (8081)        │ (8082) + Redis Cache  │
├────────────────┼───────────────────────┤
│  Order Service │ Notification Service  │
│  (8083) +Feign │ (8084) Kafka Consumer │
└────────────────┴───────────────────────┘
↓
Kafka → MySQL → Prometheus → Grafana

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Language | Java 21 |
| Framework | Spring Boot 3.4.1 |
| API Gateway | Spring Cloud Gateway |
| Service Discovery | Netflix Eureka |
| Inter-service Comm | OpenFeign + Kafka |
| Security | Spring Security + JWT |
| Database | MySQL 8.0 (per-service schema) |
| Cache | Redis 7.2 |
| Messaging | Apache Kafka |
| Monitoring | Prometheus + Grafana |
| Containerization | Docker + Docker Compose |
| DB Migration | Flyway |

## Microservices

| Service | Port | Responsibility |
|---------|------|----------------|
| api-gateway | 8080 | JWT auth, routing, CORS |
| eureka-server | 8761 | Service registry |
| user-service | 8081 | Auth, JWT generation |
| product-service | 8082 | Catalogue, stock, Redis cache |
| order-service | 8083 | Cart, orders, Feign, Kafka |
| notification-service | 8084 | Kafka consumer, email |

## Key Design Patterns

- **API Gateway Pattern** — single entry point, JWT validation
- **Service Registry** — Eureka for dynamic service discovery
- **Circuit Breaker** — Resilience4J on Feign clients
- **Saga Pattern** — stock rollback on order failure
- **Event-Driven** — Kafka for async order notifications
- **Idempotency** — Redis + DB for duplicate event prevention
- **Cache-Aside** — Redis caching for product catalogue

## Running Locally

### Prerequisites
- Java 21
- Maven 3.9+
- Docker Desktop

### Steps

```bash
# 1. Build common library
cd common-lib && mvn clean install -DskipTests

# 2. Build all services
for service in api-gateway user-service product-service order-service notification-service eureka-server; do
  cd ../$service && mvn clean package -DskipTests
done

# 3. Start infrastructure
docker-compose up mysql-db redis-cache zookeeper kafka prometheus grafana

# 4. Start services (new terminal, wait 60s after step 3)
docker-compose up eureka-server api-gateway user-service product-service order-service notification-service
```

### API Testing

| Endpoint | Method | Description |
|----------|--------|-------------|
| /api/users/register | POST | Register new user |
| /api/auth/login | POST | Login, get JWT token |
| /api/products | GET | Get all products |
| /api/products | POST | Create product (ADMIN) |
| /api/cart/add | POST | Add item to cart |
| /api/orders/checkout | POST | Checkout cart |
| /api/orders/my-orders | GET | View my orders |

### Monitoring
- Eureka Dashboard → http://localhost:8761
- Prometheus → http://localhost:9090
- Grafana → http://localhost:3001 (admin/admin)

## Architecture Decisions

**Why separate DBs per service?**
Each service owns its data. Order service never touches the products table directly — it calls Product Service via Feign. This enforces bounded context.

**Why Kafka for notifications?**
Order placement and email sending are decoupled. If the email server is down, the order still completes. The Kafka event is retried automatically.

**Why Redis for product cache?**
Product reads are far more frequent than writes. Caching reduces DB load significantly. Cache is evicted on any product update.

## Author
Tushar Gahtori