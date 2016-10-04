#!/usr/bin/env python

from __future__ import division
import argparse
import json
import math
from collections import defaultdict
from itertools import chain, imap, groupby
import sqlite3
from os.path import dirname, realpath


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
    parser = argparse.ArgumentParser(description='Maps JSON builder')
    parser.add_argument('-d', help='path to ap groups')
    return parser.parse_args()

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
    raw_zones, aps = parse_grouped_aps(args.d)
    zones = []
    for zone in raw_zones:
        zones.append(str(zone['zone']))
    for pair in combinations(zones, 2):
        print pair

if __name__ == '__main__':
    main()
