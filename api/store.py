import pandas as pd
import threading
from cesium_entity import CesiumEntity

class Store:
    __instance = None
    @staticmethod
    def get():
        __lock = threading.Lock()
        with __lock:
            if Store.__instance is None:
                print("~> Store created")
                Store()
            return Store.__instance

    def __init__(self):
        __lock = threading.Lock()
        with __lock:
            if Store.__instance is not None:
                raise Exception("this class is a singleton!")
            else:
                Store.__instance = self

            self.datadict = {}
            self.entities = []
            self.lock = threading.Lock()

    def getStore(self):
        with self.lock:
            return {'entities':self.entities, 'datadict':self.datadict}

    def setStore(self,datadict,entities):
        with self.lock:
            self.datadict = datadict
            self.entities = entities

    def getKeys(self):
        keys = list(self.datadict.keys())
        return keys

    def getEntitiesProps(self):
        data = []
        err = None
        for e in self.entities:
            try:
                if (e.position['table'] == e.attitude['table']):
                    merged = pd.DataFrame.from_dict(self.datadict[e.position['table']])
                else:
                    merged = pd.merge_asof(self.datadict[e.position['table']], self.datadict[e.attitude['table']], on='timestamp_tiplot').bfill()
                if e.useXYZ:
                    position_columns = [e.position['x'], e.position['y'], e.position['z']]
                    position_columns_mapped = { e.position['x']: 'x', e.position['y']: 'y', e.position['z']: 'z'}
                else:
                    position_columns = [e.position['altitude'], e.position['lattitude'], e.position['longitude']]
                    position_columns_mapped = { e.position['longitude']: 'longitude', e.position['altitude']: 'altitude', e.position['lattitude']: 'lattitude'}
                if e.useRPY:
                    attitude_columns = [e.attitude['roll'], e.attitude['pitch'], e.attitude['yaw']]
                    attitude_columns_mapped = {e.attitude['roll'] : 'roll', e.attitude['pitch'] : 'pitch', e.attitude['yaw'] : 'yaw'}
                else:
                    attitude_columns = [e.attitude['q0'],e.attitude['q1'],e.attitude['q2'], e.attitude['q3']]
                    attitude_columns_mapped = {e.attitude['q0'] : 'q0', e.attitude['q1'] : 'q1', e.attitude['q2'] : 'q2', e.attitude['q3'] : 'q3'}
                columns = position_columns + attitude_columns + ['timestamp_tiplot']
                mapped_columns = {}
                mapped_columns.update(position_columns_mapped)
                mapped_columns.update(attitude_columns_mapped)
                raw = merged[columns]
                renamed = raw.rename(columns=mapped_columns).to_dict('records')
                data.append({"id": e.id,
                             "entity_name": e.name,
                             "alpha": e.alpha,
                             "useRPY": e.useRPY,
                             "useXYZ": e.useXYZ,
                             "props": renamed,
                             "color": e.color,
                             "wireframe": e.wireframe,
                             "tracked": e.tracked,
                             "pathColor": e.pathColor})
            except KeyError as error:
                err = str(error)
                print("-> Error " + str(error))
        return data, err

    def getEntities(self):
        data = []
        for e in self.entities:
            data.append(e.toJson())
        return data

    def setEntities(self, entities):
        mapped = []
        for entity in entities:
            mapped.append(CesiumEntity.fromJson(entity))
        self.entities = mapped

    def getTableColumns(self,key):
        nested = list(self.datadict[key].keys())
        return nested

    def getNestedKeys(self):
        nested = []
        for key in self.datadict.keys():
            k = list(self.datadict[key].keys())
            nested.append({key: k})
        return nested

