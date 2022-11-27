import pandas as pd
import numpy as np
from cesium_entity import CesiumEntity
from parser import Parser

class CSVParser(Parser):
    def __init__(self):
        super().__init__()
        self.name = "csv_parser"
        self.initEntities()

    def parse(self,filename):
        csv = pd.read_csv(filename)
        start_time = pd.to_datetime(csv['timestamp'][0])
        time_delta = (pd.to_datetime(csv['timestamp']) - start_time)
        seconds = time_delta / np.timedelta64(1, 's')
        micro_seconds = time_delta / np.timedelta64(1, 'us')
        csv['timestamp'] = micro_seconds
        csv['timestamp_tiplot'] = seconds
        self.datadict = {"data": csv} 
        return [self.datadict, self.entities]

    def setDefaultEntities(self):
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
