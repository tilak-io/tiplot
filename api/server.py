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
from argparse import ArgumentParser
import pandas as pd
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

extension_to_parser = {
    'ulg': ULGParser,
    'csv': CSVParser,
    'dat': DJIParser,
    'bin': ArduParser,
    'tlog': TLOGParser,
}

def choose_parser(file, logs_dir, isExtra=False):

    global current_parser
    full_path = logs_dir + file

    _, file_extension = path.splitext(full_path)
    file_extension = file_extension.lower()[1:]  # remove the leading '.'

    # Look up the parser class in the dictionary using the file extension as the key
    parser_cls = extension_to_parser.get(file_extension)
    if parser_cls is None:
        ok = False
        raise ValueError(f"Unsupported file extension: {file_extension}")

    # Create an instance of the parser class and use it to parse the file
    parser = parser_cls()
    try:
        datadict, entities, additional_info = parser.parse(full_path)
        if isExtra:
            store.Store.get().setExtra(datadict)
        else:
            store.Store.get().setStore(datadict, entities, additional_info)
        ok = True
        current_parser = parser
    except ValueError:
        datadict, entities = parser.parse(full_path)
        if isExtra:
            store.Store.get().setExtra(datadict)
        else:
            store.Store.get().setStore(datadict, entities)
        ok = True
        current_parser = parser
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
    model = args.model
    return send_file(model)

@app.route('/entities_config')
def entities_config():
    config = store.Store.get().getEntities()
    res = {"config": config}
    return res

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

@app.route('/extra_tables')
def get_extra_table_keys():
    tables = store.Store.get().getNestedKeys(isExtra = True)
    response = {"tables": tables}
    return response

@app.route('/values_yt', methods=['POST'])
def get_yt_values():
    field = request.get_json()
    table = field['table']
    column = field['column']
    isExtra = field['isExtra']
    columns = list(set([column, "timestamp_tiplot"])) # remove duplicates
    if isExtra:
        datadict = store.Store.get().extra_datadict
    else:
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

@app.route('/correlation', methods=['POST'])
def get_correlation_matrix():
    req = request.get_json()
    if not req:
        return []
    tables = req["tables"]
    df_list = []
    for topic in list(tables.keys()):
        cols = tables[topic]
        cols.append("timestamp_tiplot")
        try:
            df = store.Store.get().datadict[topic][cols]
            df = df.add_prefix(f'{topic}_')
            renamed = df.rename(columns={f'{topic}_timestamp_tiplot': "timestamp_tiplot"})
            df_list.append(renamed)
        except:
            # columns not found
            pass

    if (len(df_list) == 0):
        return []

    result = df_list[0]
    for i in range(1, len(df_list)):
        sorted = df_list[i].sort_values(by='timestamp_tiplot')
        result = pd.merge_asof(result, sorted, on='timestamp_tiplot')

    # filter data to include only the zoomed timestamp
    if "x_range" in req:
        x_range = req["x_range"]
        result = result.query('@x_range[0] < timestamp_tiplot < @x_range[1]')        

    result = result.drop(columns=["timestamp_tiplot"])
    # corr = result.corr().fillna(-1)
    corr = result.corr()
    data = json.loads(corr.to_json(orient='split'))
    columns = data['columns']
    values = data['data']
    return { 'columns': columns, 'values': values}

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

@app.route('/add_log', methods=['POST'])
def add_log():
    file = request.get_json()
    ok = choose_parser(file[0], logs_dir, True)
    return {"ok": ok}


@app.route('/entities_props')
def get_entities_props():
    props, err = store.Store.get().getEntitiesProps()
    if err is not None: print(err)
    res = {"data": props}
    return res

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
    res = {"info": info}
    return res

@socketio.on("disconnect")
def disconnected():
    # print("-> client has disconnected " + request.sid)
    pass

arg_parser = ArgumentParser(description="Tiplot")
arg_parser.add_argument('--port', type=int, default=5000, help='Port to run the server on')
arg_parser.add_argument('--model', type=str, default= getcwd() + "/../obj/main.gltf", help='Path to the model file')
args = arg_parser.parse_args()


def print_tiplot():
    print('''
 _____ _ ____  _       _
|_   _(_)  _ \| | ___ | |_
  | | | | |_) | |/ _ \| __|
  | | | |  __/| | (_) | |_
  |_| |_|_|   |_|\___/ \__|
          ''')
    print(f'-> Starting TiPlot on port {args.port}...')

def run_server():
    try:
        socketio.run(app, host='127.0.0.1', port=args.port)
    except:
        print('~> Port busy.')
    finally:
        print('-> See you soon.')

if __name__ == '__main__':
    print_tiplot()
    run_server()
