import math
import pandas as pd
import struct
from parser import Parser
from cesium_entity import CesiumEntity

class DJIParser(Parser):
    def __init__(self):
        super().__init__()
        self.name = "dji_parser"
        self.initDefaultEntitiy()
        self.initEntities()

    def quaternionToEuler(self,q):
    
        #roll (x-axis rotation)
        sinr_cosp = 2 * (q['quatW'] * q['quatX'] + q['quatY'] * q['quatZ'])
        cosr_cosp = 1 - 2 * (q['quatX'] * q['quatX'] + q['quatY'] * q['quatY'])
        q['roll'] = math.atan2(sinr_cosp, cosr_cosp)

        #pitch (y-axis rotation)
        sinp = 2 * (q['quatW'] * q['quatY'] - q['quatZ'] * q['quatX'])
        if (abs(sinp) >= 1):
            q['pitch'] = math.copysign(math.pi/ 2, sinp)
        else:
            q['pitch']= math.asin(sinp)

        #yaw (z-axis rotation)
        siny_cosp = 2 * (q['quatW'] * q['quatZ'] + q['quatX'] * q['quatY'])
        cosy_cosp = 1 - 2 * (q['quatY'] * q['quatY'] + q['quatZ'] * q['quatZ'])
        q['yaw'] = math.atan2(siny_cosp, cosy_cosp)
    
        return q

    def parse(self,filename):
        f = open(filename,'rb')
        print(filename)
        buffer = f.read()
        packets = []
        for index in range(128,len(buffer)):
            if(index<(len(buffer)-2) and buffer[index]==0x55 and buffer[index+2]==0x00): ## New Packet
                header = struct.unpack('<BBBBBBI',buffer[index:index+10])
                fields = ['magicNb','packetLen','padding','packetType','packetSubType','msg','tickNb']
                header = {i[0]:i[1] for i in zip(fields,header)}
                header['payload'] = buffer[index+10:index+10+header['packetLen']]
                packets.append(header)

        gps_packets = [p for p in packets if(p['packetType']==0xcf and p['packetSubType']==0x01)]
        gps_data = []
        for p in gps_packets:

            fields = ['longitude', 'latitude', 'altitude', 'accelX', 'accelY', 'accelZ', 'gyroX', 'gyroY', 'gyroZ', 'baroAlt', 'quatW', 'quatX',
            'quatY', 'quatZ', 'errorX', 'errorY', 'errorZ', 'velN', 'velE', 'velD', 'x4', 'x5', 'x6', 'magX', 'magY', 'magZ', 'imuTemp', 'i2', 'i3',
            'i4', 'i5','satNum']
                    
            gps_format = '<ddfffffffffffffffffffffhhhhhhhhB'
            if(len(p['payload'])==0x84):
                data = struct.unpack(gps_format,p['payload'][:117])
                data = {i[0]:i[1] for i in zip(fields,data)}
                
                ## Sanity check
                if(data['latitude']>-math.pi and data['latitude']<math.pi 
                   and abs(data['longitude'])>0.0175 and abs(data['latitude'])>0.0175):
                    ## lon/lat in degrees
                    data['longitude']=math.degrees(data['longitude'])
                    data['latitude']=math.degrees(data['latitude'])
                    data['time']=p['tickNb']
                    data = self.quaternionToEuler(data)
                    gps_data.append(data)

        out = pd.DataFrame(gps_data).bfill()
        out['timestamp_tiplot'] = out['time'] - out['time'][0]
        out = out.fillna(0)
        self.datadict = {"data": out} 
        return [self.datadict, self.entities]

    def initDefaultEntitiy(self):
        self.default_entity = CesiumEntity(
            name='dji dat default entity',
            useRPY=True,
            useXYZ=False,
            position={
                'table':'data',
                'longitude':'longitude',
                'lattitude':'latitude',
                'altitude':'altitude',
            },
            attitude={
                'table':'data',
                'roll':'roll',
                'pitch':'pitch',
                'yaw':'yaw',
            })

    def setDefaultEntities(self):
        self.addEntity(self.default_entity)
