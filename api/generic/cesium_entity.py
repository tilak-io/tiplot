class CesiumEntity:
    def __init__(self,name, 
                 position, 
                 attitude,
                 alpha=1,
                 viewModel=None):

        self.name = name
        self.position = position
        self.attitude = attitude 
        self.alpha = alpha 
        #self.takeoffKey = takeoff_key
        self.viewModel = viewModel
