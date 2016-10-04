import datetime
import csv
import numpy as np
import operator
import json

# new files are 4771, 4911, 5154, 6514, 6515, 
files = ["901", "904", "914", "1086", "2363", "4129", "4255", "4256", "4258", "4259", "4260", "4261", "4262", "4263", "4264", "4265", "4266", "4439", "4440", "4441", "4448", "4449", "4450", "5147", "5794", "5795", "5796", "5798", "5800", "5802", "5806", "5808", "5809", "6022", "6761", "6762", "6763", "6766", "6767", "6768", "6769", "6778", "6787", "6802", "6803", "7057", "7625", "7626", "7896", "4771", "4911", "5154", "6514", "6515"]
ratty = ["4266", "4260", "4261", "4256", "4255", "4258", "4263", "4262", "4439", "4440", "4441", "4264", "4265", "4259"]
green = ["914", "5798", "6761", "5795", "6762", "5796", "904", "901", "5800", "5802", "5794", "7057", "6768", "5147", "2363", "6767", "6766", "6763", "6769"]
ittleson = ["5808", "5806", "5809"]
outdoor = ["7896", "7626", "7625"]
pembroke = ["6778", "6022", "4129", "1086"]
southwalk = ["6803", "6802"]
# barus is between barus and macmillan
barus = ["6787"]
faunce = ["4449", "4450", "4448"]
rock = ["6514", "6515"]
scili = ["4771"]
# holley is actually barus and holley building
holley = ["4911"]
hay = ["5154"]


# total exits across all days: zone name -> number of data points
totalExits = {}

# 2 sequence zone names -> count
twoAP = {}

# 3 sequence zone names -> count
threeAP = {}

# 4 sequence zone names -> count
fourAP = {}

# day -> (userID -> [(connect time, zone name)])
userPaths = {}

# AP ID -> Zone name
zones = {}

zoneNames = []

def main():

	#read in ap_groups.json
	zoneFile = open("../../../data/ap_groups.json", "rb")
	zoneData = json.load(zoneFile)
	for zone in zoneData:
		accessPointIDs = zone["aps"]
		zoneName = str(zone["zone"])
		for accessPointID in accessPointIDs:
			zones[str(accessPointID)] = zoneName
			if zoneName not in zoneNames:
				zoneNames.append(zoneName)
	zones['6763'] = 'main_green'

	path = "../../../Herts/"
	extension = ".csv"

	for dataFile in files:
		filename = path + dataFile + extension
		with open(filename, 'rb') as f:
			reader = csv.reader(f)
			count = 0
			numberExits = 0
			for row in reader:
				if (count > 0):
					numberExits += 1
					startTime = float(row[0])
					endTime = float(row[1])
					userID = str(row[2])
					date = datetime.datetime.fromtimestamp(startTime)
					dateString = str(date.month) + "/" + str(date.day) + "/" + str(date.year)

					if dateString in userPaths:
						userPathsThisDay = userPaths[dateString]
						if userID in userPathsThisDay:
							userPath = userPathsThisDay[userID]
							userPath.append((startTime, zones[dataFile]))
							userPathsThisDay[userID] = userPath
						else:
							userPath = []
							userPath.append((startTime, zones[dataFile]))
							userPathsThisDay[userID] = userPath
						userPaths[dateString] = userPathsThisDay
					else:
						userPathsThisDay = {}
						userPathsThisDay[userID] = [(startTime, zones[dataFile])]
						userPaths[dateString] = userPathsThisDay
				else:
					count = 1
			if zones[dataFile] in totalExits:
				totalExits[zones[dataFile]] += numberExits
			else:
				totalExits[zones[dataFile]] = numberExits
			#print numberExits

	#at this point, userPaths and totalExits are populated, now we use userPaths to populate two, three, and four AP maps
	for day in userPaths:
		paths = userPaths[day]
		for userID in paths:
			userPath = paths[userID]
			userPath = sorted(userPath)
			i = 0
			while i < len(userPath) - 1:
				if userPath[i][1] == userPath[i + 1][1]:
					del userPath[i]
				else:
					i += 1
			populateMaps(2, userPath)
			populateMaps(3, userPath)
			populateMaps(4, userPath)

	print len(twoAP)
	print len(threeAP)
	print len(fourAP)

	predictions = {}

	for zone1 in zoneNames:
		for zone2 in zoneNames:
			if zone1 == zone2:
				continue
			for zone3 in zoneNames:
				if zone3 == zone1 or zone3 == zone2:
					continue
				key3 = zone1 + ":" + zone2 + ":" + zone3
				prediction3 = predict([zone1, zone2, zone3])
				if prediction3 != "":
					predictions[key3] = prediction3
			key2 = zone1 + ":" + zone2
			prediction2 = predict([zone1, zone2])
			if prediction2 != "":
				predictions[key2] = prediction2
		key1 = zone1
		prediction1 = predict([zone1])
		if prediction1 != "":
			predictions[key1] = prediction1

	outFile = open("../../../data/predictions.json", "w")
	json.dump(predictions, outFile, indent=4)
	outFile.close()

