from parser import Parser
import pyulog
import pandas as pd
from cesium_entity import CesiumEntity

class ULGParser(Parser):
    def __init__(self):
        super().__init__()
        self.name = "ULG Parser"
        self.ulg = None

    def parse(self,filename):
        self.ulg = pyulog.ULog(filename)
        self.datadict = {}
        for data in self.ulg.data_list:
            if data.multi_id > 0:
                name = f"{data.name}_{data.multi_id}"
            else:
                name = data.name
            self.datadict[name] = pd.DataFrame(data.data)
        return [self.datadict, self.entities]

    def initDefaultEntities(self):
        entity = CesiumEntity(name='ulg default entity',
                              position={
                                  'table':'vehicle_global_position',
                                  'longitude':'lon',
                                  'lattitude':'lat',
                                  'altitude':'alt',
                              },
                              attitude={
                                  'table':'vehicle_attitude',
                                  'q0':'q[0]',
                                  'q1':'q[1]',
                                  'q2':'q[2]',
                                  'q3':'q[3]',
                              })
        self.addEntity(entity) 
