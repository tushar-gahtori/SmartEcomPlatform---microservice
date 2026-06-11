# 🛒 SmartEcommerce Platform — Microservices Architecture

A production-grade e-commerce backend built with Java Spring Boot microservices.

![Java](https://img.shields.io/badge/Java-21-blue.svg)
![Spring Boot](https://img.shields.io/badge/Spring%20Boot-3.4.1-brightgreen.svg)
![Docker](https://img.shields.io/badge/Docker-Compose-2496ED.svg)
![Kafka](https://img.shields.io/badge/Kafka-Event%20Driven-black.svg)
![Redis](https://img.shields.io/badge/Redis-Caching-red.svg)
![MySQL](https://img.shields.io/badge/MySQL-8.0-blue.svg)

## 🏗 Architecture & Flow

The architecture consists of an API Gateway on port 8080 routing to a Eureka Server on port 8761. The core microservices include the User Service (8081), Product Service with Redis Cache (8082), Order Service with Feign (8083), and Notification Service functioning as a Kafka Consumer (8084). Downstream infrastructure includes Kafka, MySQL, Prometheus, and Grafana.

## 🛠 Tech Stack

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
| **Containerization**| Docker + Docker Compose |
| **DB Migration** | Flyway |

## 🧩 Microservices Breakdown

| Service | Port | Responsibility |
| :--- | :--- | :--- |
| `api-gateway` | 8080 | JWT auth, routing, CORS |
| `eureka-server` | 8761 | Service registry |
| `user-service` | 8081 | Auth, JWT generation |
| `product-service` | 8082 | Catalogue, stock, Redis cache |
| `order-service` | 8083 | Cart, orders, Feign, Kafka |
| `notification-service` | 8084 | Kafka consumer, email |

## 📐 Key Design Patterns

* **API Gateway Pattern**: Provides a single entry point and performs JWT validation.
* **Service Registry**: Uses Eureka for dynamic service discovery.
* **Circuit Breaker**: Implements Resilience4J on Feign clients.
* **Saga Pattern**: Ensures stock rollback on order failure.
* **Event-Driven**: Uses Kafka for asynchronous order notifications.
* **Idempotency**: Utilizes Redis and the database for duplicate event prevention.
* **Cache-Aside**: Applies Redis caching for the product catalogue.

## 🤔 Architecture Decisions

* **Why separate DBs per service?** Each service owns its data, meaning the Order service calls the Product Service via Feign instead of directly touching the products table, enforcing bounded context.
* **Why Kafka for notifications?** Decouples order placement from email sending so that if the email server is down, the order still completes and the Kafka event is retried automatically.
* **Why Redis for product cache?** Significantly reduces database load since product reads are far more frequent than writes, with the cache being evicted on any product update.

## 🚀 Running Locally

### Prerequisites
* Java 21
* Maven 3.9+
* Docker Desktop

### Steps

1.  **Build the common library**:
    ```bash
    cd common-lib && mvn clean install -DskipTests
    ```
2.  **Build all services**:
    ```bash
    for service in api-gateway user-service product-service order-service notification-service eureka-server; do
      cd ../$service && mvn clean package -DskipTests
    done
    ```
3.  **Start the infrastructure**:
    ```bash
    docker-compose up mysql-db redis-cache zookeeper kafka prometheus grafana
    ```
4.  **Start the services** (in a new terminal, wait 60s after step 3):
    ```bash
    docker-compose up eureka-server api-gateway user-service product-service order-service notification-service
    ```

## 🧪 API Testing

| Endpoint | Method | Description |
| :--- | :--- | :--- |
| `/api/users/register` | POST | Register new user |
| `/api/auth/login` | POST | Login, get JWT token |
| `/api/products` | GET | Get all products |
| `/api/products` | POST | Create product (ADMIN) |
| `/api/cart/add` | POST | Add item to cart |
| `/api/orders/checkout`| POST | Checkout cart |
| `/api/orders/my-orders`| GET | View my orders |

## 📈 Monitoring

* **Eureka Dashboard**: http://localhost:8761
* **Prometheus**: http://localhost:9090
* **Grafana**: http://localhost:3001 (Credentials: `admin`/`admin`)

---
**Author**: Tushar Gahtori
