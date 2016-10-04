#!/usr/bin/env python

from __future__ import division
import argparse
import json
import math
import csv
from datetime import date
from os.path import dirname, realpath

from mapreduce import mapreduce
# from pyspark import SparkContext

TIME_THRESHOLD = 60 * 60
NUM_DAYS = 130
DAY = 60 * 60 * 24
START_TIME = 1446364800
END_TIME = 1447228800
NUM_JUMPS_THRESHOLD = 3


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
    parser.add_argument('-d', help='path to data folder')
    parser.add_argument('-g', help='path to grouped AP JSON fie')
    parser.add_argument('-o', help='path to output JSON')
    return parser.parse_args()

def mapper0(record):
    # INPUT:
    #   record: a connection entry: (apid, connect time, disconnect time, MAC)
    # OUTPUT:
    #   (key, [value])
    #     where -
    #       key: MAC
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
    #       key: MAC
    #       values: a list of unsorted connections (zone, connect time, disconnect time)
    # OUTPUT:
    #   [(key, [value]), (key, [value]), ...]
    #     where -
    #       key: (zone1, zone2)
    #       value: (mac, disconnect from zone1, connect to zone2)
    # TODO
    mac, connections = record
    connections = sorted(connections, key = lambda row: row[1])
    output = []
    for idx in range(len(connections) - 1):
        zone1, connect1, disconnect1 = connections[idx]
        zone2, connect2, disconnect2 = connections[idx + 1]
        if connect2 - disconnect1 < TIME_THRESHOLD and zone1 != zone2:
            output.append(((zone1, zone2), [(mac, disconnect1, connect2)]))
    return output

def mapper2(record):
    # INPUT:
    #   record: (key, values)
    #     where -
    #       key: (zone1, zone2)
    #       values: [(mac, disconnect from zone1, connect to zone2)]
    # OUTPUT:
    #   [(key, [value]), (key, [value]), ...]
    #     where -
    #       key: (zone1, zone2)
    #       value: [(disconnect from zone1, connect to zone2)]
    aps, connections = record
    return aps, map(lambda x: (x[1], x[2]), connections)

def mapper3(record):
    # INPUT:
    #   record: (key, values)
    #     where -
    #       key: (zone1, zone2)
    #       values: [(mac, disconnect from zone1, connect to zone2)]
    # OUTPUT:
    #   [(key, [value]), (key, [value]), ...]
    #     where -
    #       key: date
    #       value: [((zone1, zone2), [(mac, disconnect from zone1, connect to zone2)])]
    zones, connections = record
    output = []
    for i in range(NUM_DAYS):
        start = START_TIME + DAY * i
        end = start + DAY
        day_connections = filter(lambda x: x[1] > start and x[2] < end, connections)
        day = date.fromtimestamp(start)
        output.append((day, [((zones[0], zones[1]), day_connections)]))
    return output
    
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
                #if connect_time > START_TIME and disconnect_time < END_TIME:
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
    print "Num records: ", len(data)
    sc = mapreduce()
    # sc = SparkContext(appName="NetflixProblemApp")

    result = (sc.parallelize(data, 128).map(mapper0).reduceByKey(reducer)
                                                    .flatMap(mapper1).reduceByKey(reducer)
                                                    .flatMap(mapper3).reduceByKey(reducer)
                                                    .sortBy(lambda x: len(x[1])).collect())

    sc.stop()

    for record in result:
        date_elem, ap_conns = record
        output = filter(lambda x: len(x[1]) > NUM_JUMPS_THRESHOLD, ap_conns)
        day = str(date_elem.day)
        month = str(date_elem.month)
        year = str(date_elem.year)
        with open(args.o + month + '-' + day + '-' + year[2:] + '.json', 'w') as outfile:
            json.dump(output, outfile, indent=4, encoding='latin1')


if __name__ == '__main__':
    main()
