from http_server import HttpServer
from communication import Comm
import store

#a= store.Store.get()

sv = HttpServer()
com = Comm(server=sv)

com.start()
sv.run()
