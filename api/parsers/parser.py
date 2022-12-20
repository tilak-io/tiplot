from cesium_entity import CesiumEntity
from os import path, makedirs
import json

class Parser:
    def __init__(self):
        self.name = "generic_parser"
        self.entities = []
        self.datadict = {}


    def parse(self,filename):
        print("Parsing file:" + filename)

    def addEntity(self,entity):
        self.entities.append(entity)

    def setLayout(self, layout):
        self.layout = layout

    def setDefaultEntities(self): pass

    def initEntities(self):
        config_folder = path.expanduser("~/Documents/tiplot/config/")
        if not path.exists(config_folder):
            makedirs(config_folder)
        config_file = config_folder + self.name + ".json"
        if (path.exists(config_file)):
            # print("+ " + self.name + " config found")
            # print("+ " + config_file)
            file = open(config_file)
            entities = json.load(file)
            for entity in entities:
                mapped_entity = CesiumEntity.fromJson(entity)
                self.addEntity(mapped_entity)
        else:
            # print("- " + self.name + " config not found")
            # print("- " + config_file)
            # print("- Using default config for: " + self.name)
            self.setDefaultEntities()