def populateMaps(num, userPath):
	length = len(userPath)
	if length < num:
		return
	else:
		for i in range(0, (length - num) + 1):
			stringAP = ""
			for j in range(0, num):
				if j != 0:
					stringAP = stringAP + ":"
				pair = userPath[i + j]
				location = pair[1]
				stringAP = stringAP + location
			if num == 2:
				if stringAP in twoAP:
					twoAP[stringAP] = twoAP[stringAP] + 1
				else:
					twoAP[stringAP] = 1
			elif num == 3:
				if stringAP in threeAP:
					threeAP[stringAP] = threeAP[stringAP] + 1
				else:
					threeAP[stringAP] = 1
			elif num == 4:
				if stringAP in fourAP:
					fourAP[stringAP] = fourAP[stringAP] + 1
				else:
					fourAP[stringAP] = 1
			else:
				return


def predict(userPath):
	length = len(userPath)
	if length == 0:
		return max(totalExits.iteritems(), key=operator.itemgetter(1))[0]
	elif length == 1:
		stringAP = userPath[0] + ":"
		currMax = float("-inf")
		currPrediction = ""
		for zone in zoneNames:
			currPath = stringAP + zone
			count = 0
			if currPath in twoAP:
				count = twoAP[currPath]
			if currMax < count:
				currMax = count
				currPrediction = zone
		if currMax == 0:
			return ""
		return currPrediction
	elif length == 2:
		stringAP1 = userPath[0] + ":" + userPath[1] + ":"
		stringAP2 = userPath[0] + ":"
		stringAP3 = userPath[1] + ":"
		currMax = float("-inf")
		currPrediction = ""
		for zone in zoneNames:
			currPath1 = stringAP1 + zone
			currPath2 = stringAP2 + zone
			currPath3 = stringAP3 + zone
			count1 = 0
			count2 = 0
			count3 = 0

			w1 = 1
			w2 = 0
			w3 = 0
			
			if currPath1 in threeAP:
				count1 = threeAP[currPath1]
			if currPath2 in twoAP:
				count2 = twoAP[currPath2]
			if currPath3 in twoAP:
				count3 = twoAP[currPath3]

			value = w1 * count1 + w2 * count2 + w3 * count3
			if currMax < value:
				currMax = value
				currPrediction = zone
		if currMax == 0:
			return ""
		return currPrediction
	else:
		stringAP1 = userPath[length - 3] + ":" + userPath[length - 2] + ":" + userPath[length - 1] + ":"
		stringAP2 = userPath[length - 3] + ":"
		stringAP3 = userPath[length - 2] + ":"
		stringAP4 = userPath[length - 1] + ":"
		stringAP5 = userPath[length - 3] + ":" + userPath[length - 2] + ":"
		stringAP6 = userPath[length - 2] + ":" + userPath[length - 1] + ":"
		stringAP7 = userPath[length - 3] + ":" + userPath[length - 1] + ":"

		# w1 = 10000
		# w2 = 1
		# w3 = 2
		# w4 = 5
		# w5 = 100
		# w6 = 200
		# w7 = 100

		w1 = 1
		w2 = 0
		w3 = 0
		w4 = 0
		w5 = 0
		w6 = 0
		w7 = 0

		currMax = float("-inf")
		currPrediction = ""
		for zone in zoneNames:
			currPath1 = stringAP1 + zone
			currPath2 = stringAP2 + zone
			currPath3 = stringAP3 + zone
			currPath4 = stringAP4 + zone
			currPath5 = stringAP5 + zone
			currPath6 = stringAP6 + zone
			currPath7 = stringAP7 + zone

			count1 = 0
			count2 = 0
			count3 = 0
			count4 = 0
			count5 = 0
			count6 = 0
			count7 = 0

			if currPath1 in fourAP:
				count1 = fourAP[currPath1]
			if currPath2 in twoAP:
				count2 = twoAP[currPath2]
			if currPath3 in twoAP:
				count3 = twoAP[currPath3]
			if currPath4 in twoAP:
				count4 = twoAP[currPath4]
			if currPath5 in threeAP:
				count5 = threeAP[currPath5]
			if currPath6 in threeAP:
				count6 = threeAP[currPath6]
			if currPath7 in threeAP:
				count7 = threeAP[currPath7]

			value = w1 * count1 + w2 * count2 + w3 * count3 + w4 * count4 + w5 * count5 + w6 * count6 + w7 * count7
			if currMax < value:
				currMax = value
				currPrediction = zone
		if currMax == 0:
			print stringAP1
			return ""
		return currPrediction

if __name__ == '__main__':
	main()