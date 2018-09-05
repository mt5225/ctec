# -*- coding: utf-8 -*-
import logging
import sys
from flask import Flask
from flask_cors import CORS
import pickledb

# init key-value store
_DB = pickledb.load('alarm.db', False) 

# innit flash app and backend db connection
app = Flask(__name__, static_url_path='', static_folder='static')

@app.route('/fire', methods=['GET'])
def status():
    status_msg = "%s"%(_DB.get('fire'))
    app.logger.debug(status_msg)
    return status_msg, 200

@app.route('/command/<status>')
def command(status):
    if 'fire_alarm' in status:
        _DB.set('fire', '2018-09-04 05:31:38|1|Fire09')
    if 'fire_recovery' in status:
        _DB.set('fire', '2018-09-04 05:31:38|0|Fire09')
    if 'reset' in status:
        _DB.set('fire', '')
    return status, 200

if __name__ == '__main__':
    LOG_FILENAME = './tel_api_srv.log'
    formatter = logging.Formatter(
        "[%(asctime)s] {%(pathname)s:%(lineno)d} %(levelname)s - %(message)s")
    handler = logging.StreamHandler(sys.stdout)
    handler.setLevel(logging.INFO)
    handler.setFormatter(formatter)
    app.logger.addHandler(handler)
    _DB.set('fire', '')
    CORS(app)
    app.run(host='0.0.0.0', port=9006, debug=True, threaded=True)
