from flask import Flask, jsonify, request
from flask_cors import CORS, cross_origin
from flask_socketio import SocketIO,emit
import time, glob,os
import pandas as pd
from ulgparser import ULGParser
from csvparser import CSVParser
from parser import Parser
import store


class HttpServer():
    def __init__(self, parser=Parser()):
        self.app = Flask(__name__)
        # self.cors = CORS(self.app)
        CORS(self.app,resources={r"/*":{"origins":"*"}})
        # self.app.config['CORS_HEADERS'] = 'Content-Type'
        self.socketio = SocketIO(self.app,cors_allowed_origins="*")
        self.entities = []
        self.create_routes()

    def run(self, port=5000):
        # self.app.run(host="0.0.0.0", port=port)
        self.socketio.run(self.app, debug=True, port=port)

    def choose_parser(self, file, logs_dir):
        full_path = logs_dir + file
        parsers = [ULGParser(), CSVParser()]
        for p in parsers:
            try:
                [datadict, entities] = p.parse(full_path)
                store.Store.get().setStore(datadict, entities)
                ok = True
                break
            except:
                print("wrong format")
                ok = False
        return ok

    def create_routes(self):
        app = self.app
        io = self.socketio
        logs_dir = os.path.expanduser("~/Documents/tiplot/logs/")
        if not os.path.exists(logs_dir):
            os.makedirs(logs_dir)

        @io.on("connect")
        def connected():
            print("client has connected " + request.sid)
            # emit("connect",{"data":f"id: {request.sid} is connected"})

        @io.on('get_log_files')
        def get_logs():
            files = [(os.path.basename(x), os.path.getsize(x) >> 20, time.strftime(
                '%Y-%m-%d %H:%M:%S', time.localtime(os.path.getmtime(x)))) for x in glob.glob(logs_dir + '/*')]
            data = {'path': logs_dir, 'files': files}
            emit('log_files', data)


        @io.on('select_log_file')
        def select_log_file(file):
            ok = self.choose_parser(file[0], logs_dir)
            self.entities = store.Store.get().getEntities()
            emit('log_selected', ok)

        @io.on('get_entities_props')
        def get_entities():
            props = store.Store.get().getEntitiesProps()
            emit('entities_props', props)

        @io.on('get_table_keys')
        def get_table_keys(index):
            keys = store.Store.get().getNestedKeys()
            response = {"index": index, "keys":keys}
            print(response)
            emit('table_keys', response)

        @io.on('get_table_values')
        def get_table_values(data):
            index = data['index']
            table = data['table']
            keys = data['keys']
            keys.append('timestamp')
            values = store.Store.get().datadict[table][keys].fillna(
                0).to_dict('records')
            response = {"index": index,"y": keys[0], "x": keys[1],"table": table, "values": values}
            emit('table_values', response)

        @io.on('get_table_columns')
        def get_table_columns(data):
            index = data['index']
            table = data['table']
            columns = store.Store.get().getTableColumns(table)
            data = {"index": index,"table": table, "columns": columns}
            emit('table_columns', data)

        @io.on('data')
        def handle_message(data):
            print("data recieved from front: ",str(data))
            # emit("data",{'data':'hehehehehe','id':request.sid},broadcast=True)
            #emit("data",{'data':'hehehehehe','id':request.sid})

        @io.on("disconnect")
        def disconnected():
            print("client has disconnected " + request.sid)
