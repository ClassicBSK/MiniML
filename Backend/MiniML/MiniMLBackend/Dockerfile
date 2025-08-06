# Stage 1: Build
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
ARG BUILD_CONFIGURATION=Release
WORKDIR /src

# Copy csproj into subfolder and restore
COPY MiniMLBackend.csproj MiniMLBackend/
WORKDIR /src/MiniMLBackend
RUN dotnet restore "MiniMLBackend.csproj"

# Copy the rest of the source code and build
COPY . .
RUN dotnet build "MiniMLBackend.csproj" -c $BUILD_CONFIGURATION -o /app/build
RUN dotnet publish "MiniMLBackend.csproj" -c $BUILD_CONFIGURATION -o /app/publish /p:UseAppHost=false

# Stage 2: Runtime
FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS runtime
WORKDIR /app
COPY --from=build /app/publish .

# Start the application
ENTRYPOINT ["dotnet", "MiniMLBackend.dll"]
