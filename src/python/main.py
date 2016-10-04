import datetime
import csv
import numpy as np
from sklearn import cross_validation
from sklearn.neighbors import KNeighborsClassifier
from sklearn import linear_model
from sklearn.svm import SVC
from sklearn.naive_bayes import BernoulliNB
from sklearn import tree

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

	#November 1st 2015 to Marth 10th 2016
	#1447306774
	#Thu, 12 Nov 2015 05:39:34 GMT
	path = "../../../Herts/"
	extension = ".csv"

	numberLocations = len(files)
	locationList6 = []
	locationList3 = []
	locationList1 = []

	for i in range(0, numberLocations):

		toHoldOut = files[i]

		#day to (location to count)
		data = {}
		#earliestDay = float("inf")
		#latestDay = float("-inf")
		for dataFile in files:
			if dataFile != toHoldOut:
				filename = path + dataFile + extension
				with open(filename, 'rb') as f:
					reader = csv.reader(f)
					count = 0
					for row in reader:
						if (count > 0):
							date = datetime.datetime.fromtimestamp(float(row[0]))
							dateString = str(date.month) + "/" + str(date.day) + "/" + str(date.year)
							#thisDay = date.year * 10000 + date.month * 100 + date.day
							#if(thisDay < earliestDay):
							#	earliestDay = thisDay
							#if(thisDay > latestDay):
							#	latestDay = thisDay
							if dateString in data:
								locationCountMap = data[dateString]
								if dataFile in locationCountMap:
									locationCountMap[dataFile] = locationCountMap[dataFile] + 1
								else:
									locationCountMap[dataFile] = 1
								data[dateString] = locationCountMap
							else:
								locationCountMap = {}
								locationCountMap[dataFile] = 1
								data[dateString] = locationCountMap
						else:
							count = 1

		#print earliestDay
		#print latestDay
		setOfAllSchoolDays = ["11/2/2015", "11/3/2015", "11/4/2015", "11/5/2015", "11/6/2015", "11/9/2015", "11/10/2015", "11/11/2015", "11/12/2015", "11/13/2015", "11/16/2015", "11/17/2015", "11/18/2015", "11/19/2015", "11/20/2015", "11/23/2015", "11/24/2015", "11/30/2015", "12/1/2015", "12/2/2015", "12/3/2015", "12/4/2015", "12/7/2015", "12/8/2015", "12/9/2015", "12/10/2015", "12/11/2015", "1/27/2016", "1/28/2016", "1/29/2016", "2/1/2016", "2/2/2016", "2/3/2016", "2/4/2016", "2/5/2016", "2/9/2016", "2/10/2016", "2/11/2016", "2/12/2016", "2/15/2016", "2/16/2016", "2/17/2016", "2/18/2016", "2/19/2016", "2/24/2016", "2/25/2016", "2/26/2016", "2/29/2016", "3/1/2016", "3/2/2016", "3/3/2016", "3/4/2016", "3/7/2016", "3/8/2016", "3/9/2016", "3/10/2016"] 
		#x is a list of (list of counts), where each index in the inner lists represents a location
		x = []
		y = []
		for day in data:
			locationCountMap = data[day]
			toAdd = []
			for location in files:
				if location in locationCountMap:
					toAdd.append(locationCountMap[location])
				else:
					toAdd.append(0)
			x.append(toAdd)
			if day in setOfAllSchoolDays:
				#1 indicates a school day
				y.append(1)
			else:
				#0 indicates a non-school day
				y.append(0)

		#"Training" the data (which in this case is just maintaining these training pairs for later use)
		y = np.array(y)

		# K nearest neighbors
		neighbors = KNeighborsClassifier()
		neighbors.fit(x, y)

		# SGD
		sgd = linear_model.SGDClassifier()
		sgd.fit(x, y)

		# SVC
		svc = SVC()
		svc.fit(x, y)

		# Bernoulli Naive Bayes
		nb = BernoulliNB()
		nb.fit(x, y)

		# Decision tree
		decisionTree = tree.DecisionTreeClassifier()
		decisionTree.fit(x, y)

		toAdd6 = []
		toAdd3 = []
		toAdd1 = []

		scores1 = cross_validation.cross_val_score(neighbors, x, y, cv=5)
		scores2 = cross_validation.cross_val_score(sgd, x, y, cv=5)
		scores3 = cross_validation.cross_val_score(svc, x, y, cv=5)
		scores4 = cross_validation.cross_val_score(nb, x, y, cv=5)
		scores5 = cross_validation.cross_val_score(decisionTree, x, y, cv=5)

		toAdd6.append(np.mean(scores1))
		toAdd6.append(np.mean(scores2))
		toAdd6.append(np.mean(scores3))
		toAdd6.append(np.mean(scores4))
		toAdd6.append(np.mean(scores5))

		#using best 3 classifiers, neighbors, sgd, decision tree
		toAdd3.append(np.mean(scores1))
		toAdd3.append(np.mean(scores2))
		toAdd3.append(np.mean(scores5))

		#using best classifier, neighbors
		toAdd1.append(np.mean(scores1))

		averageAccuracy6 = np.mean(toAdd6)
		averageAccuracy3 = np.mean(toAdd3)
		averageAccuracy1 = np.mean(toAdd1)

		locationList6.append((averageAccuracy6, i))
		locationList3.append((averageAccuracy3, i))
		locationList1.append((averageAccuracy1, i))

	print "*****************************"
	print "Average of all 6 classifier methods:"
	clusterLocations(locationList6)

	print "*****************************"
	print "Average of best 3 classifier methods:"
	clusterLocations(locationList3)

	print "*****************************"
	print "Using only best classifier method:"
	clusterLocations(locationList1)

