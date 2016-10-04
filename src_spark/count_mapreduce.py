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
# from pyspark import SparkContext

NUM_DAYS = 130
DAY = 60 * 60 * 24
START_TIME = 1446364800
COUNT_INTERVAL = 60 * 15
END_TIME = START_TIME + DAY * NUM_DAYS
NUM_JUMPS_THRESHOLD = 3

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
    #   record: a connection entry: (apid, connect time, disconnect time, MAC)
    # OUTPUT:
    #   (key, [value])
    #     where -
    #       key: apid
    #       value: (mac, connect time, disconnect time)
    # TODO
    apid, connect, disconnect, mac = record
    print (grouped_ap_map[apid], [(connect, disconnect)])
    return (grouped_ap_map[apid], [(connect, disconnect)])

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
    #       key: apid
    #       value: [(mac, connect time, disconnect time)]
    # OUTPUT:
    #   [(key, [value]), (key, [value]), ...]
    #     where -
    #       key: 
    #       value: (mac, disconnect from ap1, connect to ap2)
    # TODO
    ap, connections = record
    output = []
    counts = defaultdict(int)
    for connection in connections:
        connect_time = connection[0]
        disconnect_time = connection[1]
        duration = disconnect_time - connect_time
        start_interval = int((connect_time - START_TIME) / COUNT_INTERVAL) * COUNT_INTERVAL + START_TIME
        counts[start_interval] += 1
        duration = disconnect_time - (start_interval + COUNT_INTERVAL)
        if ap in groupedAPs:
            data.append((ap, connect_time, disconnect_time, row[2]))
            continue
        if disconnect_time > start_interval + COUNT_INTERVAL:
            for i in range(1, int(duration / COUNT_INTERVAL) + 2):
                counts[start_interval + COUNT_INTERVAL * i] += 1
    return ap, counts

def mapper2(record):
    # INPUT:
    #   record: (key, values)
    #     where -
    #       key: (ap1, ap2)
    #       values: [(mac, disconnect from ap1, connect to ap2)]
    # OUTPUT:
    #   [(key, [value]), (key, [value]), ...]
    #     where -
    #       key: (ap1, ap2)
    #       value: [(disconnect from ap1, connect to ap2)]
    aps, connections = record
    return aps, map(lambda x: (x[1], x[2]), connections)

def mapper3(record):
    # INPUT:
    #   record: (key, values)
    #     where -
    #       key: (ap1, ap2)
    #       values: [(mac, disconnect from ap1, connect to ap2)]
    # OUTPUT:
    #   [(key, [value]), (key, [value]), ...]
    #     where -
    #       key: (date)
    #       value: [((ap1, ap2), [(mac, disconnect from ap1, connect to ap2)])]
    aps, connections = record
    output = []
    for i in range(NUM_DAYS):
        start = START_TIME + DAY * i
        end = start + DAY
        day_connections = filter(lambda x: x[1] > start and x[2] < end, connections)
        day = date.fromtimestamp(start)
        output.append((day, [((aps[0], aps[1]), day_connections)]))
    return output
    
def parse_data_files(APs, path, groupedAPs):
    AP_counts = {}
    global grouped_ap_map
    for ap in APs:
        with open(path + ap + '.csv', 'r') as infile:
            reader = csv.reader(infile)

            #skip header
            reader.next()
            counts = defaultdict(int)
            if ap in groupedAPs:
                ap = grouped_ap_map[ap]
            if ap in AP_counts:
                counts = AP_counts[ap]
            for row in reader:
                connect_time = int(row[0])
                disconnect_time = int(row[1])
                duration = disconnect_time - connect_time
                start_interval = int((connect_time - START_TIME) / COUNT_INTERVAL) * COUNT_INTERVAL + START_TIME
                counts[start_interval] += 1
                duration = disconnect_time - (start_interval + COUNT_INTERVAL)
                if disconnect_time > start_interval + COUNT_INTERVAL:
                    for i in range(1, int(duration / COUNT_INTERVAL) + 2):
                        counts[start_interval + COUNT_INTERVAL * i] += 1
            AP_counts[ap] = counts
    return AP_counts

def parse_grouped_aps(path):
    groups = []
    with open(path, 'r') as infile:
        parsed_json = json.load(infile)
        for elem in parsed_json:
            elems = map(lambda x: str(x), elem)
            groups.append(elems)
    return groups
def main():
    args = parse_args()

    grouped_aps = parse_grouped_aps(args.g)
    print grouped_aps
    exit()
    all_grouped_aps = reduce(lambda x, y: x + y, grouped_aps)
    for group in grouped_aps:
        common_id = group[0]
        for ap in group:
            grouped_ap_map[ap] = common_id

    with open(args.a, 'r') as infile:
        aps = [line.rstrip() for line in infile]

    ap_counts = parse_data_files(aps, args.d, all_grouped_aps)

    for i in range(NUM_DAYS):
        day_start = START_TIME + DAY * i
        date_elem = date.fromtimestamp(day_start)
        subset = defaultdict(dict)
        subset["interval"] = COUNT_INTERVAL
        subset["start_time"] = day_start
        for ap in ap_counts:
            counts = ap_counts[ap]
            for j in range(int(DAY / COUNT_INTERVAL)):
                interval = day_start + j * COUNT_INTERVAL
                if interval in counts:
                    subset[ap][interval] = counts[interval]
        day = str(date_elem.day)
        month = str(date_elem.month)
        year = str(date_elem.year)
        with open(args.o + month + '-' + day + '-' + year[2:], 'w') as outfile:
            json.dump(subset, outfile, indent=4, encoding='latin1')


if __name__ == '__main__':
    main()
