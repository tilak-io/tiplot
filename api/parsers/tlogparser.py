from pandas import DataFrame
from cesium_entity import CesiumEntity
from .parser import Parser
from pymavlink import mavutil
import datetime

class TLOGParser(Parser):
    def __init__(self):
        super().__init__()
        self.name = "tlog_parser"
        self.initDefaultEntity()
        self.initEntities()
        self.extension = 'tlog'

    def parse(self,filename):
        mlog = mavutil.mavlink_connection(filename)
        buf = {}
        
        while True:
            m = mlog.recv_match()
            if (m is None): break
            data = m.to_dict()
            name = data['mavpackettype']
            data['timestamp_tiplot'] = m._timestamp
            data['time_utc_usec'] = m._timestamp*1e6
            try:
                data['time_utc'] = str(datetime.datetime.fromtimestamp(m._timestamp))
            except:
                pass

            if(name in buf):
                del data['mavpackettype']
                buf[name].append(data)
            else:
                clean_dict = m.to_dict()
                del clean_dict['mavpackettype']
                buf[name] = [clean_dict]
                
        self.datadict = {i:DataFrame(buf[i]).bfill() for i in buf}
        return self.datadict, self.entities


    def initDefaultEntity(self):
        self.default_entity = CesiumEntity(name='tlog default entity',
                              useRPY=True,
                              useXYZ=True,
                              color="#ffffff",
                              pathColor="#0000ff",
                              position={
                                  'table':'LOCAL_POSITION_NED',
                                  'x': 'x',
                                  'y': 'y',
                                  'z': 'z',
                              },
                              attitude={
                                  'table':'ATTITUDE',
                                  'roll':'roll',
                                  'pitch':'pitch',
                                  'yaw':'yaw',
                              })

    def setDefaultEntities(self):
        self.addEntity(self.default_entity)
