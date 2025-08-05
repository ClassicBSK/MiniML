from fastapi import FastAPI, File, UploadFile, Form, HTTPException
from fastapi.responses import StreamingResponse
from fastapi.middleware.cors import CORSMiddleware
import uvicorn 
import pandas as pd
import io
import xgboost as xgb
import pickle
import base64
import time
import csv
import json
import asyncio
app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)



@app.post("/csvfiletest")
async def get_response(file: UploadFile = File(...)):
    df_iterator = pd.read_csv(file.file, chunksize=10000)

    total_rows = 0
    total_cols = 0

    for chunk in df_iterator:
        total_rows += len(chunk)
        total_cols = len(chunk.columns)  # set once

    
    return {"recordsCount": total_rows, "columnCount": total_cols,"pass_rate":85.0,"startDate":pd.Timestamp(2024,10,18,6,5,25).isoformat(),"endDate":pd.Timestamp.utcnow().isoformat(timespec="seconds")}
   


@app.post("/rangedata")
async def get_response(file: UploadFile = File(...),trainStart: str = Form(...),
    trainEnd: str = Form(...),
    testStart: str = Form(...),
    testEnd: str = Form(...),
    validStart: str = Form(...),
    validEnd: str = Form(...),
    
    ):
    df_iterator = pd.read_csv(file.file, chunksize=10000)

    total_rows = 0
    total_cols = 0

    for chunk in df_iterator:
        total_rows += len(chunk)
        total_cols = len(chunk.columns)  # set once

    
    return {1:{"train":20,"test":20,"valid":10},
            2:{"train":20,"test":20,"valid":10},
            3:{"train":20,"test":20,"valid":10},
            4:{"train":20,"test":20,"valid":10},
            5:{"train":20,"test":20,"valid":10},
            6:{"train":20,"test":20,"valid":10},
            7:{"train":20,"test":20,"valid":10},
            8:{"train":20,"test":20,"valid":10},
            9:{"train":20,"test":20,"valid":10},
            10:{"train":20,"test":20,"valid":10},
            11:{"train":20,"test":20,"valid":10},
            12:{"train":20,"test":20,"valid":10},}
   

@app.post("/trainmodel")
async def get_response(file: UploadFile = File(...),trainStart: str = Form(...),
    trainEnd: str = Form(...),
    testStart: str = Form(...),
    testEnd: str = Form(...),
    validStart: str = Form(...),
    validEnd: str = Form(...),
    
    ):
    df_iterator = pd.read_csv(file.file, chunksize=10000)

    total_rows = 0
    total_cols = 0

    for chunk in df_iterator:
        total_rows += len(chunk)
        total_cols = len(chunk.columns)  # set once
    dtrain = xgb.DMatrix([[1,2],[3,4],[5,6]], label=[0,1,0])
    param = {'max_depth': 2, 'eta': 1, 'objective': 'binary:logistic'}
    num_round = 2

    model = xgb.train(param, dtrain, num_round)

    model_bytes = pickle.dumps(model)
    model_base64 = base64.b64encode(model_bytes).decode("utf-8")
    # print(model_base64)
    return {"model":model_base64,"tp":10,"tn":5,"fp":5,"fn":6,
                "train": {
                    "loss": [0.69, 0.66, 0.62],
                    "accuracy": [0.50, 0.45, 0.42]
                },
                "test": {
                    "loss": [0.68, 0.65, 0.60],
                    "accuracy": [0.48, 0.44, 0.40]
                }
            }
   
# @app.post("/predict-stream")
# async def predict_stream(file: UploadFile = File(...)):
#     contents = await file.read()
#     df = pd.read_csv(io.BytesIO(contents))

#     def prediction_generator():
#         model = xgb.Booster()
#         model.load_model("model.json")

#         for _, row in df.iterrows():
#             dmatrix = xgb.DMatrix([row.values])
#             pred = model.predict(dmatrix)[0]
#             yield f"{pred}\n"
#             time.sleep(0.1)  # Simulate delay

#     return StreamingResponse(prediction_generator(), media_type="text/plain")


@app.post("/validatecsv")
async def get_response(train_file: UploadFile = File(...),valid_file: UploadFile = File(...)):
    
    train_df_iterator = pd.read_csv(train_file.file, chunksize=10000)
    valid_df_iterator = pd.read_csv(valid_file.file, chunksize=10000)
    train_columns=[]
    valid_columns=[]
    for chunk in train_df_iterator:
        
        train_columns = list(chunk.columns) 
        break

    for chunk in valid_df_iterator:
        
        valid_columns = list(chunk.columns) 
        break
    
    
    if(train_columns==valid_columns):
        return { "status":"ok"}
    else:
        raise HTTPException(status_code=400,detail="CSV columns do not match")


@app.post("/resultvalidation")
async def get_response(file: UploadFile = File(...),
    validStart: str = Form(...),
    validEnd: str = Form(...),
    model: str =Form(...)
):
    model_bytes = base64.b64decode(model)
    model = pickle.loads(model_bytes)
    df_iterator = pd.read_csv(file.file, chunksize=10000)

    total_rows = 0
    total_cols = 0

    for chunk in df_iterator:
        total_rows += len(chunk)
        total_cols = len(chunk.columns)
    
    output_data={ 
        "timestamp1":0,
        "timestamp2":1
    }
    return output_data
    
@app.post("/predictstream")
async def stream_predictions(file:UploadFile=File(...)):
    contents = await file.read()
    decoded = contents.decode('utf-8')
    reader = csv.reader(io.StringIO(decoded))
    async def generate():
        for row in reader:
            # Replace with your real model prediction logic
            prediction = {"input": row, "output": 1}  # dummy prediction
            yield f"{json.dumps(prediction)}\n"
            await asyncio.sleep(0.05)
    
    return StreamingResponse(generate(), media_type="text/plain")


if __name__ == "__main__":
    uvicorn.run(app,port=6969)