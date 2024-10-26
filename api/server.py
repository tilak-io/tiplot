from engineio.async_drivers import gevent
from flask import Flask, request, send_file
from flask_socketio import SocketIO, emit
from flask_cors import CORS
from threading import Thread
from time import localtime, strftime
from os import makedirs, path, getcwd, environ
from glob import glob
from communication import Comm
from datetime import datetime
from argparse import ArgumentParser
import pandas as pd
import store
import json
import subprocess
import zmq, zlib, pickle
import traceback

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
sequences_dir = path.expanduser("~/Documents/tiplot/sequences/")

if not path.exists(logs_dir):
    makedirs(logs_dir)

if not path.exists(sequences_dir):
    makedirs(sequences_dir)

thread = Thread()
current_parser = None
current_file = None
current_ext = None

extension_to_parser = {
    'ulg': ULGParser,
    'csv': CSVParser,
    'dat': DJIParser,
    'bin': ArduParser,
    'tlog': TLOGParser,
}

def choose_parser(file, logs_dir, isExtra=False):

    global current_parser, current_ext
    full_path = logs_dir + file

    _, file_extension = path.splitext(full_path)
    file_extension = file_extension.lower()[1:]  # remove the leading '.'
    current_ext = file_extension

    # Look up the parser class in the dictionary using the file extension as the key
    parser_cls = extension_to_parser.get(file_extension)
    if parser_cls is None:
        return False
        # raise ValueError(f"Unsupported file extension: {file_extension}")

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

@app.route('/upload_log', methods=['POST'])
def upload_log():
    isExtra = request.headers["isExtra"]
    if (isExtra == "true"):
        isExtra = True
    else:
        isExtra = False
    try:
        file = request.files['log']
        if file:
            file.save(path.join(logs_dir, file.filename))
            ok = choose_parser(file.filename, logs_dir, isExtra)
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

@app.route('/set_tracked_entity', methods=['POST'])
def set_tracked_entity():
    entity_id = request.get_json('id')
    config = store.Store.get().getEntities()
    if not config:
        return {"ok": False, "msg": "Entity list is empty."}
    entity_name = ""
    entity_found = False
    for entity in config:
        if entity['id'] == entity_id:
            entity['tracked'] = True
            entity_name = entity['name']
            entity_found = True
        else:
            entity['tracked'] = False
    if not entity_found:
        return {"ok": False, "msg": f"No entity with ID {entity_id} found."}
    store.Store.get().setEntities(config)
    return {"ok": True, "msg": f"\"{entity_name}\" is now tracked."}

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
    err = "no error"
    ok = True
    if isExtra:
        datadict = store.Store.get().extra_datadict
    else:
        datadict = store.Store.get().datadict
    try:
        values = datadict[table][columns].fillna(0).to_dict('records')
    except Exception as e:
        # columns not found
        values = []
        err = str(e)
        ok = False
    response = {"table": table, "column": column , "values": values, "err": err, "ok": ok}
    return response

@app.route('/values_xy', methods=['POST'])
def get_xy_values():
    field = request.get_json()
    table = field['table']
    xCol = field['x']
    yCol = field['y']
    columns = [xCol, yCol, "timestamp_tiplot"]
    datadict = store.Store.get().datadict
    err = "no error"
    ok = True
    try:
        values = datadict[table][columns].fillna(0).to_dict('records')
    except Exception as e:
        # columns not found
        values = []
        err = str(e)
        ok = False
    response = {"table": table, "x": xCol, "y": yCol, "values": values, "err": err, "ok": ok}
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

@app.route('/log_files/<sort>')
def get_sorted_logs(sort):
    sort = sort.lower()
    if sort == "time":
        files = [(path.basename(x), path.getsize(x), strftime(
            '%Y-%m-%d %H:%M:%S', localtime(path.getmtime(x)))) for x in sorted(glob(logs_dir + '/*'), key=path.getmtime)]
    elif sort == "time_desc":
        files = [(path.basename(x), path.getsize(x), strftime(
            '%Y-%m-%d %H:%M:%S', localtime(path.getmtime(x)))) for x in sorted(glob(logs_dir + '/*'), key=path.getmtime, reverse=True)]
    elif sort == "size":
        files = [(path.basename(x), path.getsize(x), strftime(
            '%Y-%m-%d %H:%M:%S', localtime(path.getmtime(x)))) for x in sorted(glob(logs_dir + '/*'), key=path.getsize)]
    elif sort == "size_desc":
        files = [(path.basename(x), path.getsize(x), strftime(
            '%Y-%m-%d %H:%M:%S', localtime(path.getmtime(x)))) for x in sorted(glob(logs_dir + '/*'), key=path.getsize, reverse=True)]
    elif sort == "name":
        files = [(path.basename(x), path.getsize(x), strftime(
            '%Y-%m-%d %H:%M:%S', localtime(path.getmtime(x)))) for x in sorted(glob(logs_dir + '/*'))]
    elif sort == "name_desc":
        files = [(path.basename(x), path.getsize(x), strftime(
            '%Y-%m-%d %H:%M:%S', localtime(path.getmtime(x)))) for x in sorted(glob(logs_dir + '/*'), reverse=True)]
    else:
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
    props, err, ok = store.Store.get().getEntitiesProps()
    res = {"data": props, "error": err, "ok": ok}
    return res

