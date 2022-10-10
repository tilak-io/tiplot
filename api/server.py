from engineio.async_drivers import gevent
from flask import Flask, request
from flask_socketio import SocketIO, emit
from flask_cors import CORS
from threading import Thread
from ulgparser import ULGParser
from csvparser import CSVParser
import store
from time import localtime, strftime
from os import makedirs, path
from glob import glob
from communication import Comm


app = Flask(__name__)
app.config['SECRET_KEY'] = 'secret!'
CORS(app,resources={r"/*":{"origins":"*"}})
#socketio = SocketIO(app,cors_allowed_origins="*")
socketio = SocketIO(app,cors_allowed_origins="*")

logs_dir = path.expanduser("~/Documents/tiplot/logs/")
if not path.exists(logs_dir):
    makedirs(logs_dir)

thread = Thread()



def choose_parser(file, logs_dir):
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

@socketio.on("connect")
def connected():
    print("client has connected " + request.sid)
    global thread
    if not thread.is_alive():
        print("-> Starting Communications Thread...")
        thread = Comm(socketio)
        thread.daemon = True
        thread.start()

@socketio.on('get_log_files')
def get_logs():
    files = [(path.basename(x), path.getsize(x) >> 20, strftime(
        '%Y-%m-%d %H:%M:%S', localtime(path.getmtime(x)))) for x in glob(logs_dir + '/*')]
    data = {'path': logs_dir, 'files': files}
    emit('log_files', data)


@socketio.on('select_log_file')
def select_log_file(file):
    ok = choose_parser(file[0], logs_dir)
    emit('log_selected', ok)

@socketio.on('get_entities_props')
def get_entities():
    props = store.Store.get().getEntitiesProps()
    emit('entities_props', props)

@socketio.on('get_table_keys')
def get_table_keys(index):
    keys = store.Store.get().getNestedKeys()
    response = {"index": index, "keys":keys}
    emit('table_keys', response)

@socketio.on('get_table_values')
def get_table_values(data):
    index = data['index']
    table = data['table']
    keys = data['keys']
    keys.append('timestamp')
    values = store.Store.get().datadict[table][keys].fillna(
        0).to_dict('records')
    response = {"index": index,"y": keys[0], "x": keys[1],"table": table, "values": values}
    emit('table_values', response)

@socketio.on('get_table_columns')
def get_table_columns(data):
    index = data['index']
    table = data['table']
    columns = store.Store.get().getTableColumns(table)
    data = {"index": index,"table": table, "columns": columns}
    emit('table_columns', data)

@socketio.on("disconnect")
def disconnected():
    print("client has disconnected " + request.sid)

if __name__ == '__main__':
    socketio.run(app, debug=True, host='127.0.0.1', port=5000)
