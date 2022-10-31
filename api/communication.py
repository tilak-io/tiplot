from flask import signals
import zmq, zlib, time
import pickle5 as pickle
from cesium_entity import CesiumEntity
from parser import Parser
from ulgparser import ULGParser
from threading import Thread
import store

class Comm(Thread):
    def __init__(self, io=None, port=5555):
        self.delay = 0.5
        super(Comm, self).__init__()
        self.port = port
        self.context = zmq.Context()
        self.socket = self.context.socket(zmq.REP)
        self.io = io
        try:
            self.socket.bind("tcp://*:%s" % port)
            print('-> binded on %s' % (self.socket.LAST_ENDPOINT).decode('utf-8'))
        except:
            print('~> addr in use')


    def send_zipped_pickle(self, obj, flags=0, protocol=-1):
        p = pickle.dumps(obj, protocol)
        z = zlib.compress(p)
        return self.socket.send(z, flags=flags)

    def recv_zipped_pickle(self, flags=0, protocol=-1):
        # print('-> waiting for data')
        z = self.socket.recv(flags)
        p = zlib.decompress(z)
        return pickle.loads(p)

    def map_entities(self, entities):
        mapped = []
        for entity in entities:
            mapped.append(CesiumEntity.fromJson(entity))
        return mapped


    def listen_for_data(self):
        parser = ULGParser()
        while True:
            try:
                [datadict, json_entities] = self.recv_zipped_pickle(zmq.NOBLOCK)
                entities = self.map_entities(json_entities)
                print('-> data recieved...')
                self.io.emit('entities_loaded', json_entities)
                store.Store.get().setStore(datadict, entities)
                self.send_zipped_pickle('hi')
            except zmq.Again as e:
                pass
            time.sleep(self.delay)

    def run(self):
        self.listen_for_data()
