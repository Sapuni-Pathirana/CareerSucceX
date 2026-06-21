FROM eclipse-temurin:21-jdk-alpine AS build
WORKDIR /app
RUN apk add --no-cache maven
COPY pom.xml .
RUN mvn -B dependency:go-offline -DskipTests || mvn -B dependency:resolve -DskipTests || true
COPY src ./src
RUN for i in 1 2 3 4 5; do \
      mvn -B -DskipTests package && exit 0; \
      echo "Maven build attempt $i failed, retrying..."; \
      sleep 15; \
    done; \
    exit 1

FROM eclipse-temurin:21-jre-alpine
WORKDIR /app
COPY --from=build /app/target/*.jar app.jar
RUN mkdir -p /app/uploads
EXPOSE 8080
ENTRYPOINT ["java", "-jar", "app.jar"]
