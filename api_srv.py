# -*- coding: utf-8 -*-
import logging
import sys
import os
from flask import Flask, jsonify
from logging.handlers import RotatingFileHandler
from flask_cors import CORS
from flask_sqlalchemy import SQLAlchemy
from types import NoneType
from time import gmtime, strftime
from datetime import datetime, timedelta

DB_URL = 'mysql+pymysql://root:root@192.168.33.10/alarm_momoda'

# innit flash app and backend db connection
app = Flask(__name__, static_url_path='', static_folder='static')
app.config['SQLALCHEMY_BINDS'] = {
    'fire':DB_URL
}

app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

_DB = SQLAlchemy(app)

@app.route('/')
def index():
    return jsonify(msg='Hello, CTEC!'), 200

@app.route('/path')
def path():
    msg_array = []
    with open('patrol.txt') as fp:
       for line in fp:
           if len(line.strip()) > 2: msg_array.append(line.strip()) 
    app.logger.debug(msg_array)
    msg_short = '#'.join(msg_array) if msg_array > 0 else ""
    return msg_short, 200

@app.route('/fire', methods=['GET'])
def fire():
    msg_array = []
    engine = _DB.get_engine(bind='fire')
    today_str = datetime.now().strftime("%Y-%m-%d")
    yesterday_str = (datetime.now() - timedelta(days=1)).strftime("%Y-%m-%d")
    result = engine.execute("SELECT occurrences, msg, sensor FROM ctec_fire_alarms where locate('%s', occurrences)>0 OR locate('%s', occurrences)>0" % (today_str, yesterday_str))
    for row in result:
       msg_array.append("%s|%s|%s"%(row[0], row[1], row[2]))
    app.logger.debug(msg_array)
    msg_short = '#'.join(msg_array) if msg_array > 0 else ""
    return msg_short, 200

if __name__ == '__main__':
    LOG_FILENAME = './ctec_api_srv.log'
    formatter = logging.Formatter(
        "[%(asctime)s] {%(pathname)s:%(lineno)d} %(levelname)s - %(message)s")
    handler = logging.StreamHandler(sys.stdout)
    handler.setLevel(logging.INFO)
    handler.setFormatter(formatter)
    app.logger.addHandler(handler)
    CORS(app)
    app.run(host='0.0.0.0', port=9006, debug=True)
