# 📘 API Documentation: **MiniMLBackend v1.0**

## Base Path
```
/api
```

---

## 🧾 Endpoints

---

### 📂 CSV Endpoints

#### `POST /CSV/csvfile/{simId}`
**Description:** Upload a CSV file for a simulation.

- **Path Parameter:**
  - `simId` (integer, required)

- **Request Body:**
  - `file`: binary file (required)

- **Response:**
  - `200 OK`

---

#### `GET /CSV/csvfile/{simId}`
**Description:** Fetch CSV file info for a simulation.

- **Path Parameter:**
  - `simId` (integer, required)

- **Response:**
```JSON
{
    "recordsCount": 13758,
    "columnCount": 971,
    "passRate": 50,
    "startDate": "2025-08-06T15:22:29",
    "endDate": "2025-08-06T19:11:46"
}
```

---

### 🤖 ML Endpoints

#### `POST /ML/ranges/{simId}`
**Description:** Submit ML date ranges for training/testing/validation.

- **Path Parameter:**
  - `simId` (integer, required)

- **Request Body (JSON):**
```json
{
  "trainStart": "datetime",
  "trainEnd": "datetime",
  "testStart": "datetime",
  "testEnd": "datetime",
  "validStart": "datetime",
  "validEnd": "datetime"
}
```

- **Response:**
  - `200 OK`

---

#### `POST /ML/train/{simId}`
**Description:** Train model for a given simulation.

- Same structure as `/ML/ranges/{simId}`

---

#### `POST /ML/validate/{simId}`
**Description:** Upload file to validate the model.

- **Path Parameter:**
  - `simId` (integer, required)

- **Request Body:**
  - `file`: binary file (required)

- **Response:**
  - `200 OK`

---

#### `GET /ML/model/{simId}`
**Description:** Get trained model for a simulation.

- **Path Parameter:**
  - `simId` (integer, required)

- **Response:**
  - `200 OK`

---

#### `POST /ML/validationresult/{simId}`
**Description:** Get validation result of a simulation.

- **Path Parameter:**
  - `simId` (integer, required)

- **Response:**
  - `200 OK`

---

#### `POST /ML/predictstream/{simId}`
**Description:** Upload file for live stream prediction.

- **Path Parameter:**
  - `simId` (integer, required)

- **Request Body:**
  - `file`: binary file (required)

- **Response:**
  - `200 OK`

---

### 🧪 Simulation Endpoints

#### `POST /Simulation`
**Description:** Create a new simulation instance.

- **Request Body:**
```json
{
  "simName": "string"
}
```

- **Response:**
  - `200 OK`

---

#### `GET /Simulation/simulations`
**Description:** Get all simulation instances.

- **Response:**
  - `200 OK`

---

### 👤 User Endpoints

#### `POST /User/login`
**Description:** Authenticate a user.

- **Request Body:**
```json
{
  "username": "string",
  "password": "string"
}
```

- **Response:**
```json
eybaaga...(JWT Token)
```

#### `POST /User/register`
**Description:** Register a new user.

- **Request Body:**
```json
{
  "username": "string",
  "password": "string"
}
```

- **Response:**
```json
{
  "userId": 0,
  "username": "string",
  "password": "string",
  "simulations": [
    {
      "simId": 0,
      "simName": "string",
      "trainCompleted": true
    }
  ]
}
```

---

## 📦 Data Models

---

### 🔹 `MLDateSpecifications`
```json
{
  "trainStart": "datetime",
  "trainEnd": "datetime",
  "testStart": "datetime",
  "testEnd": "datetime",
  "validStart": "datetime",
  "validEnd": "datetime"
}
```

---

### 🔹 `SimulationInstanceModel`
```json
{
  "simName": "string"
}
```

---

### 🔹 `SimulationInstance`
```json
{
  "simId": 0,
  "simName": "string",
  "trainCompleted": true
}
```

---

### 🔹 `UserLogin`
```json
{
  "username": "string",
  "password": "string"
}
```

---

### 🔹 `User`
```json
{
  "userId": 0,
  "username": "string",
  "password": "string",
  "simulations": [ SimulationInstance ]
}
```

---

## ✅ Notes

- All endpoints return `200 OK` on success.
- Use proper content types (`application/json`, `multipart/form-data`) as specified per endpoint.
- `simId` is a required path parameter for most operations.