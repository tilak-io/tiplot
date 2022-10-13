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
from datetime import datetime

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
    files = [(path.basename(x), path.getsize(x), strftime(
        '%Y-%m-%d %H:%M:%S', localtime(path.getmtime(x)))) for x in glob(logs_dir + '/*')]
    data = {'path': logs_dir, 'files': files}
    emit('log_files', data)


@socketio.on('select_log_file')
def select_log_file(file):
    ok = choose_parser(file[0], logs_dir)
    emit('log_selected', ok)

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




@socketio.on('get_entities_props')
def get_entities():
    global currentTime
    currentTime = datetime.now()
    props = store.Store.get().getEntitiesProps()
    emit('entities_props', props)
    print('time to emit: {}'.format(datetime.now() - currentTime))

@socketio.on('entities_recieved')
def entities_recieved():
    print('time to recieve data: {}'.format(datetime.now() - currentTime))


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

@socketio.on("disconnect")
def disconnected():
    print("client has disconnected " + request.sid)

if __name__ == '__main__':
    socketio.run(app, host='127.0.0.1', port=5000)
