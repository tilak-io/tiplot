import pandas as pd

class Parser:
    def __init__(self):
        self.name = "Generic Parser"
        self.entities = []
        self.datadict = {}
        self.layout = None
        self.initDefaultEntities()

    def parse(self,filename):
        print("Parsing file")

    def addEntity(self,entity):
        self.entities.append(entity)

    def setLayout(self, layout):
        self.layout = layout

    def initDefaultEntities(self):
        pass
