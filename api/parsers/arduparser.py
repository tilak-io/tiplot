import pandas as pd
from cesium_entity import CesiumEntity
from .parser import Parser
from pymavlink import mavutil

class ArduParser(Parser):
    def __init__(self):
        super().__init__()
        self.name = "ardu_parser"
        self.initDefaultEntity()
        self.initEntities()

    def parse(self,filename):
        mlog = mavutil.mavlink_connection(filename)
        buf = {}
        
        while mlog.remaining:
            m = mlog.recv_match()
            if (m is None): break
            name = m.get_type()
            data = m.to_dict()
            if 'TimeUS' in list(data.keys()):
                data['timestamp_tiplot'] = data['TimeUS'] / 1e6
            else:
                #ignore tables with no timestamp
                continue

            if(name in buf):
                del data['mavpackettype']
                buf[name].append(data)
            else:
                clean_dict = m.to_dict()
                del clean_dict['mavpackettype']
                buf[name] = [clean_dict]
                
        self.datadict = {i:pd.DataFrame(buf[i]).bfill() for i in buf}
        return [self.datadict, self.entities]


    def initDefaultEntity(self):
        self.default_entity = CesiumEntity(name='ardu pilot default entity',
                              useRPY=False,
                              useXYZ=False,
                              color="#ffffff",
                              pathColor="#0000ff",
                              position={
                                  'table':'AHR2',
                                  'longitude': 'Lng',
                                  'lattitude': 'Lat',
                                  'altitude': 'Alt',
                              },
                              attitude={
                                  'table':'AHR2',
                                  'q0':'Q1',
                                  'q1':'Q2',
                                  'q2':'Q3',
                                  'q3':'Q4',
                              })

    def setDefaultEntities(self):
        self.addEntity(self.default_entity)
