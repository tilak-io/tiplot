from pandas import DataFrame
from cesium_entity import CesiumEntity
from .parser import Parser
from os import path
import pickle

class SixArmsBinParser(Parser):
    def __init__(self):
        super().__init__()
        self.name = "sixarms_bin_parser"
        self.initDefaultEntity()
        self.initEntities()
        self.extension = 'bin'

    def canParse(self, filename):
        file_extension = filename.split('.')[-1]

        if(file_extension is not self.extension):
            return False

        # Try to parse the file
        try:
            mlog = mavutil.mavlink_connection(filename)
            m = mlog.recv_match()
            if(m is not None):
                return True
            else:
                return False
        except:
            return False

    def parse(self,filename):

        data = []
        # Load data from pickle file
		with open(pickle_file_path, 'rb') as pickle_file:
            while True:
                try:
                    recordings = pickle.load(pickle_file)
                    data.append(recordings)
                except:
                    break
        return DataFrame(data)

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
 
