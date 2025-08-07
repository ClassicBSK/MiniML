# 📦 Mini ML

A short description of what your project does and what technologies it uses.

> Example:  
> A web-based machine learning dashboard with an Angular frontend, ASP.NET backend, FastAPI ML microservice, and PostgreSQL database, all orchestrated with Docker Compose.

---

## 📁 Project Structure

```
project-root/
├── docker-compose.yml
├── Frontend/
│   └── MiniML/          # Angular app
├── Backend/
│   └── MiniMLBackend/   # ASP.NET Core app
├── MLService/           # FastAPI ML microservice
├── db/                  # PostgreSQL init scripts or volumes 
└── README.md
```

---

## 🚀 Getting Started

### Prerequisites

- [Docker](https://docs.docker.com/get-docker/)
- [Docker Compose](https://docs.docker.com/compose/install/)

---

## 🏗️ Build and Run

### 1. Clone the Repository

```bash
git clone https://github.com/ClassicBSK/MiniML.git
cd MiniML
```

### 2. Build and Start Containers

```bash
docker-compose up --build
```

Or, to run in detached mode:

```bash
docker-compose up --build -d
```

---

## 🧰 Services

| Service     | URL                          | Description                     |
|-------------|------------------------------|---------------------------------|
| Frontend    | http://localhost:4200        | Angular Web UI                 |
| Backend     | http://localhost:5000/api    | ASP.NET Core API               |
| ML Service  | http://localhost:8000        | FastAPI ML API                 |
| Database    | localhost:5432               | PostgreSQL |

---

## 🧪 Development Tips

- Use `docker-compose down -v` to stop and remove volumes.
- Use `docker-compose logs -f` to see live logs.

---

## 🐞 Troubleshooting

- Ensure no other services are using ports 4200, 5000, 8000, or 5432.
- Check container logs:
  
  ```bash
  docker-compose logs <service-name>
  ```

- Rebuild everything if changes aren't reflected:

  ```bash
  docker-compose down -v
  docker-compose up --build
  ```

---

## 🧹 Cleanup

```bash
docker-compose down --volumes --remove-orphans
```

---

## 📄 License

This project is licensed under the MIT License. See `LICENSE` file for details.