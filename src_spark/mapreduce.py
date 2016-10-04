#!/usr/bin/env python

from collections import defaultdict
from itertools import chain, imap, groupby
import operator

"""
In order for your code to be compatible with Spark, we are providing you
with this python class that simulates what Spark does partially. Any code
that uses these methods should correspond to what you can use in Spark.
As such, you can turn in what you have to AWS (Spark) with the following
minor changes:

    Replace this class when used in your code with
    SparkContext(appName="SparkApp")

"""
class mapreduce:
    def parallelize(self, c, numSlices):
        return _helper(c)

    def stop(self):
        pass

class _helper:
    def __init__(self, c):
        self.data = c

    def map(self, f):
        self.data = map(f, self.data)
        return self

    def flatMap(self, f):
        self.data = list(chain.from_iterable(imap(f, self.data)))
        return self

    def filter(self, f):
        self.data = filter(f, self.data)
        return self

    def reduce(self, f):
        self.data = reduce(f, self.data)
        return self.collect()

    def sort_order(self, l, key):
        d = defaultdict(list)
        for item in l:
            d[key(item)].append(item)
        return [item for sublist in d.values() for item in sublist]

    def reduceByKey(self, f):
        self.data = map(lambda y: (y[0], reduce(f, map(lambda x: x[1], y[1]))),
            groupby(self.sort_order(self.data, lambda x: x[0]), lambda x: x[0]))
        return self

    def sortBy(self, keyfunc, ascending=True):
        self.data.sort(key=keyfunc, reverse=operator.not_(ascending))
        return self

    def collect(self):
        return self.data

    def count(self):
        return len(self.data)
