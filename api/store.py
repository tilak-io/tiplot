import pandas as pd
import logging
import threading

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
        for e in self.entities:
            if e.useRPY:
                merged = pd.merge_asof(self.datadict[e.position['table']], self.datadict[e.attitude['table']], on='timestamp').bfill()
                raw = merged[[e.position['altitude'], e.position['lattitude'], e.position['longitude'],e.attitude['roll'],e.attitude['pitch'],e.attitude['yaw'],'timestamp']]
                renamed = raw.rename(columns={e.position['longitude']: 'longitude', e.position['altitude']: 'altitude',e.position['lattitude']: 'lattitude', e.attitude['roll'] : 'roll',e.attitude['pitch'] : 'pitch',e.attitude['yaw'] : 'yaw'}).to_dict('records')
                data.append({ "id": e.id,"entity_name": e.name,"alpha": e.alpha,  "useRPY": e.useRPY,"props": renamed})
            else:
                merged = pd.merge_asof(self.datadict[e.position['table']], self.datadict[e.attitude['table']], on='timestamp').bfill()
                raw = merged[[e.position['altitude'], e.position['lattitude'], e.position['longitude'],e.attitude['q0'],e.attitude['q1'],e.attitude['q2'], e.attitude['q3'],'timestamp']]
                renamed = raw.rename(columns={e.position['longitude']: 'longitude', e.position['altitude']: 'altitude',e.position['lattitude']: 'lattitude', e.attitude['q0'] : 'q0',e.attitude['q1'] : 'q1',e.attitude['q2'] : 'q2',e.attitude['q3'] : 'q3'}).to_dict('records')
                data.append({"id": e.id,"entity_name": e.name,"alpha": e.alpha,  "useRPY": e.useRPY,"props": renamed})
        return data

    def getEntities(self):
        data = []
        for e in self.entities:
            data.append({"id": e.id, "name": e.name})
        return data

    def getNestedFromKey(self,key):
        nested = list(self.datadict[key].keys())
        return nested

    def getNestedKeys(self):
        keys = list(self.datadict.keys())
        nested = []
        for key in self.datadict.keys():
            k = list(self.datadict[key].keys())
            nested.append({key: k})
        return nested

