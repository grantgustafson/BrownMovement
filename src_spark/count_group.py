#!/usr/bin/env python

from __future__ import division
import argparse
import json
import math
from collections import defaultdict
import csv
from datetime import date
from os.path import dirname, realpath

from mapreduce import mapreduce
#from pyspark import SparkContext

NUM_DAYS = 130
DAY = 60 * 60 * 24
START_TIME = 1446364800
COUNT_INTERVAL = 60 * 15
END_TIME = START_TIME + DAY * NUM_DAYS
NUM_JUMPS_THRESHOLD = 3
LINGER_THRESHOLD = 60 * 5

grouped_ap_map = {}

##### util ##########################################################################################
def combinations(iterable, r):
    # http://docs.python.org/2/library/itertools.html#itertools.combinations
    # combinations('ABCD', 2) --> AB AC AD BC BD CD
    # combinations(range(4), 3) --> 012 013 023 123
    pool = tuple(iterable)
    n = len(pool)
    if r > n:
        return
    indices = range(r)
    yield tuple(pool[i] for i in indices)
    while True:
        for i in reversed(range(r)):
            if indices[i] != i + n - r:
                break
        else:
            return
        indices[i] += 1
        for j in range(i+1, r):
            indices[j] = indices[j-1] + 1
        yield tuple(pool[i] for i in indices)
#####################################################################################################


def parse_args():
    parser = argparse.ArgumentParser(description='MapReduce Access Points')
    parser.add_argument('-a', help='path to input AP file')
    parser.add_argument('-d', help='path to data folder')
    parser.add_argument('-g', help='path to grouped AP JSON fie')
    parser.add_argument('-o', help='path to output JSON')
    return parser.parse_args()

def mapper0(record):
    # INPUT:
    #   record: a connection entry: (zone, connect time, disconnect time, MAC)
    # OUTPUT:
    #   (key, [value])
    #     where -
    #       key: mac
    #       value: (zone, connect time, disconnect time)
    # TODO
    zone, connect, disconnect, mac = record
    return (mac, [(zone, connect, disconnect)])

def reducer(a, b):
    # INPUT:
    #   a, b
    # OUTPUT:
    #   join a and b, sorted by connect time
    return a + b

def mapper1(record):
    # INPUT:
    #   record: (key, values)
    #     where -
    #       key: mac
    #       value: [(zone, connect time, disconnect time)]
    # OUTPUT:
    #   [(key, [value]), (key, [value]), ...]
    #     where -
    #       key: zone
    #       value: [(connect, disconnect)]
    # TODO
    mac, connections = record
    raw_connections = sorted(connections, key = lambda row: row[1])
    connections = []
    curr_connection = raw_connections[0]
    for next_conn in raw_connections[1:]:
        if curr_connection[0] == next_conn[0] and next_conn[1] - curr_connection[2] < LINGER_THRESHOLD:
            curr_connection = (curr_connection[0], curr_connection[1], next_conn[2])
        else:
            connections.append(curr_connection)
            curr_connection = next_conn
    connections.append(curr_connection)
    return map(lambda c: (c[0], [(c[1], c[2])]), connections)

def mapper2(record):
    # INPUT:
    #   record: (key, values)
    #     where -
    #       key: zone
    #       value: [(connect, disconnect)]
    # OUTPUT:
    #   (key, value)
    #     where -
    #       key: zone
    #       value: count
    zone, connections = record
    counts = defaultdict(int)
    for connection in connections:
        connect_time = connection[0]
        disconnect_time = connection[1]
        duration = disconnect_time - connect_time
        start_interval = int((connect_time - START_TIME) / COUNT_INTERVAL) * COUNT_INTERVAL + START_TIME
        counts[start_interval] += 1
        duration = disconnect_time - (start_interval + COUNT_INTERVAL)
        if disconnect_time > start_interval + COUNT_INTERVAL:
            for i in range(1, int(duration / COUNT_INTERVAL) + 2):
                counts[start_interval + COUNT_INTERVAL * i] += 1
    return zone, counts
    

def parse_data_files(APs, path, zones):
    data = []
    for ap in APs:
        with open(path + str(ap) + '.csv', 'r') as infile:
            reader = csv.reader(infile)

            #skip header
            reader.next()

            for row in reader:
                connect_time = int(row[0])
                disconnect_time = int(row[1])
                data.append((zones[ap], connect_time, disconnect_time, row[2]))
    return data

def parse_grouped_aps(path):
    zones = []
    APs = []
    num_aps = 0
    with open(path, 'r') as infile:
        parsed_json = json.load(infile)
        for elem in parsed_json:
            zones.append(elem)
            for ap in elem['aps']:
                num_aps += 1
                if ap in zones:
                    print "WARNING AP: ", ap
                APs.append(ap)
    print "Num APs: ", num_aps
    return zones, APs
def main():

    args = parse_args()
    raw_zones, aps = parse_grouped_aps(args.g)
    zones = {}
    for zone in raw_zones:
        for ap in zone['aps']:
            zones[ap] = str(zone['zone'])

    data = parse_data_files(aps, args.d, zones)
    print "Num Records: ", len(data)

    sc = mapreduce()
    #sc = SparkContext(appName="CountsApp")

    result = (sc.parallelize(data, 128).map(mapper0).reduceByKey(reducer)
                                                    .flatMap(mapper1).reduceByKey(reducer)
                                                    .map(mapper2).reduceByKey(reducer)
                                                    .collect())

    zone_counts = {}
    for zone, counts in result:
        zone_counts[zone] = counts


    for i in range(NUM_DAYS):
        day_start = START_TIME + DAY * i
        date_elem = date.fromtimestamp(day_start)
        subset = defaultdict(dict)
        subset["interval"] = COUNT_INTERVAL
        subset["start_time"] = day_start
        for zone in zone_counts:
            counts = zone_counts[zone]
            for j in range(int(DAY / COUNT_INTERVAL)):
                interval = day_start + j * COUNT_INTERVAL
                if interval in counts:
                    subset[zone][interval] = counts[interval]
        day = str(date_elem.day)
        month = str(date_elem.month)
        year = str(date_elem.year)
        with open(args.o + month + '-' + day + '-' + year[2:] +'.json', 'w') as outfile:
            json.dump(subset, outfile, indent=4, encoding='latin1')


if __name__ == '__main__':
    main()
