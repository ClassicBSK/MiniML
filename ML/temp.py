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
import logging
import numpy as np
from sklearn.metrics import accuracy_score, log_loss, confusion_matrix
logging.basicConfig(level=logging.INFO)
app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def generate_updated_csv(file_bytes):
    
    buffer = io.BytesIO(file_bytes)
    df_iterator = pd.read_csv(buffer, chunksize=10000)

    header_written = False
    start = pd.Timestamp.now().replace(microsecond=0) 
    for chunk in df_iterator:
        if("Timestamps" not in list(chunk.columns)):
            chunk['Timestamps'] = pd.date_range(start=start , periods=len(chunk) , freq = 's')
            start=chunk['Timestamps'].iloc[-1]+pd.Timedelta(seconds=1)
            
        
        string_buf = io.StringIO()
        chunk.to_csv(string_buf, index=False, header=not header_written)
        header_written = True
        yield string_buf.getvalue().encode("utf-8")  # Send bytes

@app.post("/csvfilepush")
async def process_csv_file(file: UploadFile = File(...)):
    file_bytes = await file.read()
    return StreamingResponse(
        generate_updated_csv(file_bytes),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=updated.csv"}
    )

@app.post("/csvdetails")
async def get_response(file: UploadFile = File(...)):
    logging.info("here1")
    df_iterator = pd.read_csv(file.file, chunksize=10000)
    logging.info("here2")

    total_rows = 0
    total_cols = 0
    count=0
    first=0
    last=0
    i=0
    for chunk in df_iterator:
        
        if ("Response" not in list(chunk.columns)):
            raise HTTPException(status_code=400,detail="No response field")
        columns , rows = chunk.shape[1] , len(chunk)
        total_rows=total_rows+rows
        # logging.info(list(chunk.columns))
        total_cols=columns
        count += chunk['Response'].sum()
        if i==0:
            first=chunk['Timestamps'].iloc[0]
            i+=1
        last = chunk['Timestamps'].iloc[-1]
         # set once
    passrate=count*100/total_rows
    
    return {"recordsCount": total_rows, "columnCount": total_cols,"pass_rate":passrate,"startDate":pd.Timestamp(first).isoformat(timespec="seconds"),"endDate":pd.Timestamp(last).isoformat(timespec="seconds")}
   


@app.post("/rangedata")
async def get_response(file: UploadFile = File(...),trainStart: str = Form(...),
    trainEnd: str = Form(...),
    testStart: str = Form(...),
    testEnd: str = Form(...),
    validStart: str = Form(...),
    validEnd: str = Form(...),
    
    ):
    df_iterator = pd.read_csv(file.file, chunksize=10000)

    
    trainStart=pd.Timestamp(trainStart)
    trainEnd=pd.Timestamp(trainEnd)
    testStart=pd.Timestamp(testStart)
    testEnd=pd.Timestamp(testEnd)
    validStart=pd.Timestamp(validStart)
    validEnd=pd.Timestamp(validEnd)
    

    train_all=[]
    test_all=[]
    valid_all=[]
    for chunk in df_iterator:
        # logging.info(list(chunk.columns))
        chunk["Timestamps"] = pd.to_datetime(chunk["Timestamps"])
        train_all.append( chunk[(chunk["Timestamps"] >= trainStart) & (chunk["Timestamps"] <= trainEnd)])
        test_all.append(chunk[(chunk["Timestamps"] >= testStart) & (chunk["Timestamps"] <= testEnd)])
        valid_all.append(chunk[(chunk["Timestamps"] >= validStart) & (chunk["Timestamps"] <= validEnd)])
    
    df_train=pd.concat(train_all,ignore_index=True)
    df_test=pd.concat(test_all,ignore_index=True)
    df_valid=pd.concat(valid_all,ignore_index=True)
    # logging.info(len(df_train))
    df_train['ones'] = np.ones(len(df_train))
    df_test['ones'] = np.ones(len(df_test))
    df_valid['ones'] = np.ones(len(df_valid))
    if(len(df_train)!=0):
        train_count = df_train.groupby(df_train.Timestamps.dt.month)['ones'].sum().astype(int).to_dict()
    else:
        train_count={}
    if(len(df_test)!=0):   
        test_count = df_test.groupby(df_test.Timestamps.dt.month)['ones'].sum().astype(int).to_dict()
    else:
        test_count={}
    if(len(df_valid)!=0):
        valid_count = df_valid.groupby(df_valid.Timestamps.dt.month)['ones'].sum().astype(int).to_dict()
    else:
        valid_count={}
    df_train.drop(['ones'], axis=1, inplace=True)
    df_test.drop(['ones'], axis=1, inplace=True)
    df_valid.drop(['ones'], axis=1, inplace=True)
    ans={'trainData': train_count , 'testData':test_count , 'validData':valid_count}
    # logging.info(ans)
    return ans
   

