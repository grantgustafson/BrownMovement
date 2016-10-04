#!/usr/bin/env python

from __future__ import division
import argparse
import json
import math
from collections import defaultdict
from itertools import chain, imap, groupby
import sqlite3
from os.path import dirname, realpath

# from pyspark import SparkContext
def sort_order(l, key):
        d = defaultdict(list)
        for item in l:
            d[key(item)].append(item)
        return [item for sublist in d.values() for item in sublist]

def reduceByKey(data, f):
        return map(lambda y: (y[0], reduce(f, map(lambda x: x[1], y[1]))),
            groupby(sort_order(data, lambda x: x[0]), lambda x: x[0]))

def create_chain(elem):
    global errors
    bldg_name, ways = elem
    if len(ways) < 3:
        return (bldg_name, [])
    curr = (ways[0][0], ways[0][1])
    start = (ways[0][0], ways[0][1])
    d = defaultdict(list)
    loop = False
    for way in ways:
        d[(way[0], way[1])].append((way[2], way[3]))
        if (way[2], way[3]) == start:
            loop = True
    if not loop:
        return (bldg_name, [])
    chain = []
    visited = set()
    count = 0
    while curr != start or count == 0:
        chain.append(curr)
        next_nodes = d[curr]
        curr = None
        for next_node in next_nodes:
            if next_node not in visited:
                curr = next_node
                visited.add(next_node)
                break
        count += 1
        if count > len(ways) or curr is None:
            return (bldg_name, [])
    return (bldg_name, chain)


def parse_args():
    parser = argparse.ArgumentParser(description='Maps JSON builder')
    parser.add_argument('-d', help='path to maps db')
    parser.add_argument('-o', help='path to output JSON')
    return parser.parse_args()

def printFails(record):
    if len(record[1]) == 0:
        print record[0]

def main():
    args = parse_args()

    conn = sqlite3.connect(args.d)
    c = conn.cursor()
    query = 'SELECT w.name, n1.latitude, n1.longitude, n2.latitude, n2.longitude '
    query += 'FROM node n1, way w, node n2 '
    query += 'WHERE w.start = n1.id AND w.end = n2.id '
    query += 'AND w.name not like "%st" AND w.name not like "%street" '
    query += 'AND w.name not NULL AND w.name != "" AND w.name not like "%Avenue"'
    c.execute(query)
    data = set(c.fetchall())
    vals = map(lambda x: (x[0], [(x[1], x[2], x[3], x[4])]), data)
    raw_bldg_grps = reduceByKey(vals, lambda x, y: x + y)
    blgds = map(create_chain, raw_bldg_grps)
    map(printFails, blgds)
    bldgs = map(lambda b: b[1], blgds)
    bldgs = filter(lambda b: len(b) != 0, bldgs)
    
    query = 'SELECT w.name, n1.latitude, n1.longitude, n2.latitude, n2.longitude '
    query += 'FROM node n1, way w, node n2 '
    query += 'WHERE w.start = n1.id AND w.end = n2.id '
    query += 'AND w.name not NULL AND w.name != "" AND ('
    query += 'w.name like "%Avenue" OR w.name like "%st" '
    query += 'OR w.name like "%street" OR w.name like "%path")'
    c.execute(query)
    data = set(c.fetchall())
    vals = map(lambda x: (x[0], [(x[1], x[2]), (x[3], x[4])]), data)
    paths = reduceByKey(vals, lambda x, y: x + y)
    paths = map(lambda x: list(set(x[1])), paths)
    

    output = {'bldgs': bldgs, 'paths': paths}

    with open(args.o or dirname(realpath(__file__)) + '/connections.json', 'w') as outfile:
        json.dump(output, outfile, indent=4, encoding='latin1')


if __name__ == '__main__':
    main()
