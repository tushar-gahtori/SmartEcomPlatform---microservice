# SmartEcommerce Platform — Windows Setup Script
Write-Host "================================================" -ForegroundColor Cyan
Write-Host "  SmartEcommerce Platform — Local Setup" -ForegroundColor Cyan
Write-Host "================================================" -ForegroundColor Cyan

# Check Java
Write-Host "`nChecking prerequisites..." -ForegroundColor Yellow
$javaVersion = java -version 2>&1 | Select-String "version"
if ($javaVersion) {
    Write-Host "Java found: $javaVersion" -ForegroundColor Green
} else {
    Write-Host "Java 21 not found. Download from https://adoptium.net" -ForegroundColor Red
    exit 1
}

# Check Maven
$mvnVersion = mvn -version 2>&1 | Select-String "Apache Maven"
if ($mvnVersion) {
    Write-Host "Maven found: $mvnVersion" -ForegroundColor Green
} else {
    Write-Host "Maven not found. Download from https://maven.apache.org/download.cgi" -ForegroundColor Red
    exit 1
}

# Check Docker
$dockerVersion = docker -version 2>&1
if ($dockerVersion) {
    Write-Host "Docker found: $dockerVersion" -ForegroundColor Green
} else {
    Write-Host "Docker not found. Download from https://www.docker.com/products/docker-desktop" -ForegroundColor Red
    exit 1
}

# Create .env from template
if (-not (Test-Path ".env")) {
    Copy-Item ".env.example" ".env"
    Write-Host "`n.env file created from template." -ForegroundColor Green
    Write-Host "Please edit .env and add your Gmail credentials before continuing." -ForegroundColor Yellow
    Write-Host "Press Enter after editing .env to continue..." -ForegroundColor Yellow
    Read-Host
} else {
    Write-Host ".env already exists, skipping..." -ForegroundColor Green
}

# Build common-lib
Write-Host "`nBuilding common-lib..." -ForegroundColor Yellow
Set-Location common-lib
mvn clean install -DskipTests -q
if ($LASTEXITCODE -ne 0) {
    Write-Host "common-lib build failed!" -ForegroundColor Red
    exit 1
}
Write-Host "common-lib built successfully" -ForegroundColor Green
Set-Location ..

# Build all services
$services = @(
    "eureka-server",
    "api-gateway",
    "user-service",
    "product-service",
    "order-service",
    "notification-service"
)

foreach ($service in $services) {
    Write-Host "Building $service..." -ForegroundColor Yellow
    Set-Location $service
    mvn clean package -DskipTests -q
    if ($LASTEXITCODE -ne 0) {
        Write-Host "$service build failed!" -ForegroundColor Red
        Set-Location ..
        exit 1
    }
    Write-Host "$service built successfully" -ForegroundColor Green
    Set-Location ..
}

Write-Host "`nAll services built successfully!" -ForegroundColor Green
Write-Host "`nStarting infrastructure (MySQL, Redis, Kafka, Prometheus, Grafana)..." -ForegroundColor Yellow
Write-Host "This will take about 60 seconds..." -ForegroundColor Yellow

# Start infrastructure
Start-Process powershell -ArgumentList "-NoExit", "-Command", "docker-compose up mysql-db redis-cache zookeeper kafka prometheus grafana"

Write-Host "`nWaiting 60 seconds for infrastructure to initialize..." -ForegroundColor Yellow
Start-Sleep -Seconds 60

Write-Host "`nStarting all microservices..." -ForegroundColor Yellow
docker-compose up eureka-server api-gateway user-service product-service order-service notification-service

Write-Host "`n================================================" -ForegroundColor Cyan
Write-Host "  Setup Complete! Access points:" -ForegroundColor Cyan
Write-Host "================================================" -ForegroundColor Cyan
Write-Host "API Gateway:        http://localhost:8080" -ForegroundColor White
Write-Host "Eureka Dashboard:   http://localhost:8761" -ForegroundColor White
Write-Host "User Swagger:       http://localhost:8081/swagger-ui/index.html" -ForegroundColor White
Write-Host "Product Swagger:    http://localhost:8082/swagger-ui/index.html" -ForegroundColor White
Write-Host "Order Swagger:      http://localhost:8083/swagger-ui/index.html" -ForegroundColor White
Write-Host "Prometheus:         http://localhost:9090" -ForegroundColor White
Write-Host "Grafana:            http://localhost:3001 (admin/admin)" -ForegroundColor White