@app.post("/trainmodel")
async def get_response(file: UploadFile = File(...),trainStart: str = Form(...),
    trainEnd: str = Form(...),
    testStart: str = Form(...),
    testEnd: str = Form(...),
    validStart: str = Form(...),
    validEnd: str = Form(...),
    
    ):
    trainStart=pd.Timestamp(trainStart)
    trainEnd=pd.Timestamp(trainEnd)
    testStart=pd.Timestamp(testStart)
    testEnd=pd.Timestamp(testEnd)
    validStart=pd.Timestamp(validStart)
    validEnd=pd.Timestamp(validEnd)
    model = None
    params = {
        'objective': 'binary:logistic',
        'eval_metric': ['logloss', 'error'],
        'tree_method': 'hist',
    }

    df_iterator = pd.read_csv(file.file, chunksize=10000)
    train_all=[]
    test_all=[]
    valid_all=[]
    for chunk in df_iterator:
        # logging.info(list(chunk.columns))
        chunk["Timestamps"] = pd.to_datetime(chunk["Timestamps"])
        train_all.append( chunk[(chunk["Timestamps"] >= trainStart) & (chunk["Timestamps"] <= trainEnd)])
        test_all.append(chunk[(chunk["Timestamps"] >= testStart) & (chunk["Timestamps"] <= testEnd)])
    df_train=pd.concat(train_all,ignore_index=True)
    df_test=pd.concat(test_all,ignore_index=True)
    # logging.info(f"train columns: {df_train.head()}")
    y_train = df_train['Response']
    X_train = df_train.drop(columns=["Response", "Timestamps"])
    
    
    logging.info(f"Train: {y_train.nunique()}")
    dtrain = xgb.DMatrix(X_train, label=y_train)
    X_test = df_test.drop(columns=["Response", "Timestamps"])
    y_test = df_test["Response"]
    logging.info(f"Test: {y_test.nunique()}")
    dtest = xgb.DMatrix(X_test,label=y_test)
    evals_result={}
    model = xgb.train(params, dtrain, num_boost_round=10,evals=[(dtrain, 'train'), (dtest, 'test')],
    evals_result=evals_result,verbose_eval=False)
    
    

    y_pred_prob = model.predict(dtest)
    y_pred = (y_pred_prob > 0.5).astype(int)

    test_accuracy = accuracy_score(y_test, y_pred)
    test_loss = log_loss(y_test, y_pred_prob)
    tn, fp, fn, tp = confusion_matrix(y_test, y_pred).ravel()

    train_error = evals_result['train']['error']
    test_error = evals_result['test']['error']

    train_accuracy = [1 - e for e in train_error]
    test_accuracy = [1 - e for e in test_error]
    model_bytes = pickle.dumps(model)
    model_base64 = base64.b64encode(model_bytes).decode("utf-8")
    # print(model_base64)
    return {"model":model_base64,"tp":int(tp),"tn":int(tn),"fp":int(fp),"fn":int(fn),
                "train": {
                    "loss": evals_result['train']['logloss'],
                    "accuracy": train_accuracy
                },
                "test": {
                    "loss": evals_result['test']['logloss'],
                    "accuracy": test_accuracy
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
    
    logging.info(list(set(train_columns)-set(valid_columns)))
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
    validStart=pd.Timestamp(validStart)
    validEnd=pd.Timestamp(validEnd)
    valid_all=[]
    for chunk in df_iterator:
        # logging.info(list(chunk.columns))
        chunk["Timestamps"] = pd.to_datetime(chunk["Timestamps"])
        
        valid_all.append(chunk[(chunk["Timestamps"] >= validStart) & (chunk["Timestamps"] <= validEnd)])
    df_valid=pd.concat(valid_all,ignore_index=True)
    X_valid = df_valid.drop(columns=["Response", "Timestamps"])
    logging.info(f"valid columns:{list(X_valid.columns)}")
    y_valid = df_valid["Response"]
    timestamps_valid = df_valid["Timestamps"]

    dvalid = xgb.DMatrix(X_valid)   
    y_pred_valid = model.predict(dvalid)
    output_data = {
        str(timestamps_valid.iloc[i]): int((y_pred_valid[i] > 0.5))
        for i in range(len(y_pred_valid))
    }
    # logging.info(output_data)
    
    return output_data
    
@app.post("/predictstream")
async def stream_predictions(file:UploadFile=File(...),model: str =Form(...)):
    contents = await file.read()
    decoded = contents.decode('utf-8')
    reader = csv.reader(io.StringIO(decoded))
    model_bytes = base64.b64decode(model)
    model = pickle.loads(model_bytes)
    
    header = next(reader)

    async def generate():
        for row in reader:
            df_row = pd.DataFrame([row], columns=header)
            if 'Response' in df_row.columns:
                 df_row = df_row.drop(columns=['Response'])
            for col in df_row.columns:
                df_row[col] = pd.to_numeric(df_row[col], errors='ignore')  # Ignore timestamp or categorical fields
                
            if 'Timestamps' in df_row.columns:
                 df_row = df_row.drop(columns=['Timestamps'])
            dmatrix = xgb.DMatrix(df_row)
            y_pred = model.predict(dmatrix)[0]  # Single prediction
            class_pred = int(y_pred > 0.5)
            prediction = {
                "input": row,
                "probability": float(y_pred),
                "prediction": class_pred
            }
            # Replace with your real model prediction logic
             # dummy prediction
            yield f"{json.dumps(prediction)}\n"
            await asyncio.sleep(0.05)
    
    return StreamingResponse(generate(), media_type="text/plain")


if __name__ == "__main__":
    uvicorn.run(app,port=6969,timeout_keep_alive=300)