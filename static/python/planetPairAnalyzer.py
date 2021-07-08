import os
import sys
from matplotlib import pyplot as plt
import numpy as np
from exoplanetDataHandler import getSortedList, getSystemPlanets
from readables import readableLabels

dataToCompare = ['pl_orbper', 'pl_orbsmax', 'pl_rade', 'pl_bmasse', 'pl_orbeccen', 'pl_eqt', 'pl_dens']

def getSystemPairs(system_planets, data):
    pairs = []
    for host, planets in system_planets.items():
        if len(planets) > 1:
            for i in range(len(planets)):
                if i%2==0:
                    pairs.append((data[planets[i-1]], data[planets[i]]))
    return pairs

def analyze():
    abratios = {}
    data = getSortedList()
    for label in dataToCompare:
        abratios[label] = []
    pairs = getSystemPairs(getSystemPlanets(data), data)
    for pair in pairs:
        for label in dataToCompare:
            if pair[0][label] and pair[1][label]:
                abratios[label].append(pair[0][label]/pair[1][label])
    for label, values in abratios.items():
        abratios[label] = sorted(values)
    return abratios

def plotResults(ratios, plotLabelA, plotLabelB):
    dataA = ratios[plotLabelA]
    dataB = ratios[plotLabelB]
    x = np.array(dataA)
    y = np.array(dataB)

    plt.plot(x, y, color='black')
    plt.xlabel("Ratio of:" + readableLabels[plotLabelA])
    plt.ylabel("Ratio of:" + readableLabels[plotLabelB])
    plt.show()

plotResults(analyze(), dataToCompare[0], dataToCompare[1])