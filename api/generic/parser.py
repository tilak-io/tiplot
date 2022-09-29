import pandas as pd

class Parser:
    def __init__(self):
        self.name = "Generic Parser"
        self.entities = []
        self.datadict = None
        self.layout = None
        self.initDefaultEntities()

    def parse(self,filename):
        print("Parsing file")

    def addEntity(self,entity):
        self.entities.append(entity)

    def setLayout(self, layout):
        self.layout = layout

    def getKeys(self):
        keys = list(self.datadict.keys())
        return keys

    def getEntitiesProps(self):
        data = []
        for e in self.entities:
            merged = pd.merge_asof(self.datadict[e.position['table']], self.datadict[e.attitude['table']], on='timestamp').bfill()
            raw = merged[[e.position['altitude'], e.position['lattitude'], e.position['longitude'],e.attitude['q0'],e.attitude['q1'],e.attitude['q2'], e.attitude['q3'],'timestamp']]
            renamed = raw.rename(columns={e.position['longitude']: 'longitude', e.position['altitude']: 'altitude',e.position['lattitude']: 'lattitude', e.attitude['q0'] : 'q0',e.attitude['q1'] : 'q1',e.attitude['q2'] : 'q2',e.attitude['q3'] : 'q3'}).to_dict('records')
            data.append({"entity_name": e.name,"alpha": e.alpha,  "props": renamed})
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

    def initDefaultEntities():
        pass

