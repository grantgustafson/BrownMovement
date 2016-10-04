import csv
import numpy as np

files = ["901", "904", "914", "1086", "2363", "4129", "4255", "4256", "4258", "4259", "4260", "4261", "4262", "4263", "4264", "4265", "4266", "4439", "4440", "4441", "4448", "4449", "4450", "5147", "5794", "5795", "5796", "5798", "5800", "5802", "5806", "5808", "5809", "6022", "6761", "6762", "6763", "6766", "6767", "6768", "6769", "6778", "6787", "6802", "6803", "7057", "7625", "7626", "7896"]
ratty = ["4266", "4260", "4261", "4256", "4255", "4258", "4263", "4262", "4439", "4440", "4441", "4264", "4265", "4259"]
green = ["914", "5798", "6761", "5795", "6762", "5796", "904", "901", "5800", "5802", "5794", "7057", "6768", "5147", "2363", "6767", "6766", "6763", "6769"]
ittleson = ["5808", "5806", "5809"]
outdoor = ["7896", "7626", "7625"]
pembroke = ["6778", "6022", "4129", "1086"]
southwalk = ["6803", "6802"]
barus = ["6787"]
faunce = ["4449", "4450", "4448"]

def main():

	path = "../../../Herts/"
	extension = ".csv"

	#average connection time maps: location to average connection length (in seconds)
	locationConnectionTimeMap = {}

	#number of connections per location
	locationConnectionCount = {}

	#number of distinct users
	locationUserCount = {}

	#divide repeat users by total number connections
	locationRegularsRating = {}

	for dataFile in files:
		filename = path + dataFile + extension
		with open(filename, 'rb') as f:
			reader = csv.reader(f)
			count = 0
			for row in reader:
				if (count > 0):
					startTime = float(row[0])
					endTime = float(row[1])
					userID = str(row[2])
					connectionTime = endTime - startTime
					if dataFile in locationConnectionTimeMap:
						connectionTimeList = locationConnectionTimeMap[dataFile]
						connectionTimeList.append(connectionTime)
						locationConnectionTimeMap[dataFile] = connectionTimeList
					else:
						locationConnectionTimeMap[dataFile] = [connectionTime]

					if dataFile in locationConnectionCount:
						locationConnectionCount[dataFile] = locationConnectionCount[dataFile] + 1
					else:
						locationConnectionCount[dataFile] = 1

					if dataFile in locationUserCount:
						userList = locationUserCount[dataFile]
						if userID not in userList:
							userList[userID] = 1
						else:
							userList[userID] = userList[userID] + 1
						locationUserCount[dataFile] = userList
					else:
						locationUserCount[dataFile] = {userID: 1}
				else:
					count = 1


	for key in locationConnectionTimeMap:
		value1 = locationConnectionTimeMap[key]
		locationConnectionTimeMap[key] = np.mean(value1)
		value2 = locationUserCount[key]
		locationUserCount[key] = len(value2)
		numberUsers = locationUserCount[key]
		numberConnections = locationConnectionCount[key]
		locationRegularsRating[key] = (numberConnections - numberUsers) / float(numberConnections)

		rating = locationRegularsRating[key]
		connectionTime = locationConnectionTimeMap[key]

		locationName = ""
		if key in ratty:
			locationName = "Ratty"

		elif key in green:
			locationName = "Green"

		elif key in barus:
			locationName = "Barus"

		elif key in ittleson:
			locationName = "Ittleson"

		elif key in outdoor:
			locationName = "Outdoor"

		elif key in pembroke:
			locationName = "Pembroke"

		elif key in southwalk:
			locationName = "South Walk"

		elif key in faunce:
			locationName = "Faunce"

		print "The location " + str(key) + " (" + locationName + ") has a regulars rating of " + str(rating) + " and each user stays an average of " + str(connectionTime) + " seconds."

	clusterLocations(locationRegularsRating, locationConnectionTimeMap)

def clusterLocations(locationRegularsRating, locationConnectionTimeMap):

	rattyRating = []
	greenRating = []
	ittlesonRating = []
	outdoorRating = []
	pembrokeRating = []
	southwalkRating = []
	barusRating = []
	faunceRating = []

	rattyConn = []
	greenConn = []
	ittlesonConn = []
	outdoorConn = []
	pembrokeConn = []
	southwalkConn = []
	barusConn = []
	faunceConn = []

	for key in locationRegularsRating:
		rating = locationRegularsRating[key]
		connectionTime = locationConnectionTimeMap[key]

		if key in ratty:
			rattyRating.append(rating)
			rattyConn.append(connectionTime)

		elif key in green:
			greenRating.append(rating)
			greenConn.append(connectionTime)

		elif key in barus:
			barusRating.append(rating)
			barusConn.append(connectionTime)

		elif key in ittleson:
			ittlesonRating.append(rating)
			ittlesonConn.append(connectionTime)

		elif key in outdoor:
			outdoorRating.append(rating)
			outdoorConn.append(connectionTime)

		elif key in pembroke:
			pembrokeRating.append(rating)
			pembrokeConn.append(connectionTime)

		elif key in southwalk:
			southwalkRating.append(rating)
			southwalkConn.append(connectionTime)

		elif key in faunce:
			faunceRating.append(rating)
			faunceConn.append(connectionTime)

		else:
			print "ERROR: something went wrong"

	finals = []
	finals.append((np.mean(rattyRating), np.mean(rattyConn), "Ratty", min(rattyRating), max(rattyRating), min(rattyConn), max(rattyConn)))
	finals.append((np.mean(greenRating), np.mean(greenConn), "Main Green", min(greenRating), max(greenRating), min(greenConn), max(greenConn)))
	finals.append((np.mean(barusRating), np.mean(barusConn), "Mac-BH", min(barusRating), max(barusRating), min(barusConn), max(barusConn)))
	finals.append((np.mean(ittlesonRating), np.mean(ittlesonConn), "Ittleson", min(ittlesonRating), max(ittlesonRating), min(ittlesonConn), max(ittlesonConn)))
	finals.append((np.mean(outdoorRating), np.mean(outdoorConn), "Outdoor", min(outdoorRating), max(outdoorRating), min(outdoorConn), max(outdoorConn)))
	finals.append((np.mean(pembrokeRating), np.mean(pembrokeConn), "Pembroke", min(pembrokeRating), max(pembrokeRating), min(pembrokeConn), max(pembrokeConn)))
	finals.append((np.mean(southwalkRating), np.mean(southwalkConn), "South Walk", min(southwalkRating), max(southwalkRating), min(southwalkConn), max(southwalkConn)))
	finals.append((np.mean(faunceRating), np.mean(faunceConn), "Faunce", min(faunceRating), max(faunceRating), min(faunceConn), max(faunceConn)))

	finals = sorted(finals)
	for final in finals:
		rating = final[0]
		conn = final[1]
		name = final[2]
		minRating = final[3]
		maxRating = final[4]
		minConn = final[5]
		maxConn = final[6]
		print "________________________________________________________________________________________________"
		print str(name)
		print "Regulars average: " + str(rating)
		print "Regulars min: " + str(minRating)
		print "Regulars max: " + str(maxRating)
		print "Connection time average: " + str(conn)
		print "Connection time min: " + str(minConn)
		print "Connection time max: " + str(maxConn)

if __name__ == '__main__':
	main()
