from flask import Flask,jsonify,request
from flask_cors import CORS, cross_origin
import time,glob,os
import pandas as pd

class HttpServer:
    def __init__(self,parser):
        self.app = Flask(__name__)
        self.cors = CORS(self.app)
        self.app.config['CORS_HEADERS'] = 'Content-Type'
        self.parser = parser
        self.create_routes()

    def run(self, port=5000):
        self.app.run(host="0.0.0.0", port=port)

    def create_routes(self):
        #os.system('clear')
        app = self.app
        logs_dir = os.path.expanduser("~/Documents/tiplot/logs/")
        if not os.path.exists(logs_dir):
            os.makedirs(logs_dir)

        @app.route("/list_dir")
        def list_dir():
            files = [(os.path.basename(x), os.path.getsize(x) >> 20, time.strftime('%Y-%m-%d %H:%M:%S', time.localtime(os.path.getmtime(x)))) for x in glob.glob(logs_dir + '/*')]
            return { 'path': logs_dir, 'files': files}

        @app.route("/select/<file>")
        def select_log(file):
            try:
                self.datadict = self.parser.parse(logs_dir+file)
                ok = True
            except:
                print('something went wrong')
                ok = False
            return {'ok': ok}

        @app.route('/entities')
        def get_entities():
            props = self.parser.getEntitiesProps()
            return props

        @app.route('/takeoff_position')
        def get_takeoff_position():
            data = []
            for entity in self.parser.entities:
                takeoff_position = self.parser.datadict['vehicle_gps_position'][['lon', 'lat', 'alt', 'timestamp']].to_dict('records')[0]
                data.append({"entity_name": entity.name, "takeoff_position": takeoff_position})
            return data

        @app.route('/keys')
        def get_nested_keys():
            result = self.parser.getNestedKeys()
            return result

        @app.route('/key/<key>')
        def get_nested(key):
            nested_keys = self.parser.getNestedFromKey(key)
            return nested_keys


        @app.route('/values/<key>/<nested>')
        def get_values(key,nested):
            req = nested
            keys = req.split('|')
            keys.append('timestamp')
            data = self.parser.datadict[key][keys].fillna(0).to_dict('records')
            return {'values': data}

        @app.route('/valuesxy/<key>/<x>/<y>')
        def get_valuesxy(key,x,y):
            data = self.parser.datadict[key][[x,y]].fillna(0).to_dict('records')
            return {'values': data}
