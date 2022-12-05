class CesiumEntity:
    next_id = 0
    def __init__(self,
                 name,
                 position,
                 attitude,
                 alpha=1,
                 useRPY=False,
                 useXYZ=True,
                 viewModel=None):

        self.name = name
        self.position = position
        self.attitude = attitude
        self.alpha = alpha
        self.useRPY = useRPY
        self.useXYZ = useXYZ
        #self.takeoffKey = takeoff_key
        self.viewModel = viewModel
        self.id = CesiumEntity.next_id
        CesiumEntity.next_id += 1


    @classmethod
    def fromJson(cls, json):
        name = json['name']
        position = json['position']
        attitude = json['attitude']
        if "alpha" in json:
            alpha = json['alpha']
        else:
            alpha = 1

        if "useRPY" in json:
            useRPY = json['useRPY']
        else:
            useRPY = False

        if "useXYZ" in json:
            useXYZ = json['useXYZ']
        else:
            useXYZ = True

        if "viewModel" in json:
            viewModel = json['viewModel']
        else:
            viewModel = None

        return cls(
                   name=name,
                   position=position,
                   attitude=attitude,
                   alpha=alpha,
                   useRPY=useRPY,
                   useXYZ=useXYZ,
                   viewModel=viewModel)

    def toJson(self):
        return({"id": self.id,
                     "name": self.name,
                     "alpha": self.alpha,
                     "useXYZ": self.useXYZ,
                     "useRPY": self.useRPY,
                     "position": self.position,
                     "attitude": self.attitude
                     })
