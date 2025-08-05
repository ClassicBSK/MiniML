import pandas as pd
import numpy as np
from sklearn.tree import DecisionTreeClassifier
from sklearn.metrics import confusion_matrix , recall_score , f1_score , precision_score ,accuracy_score
from fastapi import FastAPI
from pydantic import BaseModel

app = FastAPI()


class Requestbody(BaseModel):
    dataset:dict
    time:str






@app.post('/dataset')
def append_date(data:Requestbody):
    df = pd.DataFrame(data.dataset)
    
    start = pd.Timestamp(data.time)

    df['Timestamps'] = pd.date_range(start , len(df) , freq = 'S')

    columns , rows = df.shape[0] , df.shape[1]
    count = df['Response'].sum()
    pass_rate = count*100 / rows
    first , last = df['Timestamps'][0] , df['Timestamps'][-1]

    return {'columns':columns , 'rows':rows , 'pass_rate':pass_rate , 'first_time_stamp':first , 'last_time_stamp':last}

    



    
    


def train_test_sim_split(df ,train_start, train_end , test_start ,test_end, sim_start , sim_end):
    df_train = df[(df["Timestamp"] >= train_start) & (df["Timestamp"] <= train_end)]
    df_test = df[(df["Timestamp"] >= test_start) & (df["Timestamp"] <= test_end)]
    df_sim = df[(df["Timestamp"] >= sim_start) & (df["Timestamp"] <= sim_end)]

    return {'train_data': df_train , 'test_data':df_test , 'sim_data':df_sim}
    


def count_month(df_train , df_test , df_sim):
    df_train['ones'] = np.ones(len(df_train))
    df_test['ones'] = np.ones(len(df_test))
    df_sim['ones'] = np.ones(len(df_sim))
    train_count = df_train.groupby(df_train.Timestamp.dt.month)['ones'].sum()
    test_count = df_train.groupby(df_test.Timestamp.dt.month)['ones'].sum()
    sim_count = df_train.groupby(df_sim.Timestamp.dt.month)['ones'].sum()
    df_train.drop(['ones']) , df_test.drop(['ones']) , df_sim.drop(['ones'])

    return {'train_count':train_count , 'test_count':test_count ,'sim_count':sim_count}
    


    

def train_model(train_data ,test_data):
    
    x_train , y_train = train_data.drop(['Response']) , train_data['Response']
    x_test , y_test = test_data.drop(['Response']) , test_data['Response']
    model = DecisionTreeClassifier(criterion='gini' , random_state=42)
    model.fit(x_train,y_train)
    y_pred = model.predict(x_test)
    cm = confusion_matrix(y_test , y_pred)
    acc = accuracy_score(y_test , y_pred)
    f1 = f1_score(y_test , y_pred)
    prec = precision_score(y_test ,y_pred)
    recall = recall_score(y_test , y_pred)

    return {'confusion_matrix':cm , 'accuracy':acc , 'f1_score':f1,'precision':prec,'recall':recall}













