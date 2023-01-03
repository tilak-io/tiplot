from engineio.async_drivers import gevent
from flask import Flask, request, send_file
from flask_socketio import SocketIO, emit
from flask_cors import CORS
from threading import Thread
from time import localtime, strftime
from os import makedirs, path, getcwd
from glob import glob
from communication import Comm
from datetime import datetime
from sys import argv
import store
import json
#import traceback

from parsers.ulgparser import ULGParser 
from parsers.csvparser import CSVParser 
from parsers.djiparser import DJIParser 
from parsers.arduparser import ArduParser 
from parsers.tlogparser import TLOGParser 

app = Flask(__name__)
app.config['SECRET_KEY'] = 'secret!'
CORS(app,resources={r"/*":{"origins":"*"}})
socketio = SocketIO(app,cors_allowed_origins="*")

logs_dir = path.expanduser("~/Documents/tiplot/logs/")
logs_dir = logs_dir.replace("\\", "/")

configs_dir = path.expanduser("~/Documents/tiplot/config/")

if not path.exists(logs_dir):
    makedirs(logs_dir)

thread = Thread()
current_parser = None
current_file = None

def choose_parser(file, logs_dir):
    global current_parser
    parsers = [ULGParser(), CSVParser(), DJIParser(), ArduParser(), TLOGParser()]
    full_path = logs_dir + file
    for p in parsers:
        try:
            [datadict, entities, additional_info] = p.parse(full_path)
            store.Store.get().setStore(datadict, entities, additional_info)
            ok = True
            current_parser = p
            break
        except:
            # print("~> wrong format")
            #print(traceback.format_exc())
            ok = False
    return ok

@socketio.on("connect")
def connected():
    # print("-> client has connected " + request.sid)
    global thread
    if not thread.is_alive():
        print("-> Starting Communications Thread...")
        thread = Comm(socketio)
        thread.daemon = True
        thread.start()

@socketio.on('get_table_columns')
def get_table_columns(data):
    index = data['index']
    table = data['table']
    columns = store.Store.get().getTableColumns(table)
    data = {"index": index,"table": table, "columns": columns}
    emit('table_columns', data)

@app.route('/takeoff_position')
def get_takeoff_position():
    try:
        values = store.Store.get().datadict['vehicle_gps_position'][['lon', 'lat', 'alt']].to_dict('records')
        data = {'takeoff': values[0]}
    except:
        # dummy data for tests
        takeoff = {
            "alt": 270840,
            "lat": 498044179,
            "lon": 88782777,
          }
        data = {'takeoff': takeoff}
    return data

@app.route('/upload_log', methods=['POST'])
def upload_log():
    try:
        file = request.files['log']
        if file:
            file.save(path.join(logs_dir, file.filename))
            ok = choose_parser(file.filename, logs_dir)
    except:
        ok = False
    return {'ok': ok}

@app.route('/model')
def model_3d():
    if (len(argv) <= 1):
        model = getcwd() + "/../obj/main.gltf" # debug mode
    else:
        model = argv[1]
    return send_file(model)

@app.route('/entities_config')
def entities_config():
    config = store.Store.get().getEntities()
    return config

@app.route('/default_entity')
def default_entity():
    if current_parser is not None:
        default = current_parser.default_entity.toJson()
    else:
        default = {}
    return default

@app.route('/write_config', methods=['POST'])
def write_config():
    configs = request.get_json()
    if (current_parser is None):
        name = "custom_parser"
    else:
        name = current_parser.name
    ok, msg = store.Store.get().validateEntities(configs)
    if not ok:
        return {"ok": ok, "msg": msg}
    store.Store.get().setEntities(configs)
    with open(configs_dir + name + ".json", "w") as outfile:
        outfile.write(json.dumps(configs, indent=2))
    return {'ok': ok, "msg": msg}

@app.route('/validate_config', methods=['POST'])
def validate_config():
    configs = request.get_json()
    ok, msg = store.Store.get().validateEntities(configs)
    return {"ok": ok, "msg": msg}

@app.route('/tables')
def get_table_keys():
    tables = store.Store.get().getNestedKeys()
    response = {"tables": tables}
    return response

@app.route('/values_yt', methods=['POST'])
def get_yt_values():
    field = request.get_json()
    table = field['table']
    column = field['column']
    columns = list(set([column, "timestamp_tiplot"])) # remove duplicates
    datadict = store.Store.get().datadict
    try:
        values = datadict[table][columns].fillna(0).to_dict('records')
    except:
        # columns not found
        values = []
    response = {"table": table, "column": column , "values": values}
    return response

@app.route('/values_xy', methods=['POST'])
def get_xy_values():
    field = request.get_json()
    table = field['table']
    columns = field['columns']
    columns.append("timestamp_tiplot")
    columns = list(set(columns))
    datadict = store.Store.get().datadict
    try:
        values = datadict[table][columns].fillna(0).to_dict('records')
    except:
        # columns not found
        values = []
    response = {"table": table, "x": columns[0], "y": columns[1] , "values": values}
    return response

@app.route('/log_files')
def get_logs():
    files = [(path.basename(x), path.getsize(x), strftime(
        '%Y-%m-%d %H:%M:%S', localtime(path.getmtime(x)))) for x in glob(logs_dir + '/*')]
    data = {'path': logs_dir, 'files': files}
    return data


@app.route('/select_log', methods=['POST'])
def select_log():
    global current_file
    file = request.get_json()
    current_file = file
    ok = choose_parser(file[0], logs_dir)
    return {"ok": ok}


@app.route('/entities_props')
def get_entities_props():
    props, err = store.Store.get().getEntitiesProps()
    if err is not None: print(err)
    return props

@app.route('/current_file')
def get_current_file():
    global current_file
    if current_file is None:
        return {"msg": "no file selected"}
    return {"file": current_file}

@app.route('/keys')
def get_keys():
    keys = store.Store.get().getKeys()
    response = {"keys": keys}
    return response


@app.route('/additional_info')
def get_additional_info():
    info = store.Store.get().info
    return info

@socketio.on("disconnect")
def disconnected():
    # print("-> client has disconnected " + request.sid)
    pass

def print_tiplot():
    print('''
 _____ _ ____  _       _
|_   _(_)  _ \| | ___ | |_
  | | | | |_) | |/ _ \| __|
  | | | |  __/| | (_) | |_
  |_| |_|_|   |_|\___/ \__|
          ''')
    print('-> Starting TiPlot...')

def run_server():
    try:
        socketio.run(app, host='127.0.0.1', port=5000)
    except:
        print('~> Server already running.')
    finally:
        print('-> See you soon.')

if __name__ == '__main__':
    print_tiplot()
    run_server()
