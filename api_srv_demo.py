# -*- coding: utf-8 -*-
import logging
import sys
import os
from flask import Flask, jsonify
from logging.handlers import RotatingFileHandler
from flask_cors import CORS
from types import NoneType
from time import gmtime, strftime
from datetime import datetime, timedelta

# innit flash app 
app = Flask(__name__, static_url_path='', static_folder='static')
DEMO_MSG = ''

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
    return DEMO_MSG, 200

@app.route('/demo_fire', methods=['GET'])
def demo_fire():
    global DEMO_MSG 
    DEMO_MSG = '2018-09-04 05:31:38|1|Fire09'
    return 'demo_fire', 200
    
@app.route('/demo_resume', methods=['GET'])
def demo_resume():
    global DEMO_MSG 
    DEMO_MSG = '2018-09-04 05:31:38|0|Fire09'
    return 'demo_resume', 200

@app.route('/demo_reset', methods=['GET'])
def demo_reset():
    global DEMO_MSG 
    DEMO_MSG = ''
    return 'demo_reset', 200

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
