from ulgparser import ULGParser
from csvparser import CSVParser
from http_server import HttpServer
from cesium_entity import CesiumEntity

#p = ULGParser()
#p.parse('/home/hamza/Documents/tiplot/logs/first.ulg')
p = CSVParser() 
p.parse('/home/hamza/Documents/tiplot/logs/six.csv')
sv = HttpServer(p)
sv.run()