def clusterLocations(locationList):

	rattyAcc = []
	greenAcc = []
	ittlesonAcc = []
	outdoorAcc = []
	pembrokeAcc = []
	southwalkAcc = []
	barusAcc = []
	faunceAcc = []

	for location in locationList:
		file = files[location[1]]
		accuracy = location[0]

		if file in ratty:
			rattyAcc.append(accuracy)

		elif file in green:
			greenAcc.append(accuracy)

		elif file in barus:
			barusAcc.append(accuracy)

		elif file in ittleson:
			ittlesonAcc.append(accuracy)

		elif file in outdoor:
			outdoorAcc.append(accuracy)

		elif file in pembroke:
			pembrokeAcc.append(accuracy)

		elif file in southwalk:
			southwalkAcc.append(accuracy)

		elif file in faunce:
			faunceAcc.append(accuracy)

		else:
			print "ERROR: something went wrong"


	finalAccuracies = []
	finalAccuracies.append((np.mean(rattyAcc), "Ratty", min(rattyAcc), max(rattyAcc)))
	finalAccuracies.append((np.mean(greenAcc), "Main Green", min(greenAcc), max(greenAcc)))
	finalAccuracies.append((np.mean(barusAcc), "Mac-BH", min(barusAcc), max(barusAcc)))
	finalAccuracies.append((np.mean(ittlesonAcc), "Ittleson", min(ittlesonAcc), max(ittlesonAcc)))
	finalAccuracies.append((np.mean(outdoorAcc), "Outdoor", min(outdoorAcc), max(outdoorAcc)))
	finalAccuracies.append((np.mean(pembrokeAcc), "Pembroke", min(pembrokeAcc), max(pembrokeAcc)))
	finalAccuracies.append((np.mean(southwalkAcc), "South Walk", min(southwalkAcc), max(southwalkAcc)))
	finalAccuracies.append((np.mean(faunceAcc), "Faunce", min(faunceAcc), max(faunceAcc)))

	finalAccuracies = sorted(finalAccuracies)
	for final in finalAccuracies:
		accuracy = final[0]
		print "_____________________________"
		print final[1]
		print "Average: " + str(accuracy)
		print "Min: " + str(final[2])
		print "Max: " + str(final[3])

if __name__ == '__main__':
	main()