@app.route('/current_file')
def get_current_file():
    global current_file
    if current_file is None:
        return {"msg": "no file selected", "appVersion": args.version}
    return {"file": current_file, "appVersion": args.version}

@app.route('/keys')
def get_keys():
    keys = store.Store.get().getKeys()
    response = {"keys": keys}
    return response


@app.route('/additional_info')
def get_additional_info():
    info = store.Store.get().info
    hasExtra = bool(store.Store.get().extra_datadict)
    hasMain = bool(store.Store.get().datadict)
    res = {"info": info, "hasExtra": hasExtra, "hasMain": hasMain}
    return res


@app.route('/current_parser')
def get_current_parser():
    global current_parser, current_ext
    if (current_parser is None):
        parser = "no_parser"
    else:
        parser = current_parser.name
    ext = current_ext or "default"
    res = {"parser": parser, "ext": ext}
    return res

@app.route('/merge_extra', methods=['POST'])
def merge_extra():
    res = request.get_json()
    prefix = res['prefix']
    delta = float(res['delta'])
    # try:
    store.Store.get().mergeExtra(prefix, delta)
    ok = True
    # except:
    #     ok = False
    return {"ok": ok}

@app.route('/run_sequence', methods=['POST'])
def run_sequence():
    body = request.get_json()
    sequence_name = body['sequence']
    sequence_file = sequences_dir + sequence_name
    print("Running " + sequence_file)
    datadict = store.Store.get().datadict
    try:
        with open(sequence_file, "r") as f:
            code = f.read()
        global_namespace = {}
        local_namespace = {}
        exec(code, global_namespace, local_namespace)
        handle_data = local_namespace['handle_data']
        store.Store.get().datadict = handle_data(datadict)
        ok = True
        err = "no error"
    except Exception as e:
        err = traceback.format_exc()
        ok = False
    return {"ok": ok, "err": err}

@app.route('/sequences')
def get_sequences():
    files = glob(sequences_dir + "/*")
    # use the path module to get only the basename of each file
    file_names = [path.basename(file) for file in files]
    data = {'path': sequences_dir, 'files': file_names}
    return data

@app.route('/create_sequence_file', methods=['POST'])
def create_sequence_file():
    body = request.get_json()
    sequence_name = body['name']+".py"
    file_path = path.join(sequences_dir, sequence_name)
    try:
        with open(file_path, 'w') as file:
            file.write("""def handle_data(datadict):
        import numpy as np
        import pandas as pd

        new = datadict
        return new""")
        ok = True
        err = "no error"
    except Exception as e:
        err = traceback.format_exc()
        ok = False

    return {"ok": ok, "err": err}
    
@app.route('/open_sequence_file', methods=['POST'])
def open_sequence_file():
    body = request.get_json()
    sequence_name = body['sequence']
    sequence_file = sequences_dir + sequence_name
    try:
        command = body['editorBinary'].split(" ")
        command.append(sequence_file)
        subprocess.Popen(command) # run the command asyncronously
        ok = True
        err = "no error"
    except:
        err = traceback.format_exc()
        ok = False
    return {"ok": ok, "err": err}

@socketio.on("disconnect")
def disconnected():
    # print("-> client has disconnected " + request.sid)
    pass


arg_parser = ArgumentParser(description="Tiplot")
arg_parser.add_argument('--port', type=int, default=5000, help='Port to run the server on')
arg_parser.add_argument('--model', type=str, default= getcwd() + "/../obj/main.gltf", help='Path to the model file')
arg_parser.add_argument('--version', type=str, default="0.0.0-debug", help='App version')
args = arg_parser.parse_args()


def print_tiplot():
    print('''
 _____ _ ____  _       _
|_   _(_)  _ \| | ___ | |_
  | | | | |_) | |/ _ \| __|
  | | | |  __/| | (_) | |_
  |_| |_|_|   |_|\___/ \__|
          ''')
    print(f'-> Starting TiPlot v{args.version} on port {args.port}...')

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
