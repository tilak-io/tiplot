import zmq
import zlib
import pickle5 as pickle
from cesium_entity import CesiumEntity
from parser import Parser
from ulgparser import ULGParser
import threading
import socket
#from store import Store
import store


class Comm(threading.Thread):
    def __init__(self, server=None, port=5555):
        threading.Thread.__init__(self)
        # setting daemon to true => kill the thread on exit
        self.setDaemon(True)
        self.server = server
        self.port = port
        self.context = zmq.Context()
        self.socket = self.context.socket(zmq.REP)
        try:
            self.socket.bind("tcp://*:%s" % port)
            print('-> binded')
        except:
            print('-> addr in use')


    def send_zipped_pickle(self, obj, flags=0, protocol=-1):
        p = pickle.dumps(obj, protocol)
        z = zlib.compress(p)
        return self.socket.send(z, flags=flags)

    def recv_zipped_pickle(self, flags=0, protocol=-1):
        print('-> waiting for data')
        z = self.socket.recv(flags)
        p = zlib.decompress(z)
        return pickle.loads(p)

    def map_entities(self, entities):
        mapped = []
        for entity in entities:
            mapped.append(CesiumEntity.fromJson(entity))
        return mapped

    def run(self):
        parser = ULGParser()
        while True:
            [datadict, entities] = self.recv_zipped_pickle()
            entities = self.map_entities(entities)
            print('-> data recieved...')
            store.Store.get().setStore(datadict, entities)
            self.send_zipped_pickle('hi')
