#!/usr/bin/env python

from __future__ import division
import argparse
import json
import math
import csv
from os.path import dirname, realpath

from mapreduce import mapreduce
# from pyspark import SparkContext

TIME_THRESHOLD = 60 * 60


def parse_args():
    parser = argparse.ArgumentParser(description='MapReduce Access Points')
    parser.add_argument('-a', help='path to input AP file')
    parser.add_argument('-d', help='path to data folder')
    parser.add_argument('-o', help='path to output JSON')
    return parser.parse_args()

def mapper0(record):
    # INPUT:
    #   record: a connection entry: (apid, connect time, disconnect time, MAC)
    # OUTPUT:
    #   (key, [value])
    #     where -
    #       key: MAC
    #       value: (apid, connect time, disconnect time)
    # TODO
    apid, connect, disconnect, mac = record
    return (mac, [(apid, connect, disconnect)])
    pass

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
    #       values: a list of unsorted connections (apid, connect time, disconnect time)
    # OUTPUT:
    #   [(key, [value]), (key, [value]), ...]
    #     where -
    #       key: (ap1, ap2)
    #       value: (mac, disconnect from ap1, time_between ap's)
    # TODO
    mac, connections = record
    connections = sorted(connections, key = lambda row: row[1])
    output = []
    for idx in range(len(connections) - 1):
        ap1, connect1, disconnect1 = connections[idx]
        ap2, connect2, disconnect2 = connections[idx + 1]
        if connect2 - disconnect1 < TIME_THRESHOLD and ap1 != ap2:
            output.append(((ap1, ap2), [(mac, disconnect1, connect2 - disconnect1)]))
    return output
    pass

def mapper2(record):
    # INPUT:
    #   record: (key, values)
    #     where -
    #       key: (ap1, ap2)
    #       values: a list of unsorted connections (apid, connect time, disconnect time)
    # OUTPUT:
    #   [(key, [value]), (key, [value]), ...]
    #     where -
    #       key: (ap1, ap2)
    #       value: (mac, disconnect from ap1, time_between ap's)
    aps, connections = record
    return aps, len(connections)

def parse_data_files(APs, path):
    data = []
    for ap in APs:
        with open(path + ap + '.csv', 'r') as infile:
            reader = csv.reader(infile)

            #skip header
            reader.next()

            for row in reader:
                data.append((ap, int(row[0]), int(row[1]), row[2]))
    return data

def main():
    args = parse_args()

    with open(args.a, 'r') as infile:
        aps = [line.rstrip() for line in infile]

    data = parse_data_files(aps, args.d)
    print "Num records: ", len(data)
    sc = mapreduce()
    # sc = SparkContext(appName="NetflixProblemApp")

    similarities_result = (sc.parallelize(data, 128).map(mapper0).reduceByKey(reducer)
                                                    .flatMap(mapper1).reduceByKey(reducer)
                                                    .map(mapper2)
                                                    #.sortBy(lambda x: (x[0][0], x[0][1])).collect())
                                                    .sortBy(lambda x: (x[1])).collect())

    sc.stop()

    with open(args.o or dirname(realpath(__file__)) + '/connections.json', 'w') as outfile:
        json.dump(similarities_result, outfile, indent=4, encoding='latin1')


if __name__ == '__main__':
    main()
