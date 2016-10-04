#!/usr/bin/env python

from __future__ import division
import argparse
import json
import math
from collections import defaultdict
from itertools import chain, imap, groupby
import sqlite3
from os.path import dirname, realpath
import xml.sax

nodes = {}
ways = []
restricted_areas = [(41.84, -71.417, 41.8308, -71.39957), #top section
                    (41.84, -71.417, 41.82891, -71.40314), #top left section
                    (41.829901, -71.398265, 41.828246, -71.394105), #below and right section of nelson
                    (41.8238, -71.4072, 41.8206, -71.4013), #lower - left quadrant
                    (41.82519, -71.40718, 41.82258, -71.40409), # left of keeney, below rock
                    (41.8295, -71.40892, 41.82689, -71.4048), #top left down to john hay library
                    (41.82572, -71.39878, 41.82225, -71.39384), #Lower right quadrant (barbour, etc)
                    (41.82632, -71.39721, 41.82225, -71.39384), #just behind b+h going down and right
                    (41.8296, -71.3973, 41.8195, -71.3884), #below and right of nelson
                    (41.8293, -71.4124, 41.8239, -71.4057), 
                    (41.83028, -71.40509, 41.82967, -71.40288), #Cushing street west bend
                    (41.82661, -71.39914, 41.8265, -71.3983), #B+H path (no longer there)
                    (41.82641, -71.39908, 41.82613, -71.39816), #B+H path part 2
                    (41.822905, -71.401514, 41.819, -71.39572)] #bottom of grad center / new dorm
restricted_paths = ["Power Street", "Lloyd Avenue"]
building_count = 1

class NodeHandler( xml.sax.ContentHandler):
    def __init__(self):
        self.CurrentData = ""
        self.parentFlag = False
        self.nds = []
        self.tags = {}

    def startElement(self, tag, attributes):
        self.CurrentData = tag
        if tag == "node":
            node_id = attributes['id']
            lat = attributes['lat']
            lng = attributes['lon']
            nodes[int(node_id)] = (float(lat), float(lng))
        elif tag == "way":
            self.parentFlag = True
        elif tag == "nd":
            self.nds.append(int(attributes['ref']))
        elif tag == "tag":
            self.tags[attributes['k']] = attributes['v']

    def endElement(self, tag):
        if tag == "way":
            ways.append((self.tags, self.nds))
            self.nds = []
            self.tags = {}
            self.parentFlag = False



# from pyspark import SparkContext
def sort_order(l, key):
        d = defaultdict(list)
        for item in l:
            d[key(item)].append(item)
        return [item for sublist in d.values() for item in sublist]

def reduceByKey(data, f):
        return map(lambda y: (y[0], reduce(f, map(lambda x: x[1], y[1]))),
            groupby(sort_order(data, lambda x: x[0]), lambda x: x[0]))



def parse_args():
    parser = argparse.ArgumentParser(description='Maps JSON builder')
    parser.add_argument('-d', help='path to maps db')
    parser.add_argument('-o', help='path to output JSON')
    return parser.parse_args()

def is_in_restricted_area(pts):
    for pt in pts:
        lat, lng = pt
        for bounds in restricted_areas:
            if lat < bounds[0] and lat > bounds[2] and lng > bounds[1] and lng < bounds[3]:
                return True
    return False

def main():
    args = parse_args()
    parser = xml.sax.make_parser()
    parser.setFeature(xml.sax.handler.feature_namespaces, 0)
    Handler = NodeHandler()
    parser.setContentHandler(Handler)
    parser.parse(args.d)
    bldgs = []
    streets = []
    footways = []
    greens = []
    green_count = 1
    path_count = 1
    global building_count
    for tags, nds in ways:
        if 'building' in tags:
            name = ""
            shouldAdd = True
            points = map(lambda w: nodes[w], nds)
            if is_in_restricted_area(points):
                continue
            if 'name' in tags:
                name = tags['name']
            else:
                name = 'building-' + str(building_count)
                building_count += 1 
                if is_in_restricted_area(points):
                    shouldAdd = False
            if shouldAdd:
                bldgs.append((name, points))
            # bldgs.append(points)
        elif 'highway' in tags:
            name = ""
            if 'name' in tags:
                name = tags['name']
            else:
                name = 'path-' + str(path_count)
                path_count += 1 
            if name in restricted_paths:
                continue
            points = map(lambda w: nodes[w], nds)
            points = filter(lambda n: not is_in_restricted_area([n]), points)
            if tags['highway'] == 'residential' or tags['highway'] == 'secondary':
                streets.append((name, points))
            elif tags['highway'] == 'footway':
                footways.append((name, points))
        elif 'landuse' in tags and tags['landuse'] == 'grass':
            points = map(lambda w: nodes[w], nds)
            if is_in_restricted_area(points):
                continue
            name = ""
            if 'name' in tags:
                name = tags['name']
            else:
                name = "grass-" + str(green_count)
                green_count += 1
            greens.append((name, points))

    output = {'bldgs': bldgs, 'streets': streets, 'footways': footways, 'grass': greens}
    with open(args.o or dirname(realpath(__file__)) + '/connections.json', 'w') as outfile:
        json.dump(output, outfile, indent=4, encoding='latin1')


if __name__ == '__main__':
    main()
