
from parser import Parser
import pandas as pd
import numpy as np
from datetime import datetime
from cesium_entity import CesiumEntity

class CSVParser(Parser):
    def __init__(self):
        super().__init__()
        self.name = "CSV Parser"

    def parse(self,filename):
        csv = pd.read_csv(filename)
        csv['timestamp'] = pd.to_datetime(csv["timestamp"]).values.astype(np.int64) / 1e4
        csv['q3'] = 1
        self.datadict = {"data": csv} 


    def initDefaultEntities(self):
        entity = CesiumEntity(
            name='drone1', 
            alpha=1,
            position={
                'table':'data',
                'longitude':'lon_x',
                'lattitude':'lat_x',
                'altitude':'altitude_x',
            },
            attitude={
                'table':'data',
                'q0':'roll_x',
                'q1':'pitch_x',
                'q2':'yaw_x',
                'q3':'q3_x',
            })
        self.addEntity(entity) 
