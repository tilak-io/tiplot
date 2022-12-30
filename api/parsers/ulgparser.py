import pyulog
import pandas as pd
from cesium_entity import CesiumEntity
import math
from .parser import Parser

class ULGParser(Parser):
    def __init__(self):
        super().__init__()
        self.name = "ulg_parser"
        self.ulg = None
        self.initDefaultEntity()
        self.initEntities()

    def euler_from_quaternion(self, w, x, y, z):
        angles = {}

        #roll(x-axis rotation)
        sinr_cosp = 2 * (w * x + y * z);
        cosr_cosp = 1 - 2 * (x * x + y * y);
        angles['roll'] = math.atan2(sinr_cosp, cosr_cosp);

        #pitch (y-axis rotation)
        sinp = 2 * (w * y - z * x);
        if (abs(sinp) >= 1):
            angles['pitch'] = math.copysign(math.pi / 2, sinp); # use 90 degrees if out of range
        else:
            angles['pitch'] = math.asin(sinp);

        # yaw (z-axis rotation)
        siny_cosp = 2 * (w * z + x * y);
        cosy_cosp = 1 - 2 * (y * y + z * z);
        angles['yaw'] = math.atan2(siny_cosp, cosy_cosp);

        return angles

    def add_euler(self,datadict):
        a=datadict['vehicle_attitude']

        result = []
        for i in a.to_dict(orient='record'):
            result.append(self.euler_from_quaternion(
                i['q[0]'],
                i['q[1]'],
                i['q[2]'],
                i['q[3]'],))
        
        r = pd.DataFrame(result)
        a['pitch'] = r['pitch']
        a['roll'] = r['roll']
        a['yaw'] = r['yaw']

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
        self.add_euler(self.datadict)
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
