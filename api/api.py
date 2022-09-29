from flask import Flask,jsonify,request
from flask_cors import CORS, cross_origin
import pyulog
import pandas as pd
import os, glob, time
import threading, zmq, zlib, pickle5 as pickle

def parse_file(filename):
    global ulg
    ulg = pyulog.ULog(filename)

    datadict = {}
    for data in ulg.data_list:
        if data.multi_id > 0:
            name = f"{data.name}_{data.multi_id}"
        else:
            name = data.name
        datadict[name] = pd.DataFrame(data.data)
    return datadict

def send_zipped_pickle(socket, obj, flags=0, protocol=-1):
    p = pickle.dumps(obj, protocol)
    z = zlib.compress(p)
    return socket.send(z, flags=flags)

def recv_zipped_pickle(socket, flags=0, protocol=-1):
    print('waiting for data')
    z = socket.recv(flags)
    p = zlib.decompress(z)
    return pickle.loads(p)

def creat_app():
    app = Flask(__name__)
    cors = CORS(app)
    app.config['CORS_HEADERS'] = 'Content-Type'

    @app.route("/list_dir")
    def list_dir():
        files = [(os.path.basename(x), os.path.getsize(x) >> 20, time.strftime('%Y-%m-%d %H:%M:%S', time.localtime(os.path.getmtime(x)))) for x in glob.glob(logs_dir + '/*')]
        return { 'path': logs_dir, 'files': files}

    @app.route("/select/<file>")
    def select_ulg(file):
        global datadict
        try:
            datadict = parse_file(logs_dir+file)
            ok = True
        except Exception:
            print("Oops! Format incorrect.  Try again...")
            ok = False
        return {'ok': ok}


    @app.route('/position')
    def get_position():
        data = datadict['vehicle_global_position'][[
                'lon', 'lat', 'alt', 'timestamp']].to_dict('records')
        return {'data': data}

    @app.route('/orientation')
    def get_orientation():
        merged = pd.merge_asof(
                datadict['vehicle_global_position'], datadict['vehicle_attitude'], on='timestamp').bfill()
        data = merged[[
            'q[1]', 'q[2]', 'q[3]', 'q[0]',  'timestamp']].to_dict('records')
        return {'data': data}

    @app.route('/keys')
    def get_keys():
        keys = list(datadict.keys())
        result = []
        for key in datadict.keys():
            nested_keys = list(datadict[key].keys())
            result.append({key: nested_keys})
        return result

    @app.route('/key/<key>')
    def get_nested(key):
        nested_keys = list(datadict[key].keys())
        return nested_keys

    @app.route('/values/<key>/<nested>')
    def get_values(key, nested):
        data = datadict[key][[nested, 'timestamp']].fillna(0).to_dict('records')
        return {'data': data}

    @app.route('/valuesxy/<key>/<x>/<y>')
    def get_valuesxy(key, x,y):
        data = datadict[key][[x,y]].fillna(0).to_dict('records')
        return {'data': data}

    @app.route('/logged_messages')
    def get_logged_messages():
        messages = [({'log_level':x.log_level,'msg':x.message,'timestamp': x.timestamp}) for x in ulg.logged_messages] 
        return {'messages': messages}

    @app.route('/msg_info')
    def get_msg_info():
        msg_info = ulg.msg_info_dict
        return {'info': msg_info}

    return app

def run_http_server():
    app = creat_app()
    app.run(host="0.0.0.0", port=5000)

#port = '5555'
#context = zmq.Context()
#socket = context.socket(zmq.REP)
#socket.bind("tcp://*:%s" % port)
#lock = threading.Lock()

datadict = None 
ulg = None 
logs_dir = os.path.expanduser("~/Documents/tiplot/logs/")
if not os.path.exists(logs_dir):
    os.makedirs(logs_dir)

run_http_server()
#if __name__ == '__main__':
#    httpthread = threading.Thread(target=run_http_server)
#    httpthread.start()
    #while True:
    #    msg = recv_zipped_pickle(socket)
    #    datadict = msg
    #    print(msg)
    #    send_zipped_pickle(socket,'hi')
