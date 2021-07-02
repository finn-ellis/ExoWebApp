from flask import Flask, render_template
from exoplanetDataHandler import getSortedList, getSystemPlanets
from static.python.readables import readableLabels
import json

# need to find a way to gradually show planets. there are around 4,400 planets in the dataset
exoplanets = getSortedList()[1:500]
systemPlanets = getSystemPlanets(exoplanets)

def getViewInfo(exoplanet):
    
    view_categories = ['pl_name', 'hostname', 'disc_year', 'discoverymethod', 'pl_orbper', 'pl_rade', 'pl_bmasse', 'sy_dist', 'st_metratio', 'pl_refname', 'st_refname']
    view_info = []
    for category in view_categories:
        name = readableLabels[category]
        data = exoplanet[category]
        if data=='':
            data = "No Data"
        view_info.append([name, data])
    return view_info

def create_app():
    app = Flask(__name__, instance_relative_config=True)
    app.config.from_mapping(
        SECRET_KEY='dev',
    )

    @app.route('/')
    def home():
        return render_template('home.html')

    @app.route('/about')
    def about():
        return render_template('about.html')

    @app.route('/explore')
    def explore():
        return render_template('explore.html', exoplanets=exoplanets)

    @app.route('/explore/<int:id>')
    def exploreSpecific(id):
        exoplanet = exoplanets[id]
        view_info = getViewInfo(exoplanet)
        return render_template('explore.html', exoplanets=exoplanets, exoplanet=exoplanet, view_info=view_info)

    @app.route('/viewplanet/<int:id>')
    def viewplanet(id):
        exoplanet = exoplanets[id]
        view_info = getViewInfo(exoplanet)
        planetsInSystem = systemPlanets[exoplanet['hostname']]
        planetList = []
        for planetId in planetsInSystem:
            planetList.append(exoplanets[planetId])
        planetList = json.dumps(planetList)
        return render_template('viewplanet.html', exoplanet=exoplanet, view_info=view_info, system_planets=planetList)

    return app

app = create_app()
app.run()