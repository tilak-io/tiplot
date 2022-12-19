class CesiumEntity:
    next_id = 0
    def __init__(self,
                 name,
                 position,
                 attitude,
                 color="white",
                 wireframe=False,
                 tracked=True,
                 pathColor="blue",
                 alpha=1,
                 useRPY=False,
                 useXYZ=True,
                 viewModel=None):

        self.name = name
        self.color = color
        self.wireframe = wireframe
        self.pathColor = pathColor
        self.position = position
        self.attitude = attitude
        self.alpha = alpha
        self.useRPY = useRPY
        self.useXYZ = useXYZ
        self.tracked = tracked
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

        if "pathColor" in json:
            pathColor = json['pathColor']
        else:
            pathColor = "blue"

        if "color" in json:
            color = json['color']
        else:
            color = "white"


        if "wireframe" in json:
            wireframe = json['wireframe']
        else:
            wireframe = False

        if "tracked" in json:
            tracked = json['tracked']
        else:
            tracked = True

        return cls(
                   name=name,
                   color=color,
                   wireframe=wireframe,
                   pathColor=pathColor,
                   position=position,
                   attitude=attitude,
                   alpha=alpha,
                   useRPY=useRPY,
                   useXYZ=useXYZ,
                   tracked=tracked,
                   viewModel=viewModel)

    def toJson(self):
        return({"id": self.id,
                "name": self.name,
                "color": self.color,
                "wireframe": self.wireframe,
                "pathColor": self.pathColor,
                "alpha": self.alpha,
                "useXYZ": self.useXYZ,
                "useRPY": self.useRPY,
                "tracked": self.tracked,
                "position": self.position,
                "attitude": self.attitude
                })
