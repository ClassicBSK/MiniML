\# 📘 API Documentation: \*\*FastAPI v0.1.0\*\*



\## Base Path

```

/

```



---



\## 🧾 Endpoints



---



\### 📤 `POST /csvfilepush`

\*\*Summary:\*\* Process Csv File



\- \*\*Request Body (multipart/form-data):\*\*

&nbsp; - `file`: binary file (required)



\- \*\*Response:\*\*

&nbsp; - `200 OK`: Successful Response

&nbsp; ```json

&nbsp; "CSV File string with timestamp added"

&nbsp; ```

&nbsp; - `422 Validation Error`



---



\### 📤 `POST /csvdetails`

\*\*Summary:\*\* Get Response



\- \*\*Request Body (multipart/form-data):\*\*

&nbsp; - `file`: binary file (required)



\- \*\*Response:\*\*

&nbsp; - `200 OK`: Successful Response

&nbsp; ```json

&nbsp; {

&nbsp;   "recordsCount": 1,

&nbsp;   "columnCount": 1,

&nbsp;   "passRate": 0.5,

&nbsp;   "startDate": "datetime",

&nbsp;   "endDate": "datetime"

&nbsp; }

&nbsp;  

&nbsp; ```

&nbsp; - `422 Validation Error`



---



\### 📤 `POST /rangedata`

\*\*Summary:\*\* Get Response



\- \*\*Request Body (multipart/form-data):\*\*

```json

{

&nbsp; "file": "binary",

&nbsp; "trainStart": "string",

&nbsp; "trainEnd": "string",

&nbsp; "testStart": "string",

&nbsp; "testEnd": "string",

&nbsp; "validStart": "string",

&nbsp; "validEnd": "string"

}

```



\- \*\*Response:\*\*

&nbsp; - `200 OK`: Successful Response

&nbsp; ```json

&nbsp; {

&nbsp;   'trainData': 2 ,

&nbsp;   'testData':2 , 

&nbsp;   'validData':2

&nbsp; }

&nbsp; ```

&nbsp; - `422 Validation Error`



---



\### 📤 `POST /trainmodel`

\*\*Summary:\*\* Get Response



\- \*\*Request Body (multipart/form-data):\*\*

```json

{

&nbsp; "file": "binary",

&nbsp; "trainStart": "string",

&nbsp; "trainEnd": "string",

&nbsp; "testStart": "string",

&nbsp; "testEnd": "string",

&nbsp; "validStart": "string",

&nbsp; "validEnd": "string"

}

```



\- \*\*Response:\*\*

&nbsp; - `200 OK`: Successful Response

```json

&nbsp; { 

&nbsp;   "model":"string weight of model",

&nbsp;   "tp":1,

&nbsp;   "tn":1,

&nbsp;   "fp":1,

&nbsp;   "fn":1,

&nbsp;   "train": {

&nbsp;       "loss": \[0.2,0.2],

&nbsp;       "accuracy": \[0.9,0.9]

&nbsp;   },

&nbsp;   "test": {

&nbsp;       "loss": \[0.2,0.2],

&nbsp;       "accuracy": \[0.8,0.8]

&nbsp;   }

&nbsp; }

```

&nbsp; - `422 Validation Error`



---



\### 📤 `POST /validatecsv`

\*\*Summary:\*\* Get Response



\- \*\*Request Body (multipart/form-data):\*\*

```json

{

&nbsp; "train\_file": "binary",

&nbsp; "valid\_file": "binary"

}

```



\- \*\*Response:\*\*

&nbsp; - `200 OK`: Successful Response

&nbsp; - `422 Validation Error`



---



\### 📤 `POST /resultvalidation`

\*\*Summary:\*\* Get Response



\- \*\*Request Body (multipart/form-data):\*\*

```json

{

&nbsp; "file": "binary",

&nbsp; "validStart": "string",

&nbsp; "validEnd": "string",

&nbsp; "model": "string"

}

```



\- \*\*Response:\*\*

&nbsp; - `200 OK`: Successful Response

&nbsp; ```json

&nbsp; {

&nbsp;   "timestamp": "datetime",

&nbsp;   "confidence": 0.8,

&nbsp;   "prediction": 1

&nbsp; }

&nbsp; ```

&nbsp; - `422 Validation Error`



---



\### 📤 `POST /predictstream`

\*\*Summary:\*\* Stream Predictions



\- \*\*Request Body (multipart/form-data):\*\*

```json

{

&nbsp; "file": "binary",

&nbsp; "model": "string"

}

```



\- \*\*Response:\*\*

&nbsp; - `200 OK`: Successful Response

&nbsp; ```json

&nbsp; {

&nbsp;   "timestamp": "datetime",

&nbsp;   "confidence": 0.8,

&nbsp;   "prediction": 1

&nbsp; }

&nbsp; ```

&nbsp; - `422 Validation Error`



---



\## ⚙️ Validation Error Schema



```json

{

&nbsp; "detail": \[

&nbsp;   {

&nbsp;     "loc": \["string", 0],

&nbsp;     "msg": "string",

&nbsp;     "type": "string"

&nbsp;   }

&nbsp; ]

}

```



---



\## ✅ Notes



\- All endpoints are POST requests and expect multipart/form-data.

\- All inputs are file-based with optional string fields.

\- Common error response: `422 Validation Error`

