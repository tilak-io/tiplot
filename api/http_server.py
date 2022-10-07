from flask import Flask, jsonify, request
from flask_cors import CORS, cross_origin
import time
import glob
import os
import pandas as pd
from ulgparser import ULGParser
from csvparser import CSVParser
from parser import Parser
#from store import Store
import store


class HttpServer():
    def __init__(self, parser=Parser()):
        self.app = Flask(__name__)
        self.cors = CORS(self.app)
        self.app.config['CORS_HEADERS'] = 'Content-Type'
        self.app.use_reloader = False
        self.entities = []
        self.create_routes()

    def run(self, port=5000):
        self.app.run(host="0.0.0.0", port=port)

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
        logs_dir = os.path.expanduser("~/Documents/tiplot/logs/")
        if not os.path.exists(logs_dir):
            os.makedirs(logs_dir)

        @cross_origin()
        @app.route("/list_dir")
        def list_dir():
            files = [(os.path.basename(x), os.path.getsize(x) >> 20, time.strftime(
                '%Y-%m-%d %H:%M:%S', time.localtime(os.path.getmtime(x)))) for x in glob.glob(logs_dir + '/*')]
            return {'path': logs_dir, 'files': files}

        @cross_origin()
        @app.route("/select", methods=['POST'])
        def select_log():
            file = request.json['file']
            ok = self.choose_parser(file, logs_dir)
            self.entities = store.Store.get().getEntities()
            return {'ok': ok}

        @cross_origin()
        @app.route('/entities')
        def get_entities():
            props = store.Store.get().getEntitiesProps()
            return props

        @cross_origin()
        @app.route('/keys')
        def get_nested_keys():
            result = store.Store.get().getNestedKeys()
            return result

        @cross_origin()
        @app.route('/key/<key>')
        def get_nested(key):
            nested_keys = store.Store.get().getNestedFromKey(key)
            return nested_keys

        @cross_origin()
        @app.route('/values', methods=['POST'])
        def get_values():
            table = request.json['table']
            keys = request.json['keys']
            keys.append('timestamp')
            data = store.Store.get().datadict[table][keys].fillna(
                0).to_dict('records')
            return {'values': data}

        @cross_origin()
        @app.route('/listen')
        def get_listen():
            entities = store.Store.get().getEntities()
            changed = self.entities != entities
            if changed:
                self.entities = entities
            return {'entities_changed': changed}
