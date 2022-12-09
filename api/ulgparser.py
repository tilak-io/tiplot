import pyulog
import pandas as pd
from cesium_entity import CesiumEntity
from parser import Parser

class ULGParser(Parser):
    def __init__(self):
        super().__init__()
        self.name = "ulg_parser"
        self.ulg = None
        self.initDefaultEntity()
        self.initEntities()

    def parse(self,filename):
        self.ulg = pyulog.ULog(filename)
        self.datadict = {}
        for data in self.ulg.data_list:
            if data.multi_id > 0:
                name = f"{data.name}_{data.multi_id}"
            else:
                name = data.name
            self.datadict[name] = pd.DataFrame(data.data)
            self.datadict[name]['timestamp_tiplot'] = self.datadict[name]['timestamp'] / 1e6
        return [self.datadict, self.entities]

    def initDefaultEntity(self):
        self.default_entity = CesiumEntity(name='ulg default entity',
                              color="#ffffff",
                              pathColor="#0000ff",
                              useRPY=False,
                              useXYZ=True,
                              position={
                                  'table':'vehicle_local_position',
                                  'x':'x',
                                  'y':'y',
                                  'z':'z',
                              },
                              attitude={
                                  'table':'vehicle_attitude',
                                  'q0':'q[0]',
                                  'q1':'q[1]',
                                  'q2':'q[2]',
                                  'q3':'q[3]',
                              })

    def setDefaultEntities(self):
        self.addEntity(self.default_entity)
