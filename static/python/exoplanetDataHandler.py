import csv
import os

# i would like to eventually get this using a web request... but is it worth it? I don't think the archive is being updated
FILE_NAME = os.path.dirname(os.path.dirname(__file__)) + '/csv/exoplanetData.csv'

# found out how to use the api... it's slow
# docs: https://exoplanetarchive.ipac.caltech.edu/docs/TAP/usingTAP.html
# more docs: https://exoplanetarchive.ipac.caltech.edu/docs/program_interfaces.html
QUERY_URL = "https://exoplanetarchive.ipac.caltech.edu/TAP/sync?query=select+pl_name,hostname,disc_year,discoverymethod,pl_orbper,pl_rade,pl_masse,pl_bmasse,pl_dens,sy_dist,st_metratio,pl_refname,st_refname,dec+from+ps&format=csv"

def getSortedColumnName():
    "Returns dictionary where key pl_name = list of planet data"
    column_names = None
    data = {}

    with open(FILE_NAME) as csv_file:
        csv_reader = csv.reader(csv_file, delimiter=',')
        line_count = 0
        for row in csv_reader:
            if row[0][0] == '#':
                continue
            
            if line_count == 0:
                column_names = row

                for name in column_names:
                    data[name] = []
            else:
                for i in range(len(row)):
                    index = column_names[i]
                    data[index].append(row[i])
            line_count += 1

    # with open('exoplanetsDict.py', 'w+') as newF:
    #     newF.write('data=' + str(data))
    return data

def getSortedList():
    """Returns list of planets, with no repetitions."""
    column_names = None
    data = []
    used_names = []
    used_indices = []

    with open(FILE_NAME) as csv_file:
        csv_reader = csv.reader(csv_file, delimiter=',')
        line_count = 0
        for row in csv_reader:
            if row[0][0] == '#':
                continue
            
            if line_count == 0:
                column_names = row
            else:
                planetDict = {}
                used = False
                for i in range(len(row)):
                    index = column_names[i]
                    val = row[i]
                    try:
                        val = int(val)
                    except:
                        try:
                            val = float(val)
                        except:
                            pass
                    
                    if index=='loc_rowid':
                        val = len(data)
                    if index == 'pl_name':
                        if val in used_names:
                            # need to combine values
                            used = True
                        else:
                            used_names.append(val)
                    planetDict[index] = val
                if used:
                    # for index in range(len(data)):
                    index = used_names.index(planetDict['pl_name'])
                    if data[index]['pl_name'] == planetDict['pl_name']:
                        existingData = data[index]
                        for key, val in planetDict.items():
                            if key != "loc_rowid" and existingData[key] != planetDict[key]:
                                existingData[key] = planetDict[key]
                else:
                    data.append(planetDict)
            line_count += 1

    # with open('exoplanetsList.py', 'w+') as newF:
    #     newF.write('data=' + str(data))
    return data

def getSystemPlanets(data):
    """Returns a dictionary where key = hostname and value = list of planets from data which is a list of planet data"""
    hosts = {}
    for planet_id in range(len(data)):
        planet = data[planet_id]
        hostname = planet['hostname']
        if not hostname in hosts:
            hosts[hostname] = []
        hosts[hostname].append(planet_id)
    return hosts