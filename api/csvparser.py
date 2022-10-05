
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
        self.datadict = {"data": csv} 
        return [self.datadict, self.entities]

    def initDefaultEntities(self):
        entity = CesiumEntity(
            name='csv default entity', 
            alpha=1,
            useRPY=True,
            position={
                'table':'data',
                'longitude':'lon_x',
                'lattitude':'lat_x',
                'altitude':'altitude_x',
            },
            attitude={
                'table':'data',
                'roll':'roll_x',
                'pitch':'pitch_x',
                'yaw':'yaw_x',
            })
        self.addEntity(entity) 
